import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus, type User } from '@prisma/client';
import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import {
  OTP_LENGTH,
  OTP_MAX_VERIFY_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
} from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { DomainException } from '@client/common/exceptions/domain.exception';
import type { AppEnv } from '@client/infra/config/env.validation';
import { maskPhoneNumber } from '@client/common/utils/phone.util';
import { SmsService } from './sms/sms.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RequestOtpResult {
  sent: boolean;
  retryAfterSeconds: number;
  /** Faqat development/test muhitida to'ldiriladi. */
  debugCode?: string;
}

export interface UserView {
  id: string;
  phoneNumber: string;
  fullName: string | null;
  status: UserStatus;
  defaultAddress: unknown;
}

const presentUser = (user: User): UserView => ({
  id: user.id,
  phoneNumber: user.phoneNumber,
  fullName: user.fullName,
  status: user.status,
  defaultAddress: user.defaultAddress,
});

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly sms: SmsService,
  ) {}

  /** OTP so'rash. Rate limit: 1 daqiqada 1 marta (xavfsizlik talabi 6.3). */
  async requestOtp(phoneNumber: string): Promise<RequestOtpResult> {
    const lastRequest = await this.prisma.otpRequest.findFirst({
      where: { phoneNumber },
      orderBy: { createdAt: 'desc' },
    });

    if (lastRequest) {
      const elapsedMs = Date.now() - lastRequest.createdAt.getTime();
      if (elapsedMs < OTP_RESEND_COOLDOWN_MS) {
        throw new DomainException(
          'OTP_COOLDOWN',
          "Yangi kod so'rash uchun biroz kuting",
          HttpStatus.TOO_MANY_REQUESTS,
          { retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsedMs) / 1000) },
        );
      }
    }

    const code = this.generateOtpCode();

    await this.prisma.otpRequest.create({
      data: {
        phoneNumber,
        codeHash: this.hashOtp(phoneNumber, code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    await this.sms.sendOtp(phoneNumber, code);
    this.logger.log({ phone: maskPhoneNumber(phoneNumber) }, 'OTP yuborildi');

    return {
      sent: true,
      retryAfterSeconds: Math.ceil(OTP_RESEND_COOLDOWN_MS / 1000),
      ...(this.config.get('OTP_DEBUG_RETURN_CODE', { infer: true }) ? { debugCode: code } : {}),
    };
  }

  /** OTP tekshirish → foydalanuvchi yaratiladi/topiladi va tokenlar beriladi. */
  async verifyOtp(phoneNumber: string, otpCode: string): Promise<AuthTokens & { user: UserView }> {
    const request = await this.prisma.otpRequest.findFirst({
      where: { phoneNumber, consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!request) {
      throw new DomainException(
        'OTP_INVALID',
        "Kod noto'g'ri yoki muddati tugagan",
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Urinishni ATOMAR "band qilish": tekshirish va oshirish bitta so'rovda.
    // Aks holda parallel so'rovlar bir xil `attempts` qiymatini o'qib,
    // urinishlar chegarasini chetlab o'tib ketardi.
    const attemptClaimed = await this.prisma.otpRequest.updateMany({
      where: { id: request.id, consumedAt: null, attempts: { lt: OTP_MAX_VERIFY_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });

    if (attemptClaimed.count === 0) {
      throw new DomainException(
        'OTP_ATTEMPTS_EXCEEDED',
        "Urinishlar soni tugadi, yangi kod so'rang",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!this.matchesOtpHash(request.codeHash, this.hashOtp(phoneNumber, otpCode))) {
      throw new DomainException('OTP_INVALID', "Kod noto'g'ri", HttpStatus.UNAUTHORIZED);
    }

    // Kodni bir martalik qilish ham atomar: parallel ikkita to'g'ri so'rovdan
    // faqat bittasi sessiya oladi.
    const consumed = await this.prisma.otpRequest.updateMany({
      where: { id: request.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    if (consumed.count === 0) {
      throw new DomainException(
        'OTP_INVALID',
        'Kod allaqachon ishlatilgan',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.prisma.user.upsert({
      where: { phoneNumber },
      update: {},
      create: { phoneNumber },
    });

    this.assertUserActive(user);

    const issued = await this.issueTokens(user.id, user.phoneNumber, randomUUID());
    return { ...issued.tokens, user: presentUser(user) };
  }

  /**
   * Refresh token rotation + reuse detection (9.1).
   * Allaqachon ishlatilgan token qayta kelsa — butun oila bekor qilinadi.
   */
  async refresh(rawToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashRefreshToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new DomainException('REFRESH_INVALID', 'Token yaroqsiz', HttpStatus.UNAUTHORIZED);
    }

    if (stored.revokedAt) {
      await this.revokeFamily(stored.userId, stored.familyId);
      throw new DomainException(
        'REFRESH_REUSED',
        'Token qayta ishlatildi, iltimos qaytadan kiring',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new DomainException(
        'REFRESH_EXPIRED',
        'Token muddati tugagan',
        HttpStatus.UNAUTHORIZED,
      );
    }

    this.assertUserActive(stored.user);

    // Tokenni ATOMAR bekor qilamiz. Ikkita parallel so'rovdan faqat bittasi
    // yutadi; yutqazgani qayta ishlatish hisoblanadi va butun oila yopiladi.
    // Bu bo'lmasa, o'g'irlangan token bilan parallel sessiya sezilmay qolardi.
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (claimed.count === 0) {
      await this.revokeFamily(stored.userId, stored.familyId);
      throw new DomainException(
        'REFRESH_REUSED',
        'Token qayta ishlatildi, iltimos qaytadan kiring',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const issued = await this.issueTokens(stored.userId, stored.user.phoneNumber, stored.familyId);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { replacedById: issued.refreshTokenId },
    });

    return issued.tokens;
  }

  async logout(userId: string, rawToken: string): Promise<void> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashRefreshToken(rawToken) },
    });

    if (!stored || stored.userId !== userId) return;

    await this.prisma.refreshToken.updateMany({
      where: { familyId: stored.familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async findActiveUser(userId: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user && user.status === UserStatus.ACTIVE ? user : null;
  }

  private assertUserActive(user: User): void {
    if (user.status === UserStatus.BLOCKED) {
      throw new DomainException(
        'USER_BLOCKED',
        "Hisobingiz bloklangan, qo'llab-quvvatlash xizmatiga murojaat qiling",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async issueTokens(
    userId: string,
    phoneNumber: string,
    familyId: string,
  ): Promise<{ tokens: AuthTokens; refreshTokenId: string }> {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, phoneNumber },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
      },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const ttlDays = this.config.get('JWT_REFRESH_TTL_DAYS', { infer: true });

    const created = await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: this.hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    });

    return {
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: this.config.get('JWT_ACCESS_TTL', { infer: true }),
      },
      refreshTokenId: created.id,
    };
  }

  private generateOtpCode(): string {
    const max = 10 ** OTP_LENGTH;
    return randomInt(0, max).toString().padStart(OTP_LENGTH, '0');
  }

  /** Sessiya oilasini to'liq bekor qilish (token o'g'irlanganda). */
  private async revokeFamily(userId: string, familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.error(
      { userId, familyId },
      'Refresh token qayta ishlatildi — barcha sessiyalar bekor qilindi',
    );
  }

  /**
   * OTP hashi uchun JWT siridan ALOHIDA sir ishlatiladi: bitta sir sizib
   * chiqqanda ham token soxtalashtirish, ham 6 xonali kodni offline
   * brute-force qilish imkoni paydo bo'lmasin.
   */
  private hashOtp(phoneNumber: string, code: string): string {
    return createHmac('sha256', this.config.get('OTP_HASH_SECRET', { infer: true }))
      .update(`${phoneNumber}:${code}`)
      .digest('hex');
  }

  /** Sir asosidagi qiymatlarni taqqoslash — har doim doimiy vaqtda. */
  private matchesOtpHash(expected: string, actual: string): boolean {
    const expectedBuffer = Buffer.from(expected, 'hex');
    const actualBuffer = Buffer.from(actual, 'hex');

    return (
      expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
    );
  }

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
