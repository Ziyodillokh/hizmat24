import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActorType, AdminRole, AuditAction, type AdminUser } from '@prisma/client';
import { createHmac, randomBytes } from 'node:crypto';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import type { RequestContext } from '@client/common/http/request-context';
import type { AppEnv } from '@client/infra/config/env.validation';
import { AuditService } from '@client/modules/audit/audit.service';
import { sectionsFor, type AdminSection } from '../admin-permissions';
import { lockStatus, registerFailure, clearedState } from './admin-lockout';
import { isSessionAlive, secondsUntilIdleLogout, shouldTouch } from './admin-session';
import { verifyPassword } from './admin-password';
import { isLeakedPassword } from './password-policy';

/**
 * Kirish soʻrovining konteksti — audit yozuvi uchun.
 *
 * Taʼrifi `common/http/request-context.ts` ga koʻchirildi: aynan shu ikki
 * maydonni admin boʻlimlari ham, mijoz endpointlari ham yozadi. Mavjud
 * import yoʻllari buzilmasligi uchun bu yerdan qayta eksport qilinadi.
 */
export type { RequestContext };

export interface AdminIdentity {
  id: string;
  email: string;
  fullName: string;
  role: AdminRole;
  sections: AdminSection[];
  idleTimeoutSeconds: number;
}

export interface SignedIn {
  token: string;
  admin: AdminIdentity;
}

/**
 * Admin kirishi: email + parol → sessiya tokeni.
 *
 * Autentifikator (TOTP) bosqichi 2026-09-30 da EGASINING qaroriga koʻra
 * olib tashlandi — kirish sodda boʻlishi soʻralgan. Demak parol yagona
 * toʻsiq, va uni himoyalaydigan qolgan choralar oʻz kuchida qoladi:
 * ketma-ket 5 xatodan keyin 15 daqiqalik blok, IP boʻyicha cheklov,
 * sizib chiqqan parollar taqiqi va faolsizlikdan avtomatik chiqish.
 *
 * Bazadagi `totpSecret` va `totpEnabledAt` ustunlari OʻCHIRILMADI:
 * migratsiyalar faqat qoʻshimcha boʻladi va ikkinchi bosqich qaytarilsa
 * ular oʻz joyida turadi.
 */
@Injectable()
export class AdminAuthService {
  private readonly secret: string;
  private readonly idleTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    config: ConfigService<AppEnv, true>,
  ) {
    this.secret = config.get('ADMIN_TOKEN_SECRET', { infer: true });
    this.idleTtlMs = config.get('ADMIN_SESSION_IDLE_MINUTES', { infer: true }) * 60 * 1000;
  }

  /** Kirish: email + parol. */
  async signInWithPassword(
    email: string,
    password: string,
    context: RequestContext,
  ): Promise<SignedIn> {
    const normalized = email.trim().toLowerCase();
    const admin = await this.prisma.adminUser.findUnique({ where: { email: normalized } });
    const now = new Date();

    // Hisob yoʻq boʻlsa ham parol tekshiriladi: javob vaqti boʻyicha
    // "bu email bor" degan xulosa chiqarib boʻlmasligi kerak.
    const stored = admin?.passwordHash ?? DUMMY_HASH;
    const passwordOk = await verifyPassword(password, stored);

    if (!admin || !admin.isActive) {
      await this.recordFailure(normalized, context, 'notopildi');
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const lock = lockStatus(admin, now);
    if (lock.locked) {
      throw new ForbiddenException(
        `Hisob vaqtincha bloklandi. ${Math.ceil(lock.retryAfterSeconds / 60)} daqiqadan keyin urinib koʻring`,
      );
    }

    if (!passwordOk) {
      const next = registerFailure(admin, now);
      await this.prisma.adminUser.update({ where: { id: admin.id }, data: next });
      await this.recordFailure(normalized, context, 'parol', admin.id);

      if (next.lockedUntil) {
        await this.audit.record({
          action: AuditAction.ADMIN_LOCKED,
          actorType: ActorType.ADMIN,
          actorId: admin.id,
          metadata: { email: normalized, attempts: next.failedAttempts },
          ...context,
        });
        throw new ForbiddenException(
          'Hisob 15 daqiqaga bloklandi — ketma-ket 5 marta notoʻgʻri parol kiritildi',
        );
      }

      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Parol TOʻGʻRI, lekin ochiq manbada koʻringan qiymat boʻlsa — kirish
    // baribir berilmaydi. Taqiq hisob yaratishda emas, aynan SHU YERDA
    // kuchga kiradi: yaratishdagi tekshiruv bazada allaqachon turgan eski
    // hashlarga taʼsir qilmaydi, ular esa repo tarixidan hammaga maʼlum.
    // Lockout hisoblagichiga tegilmaydi: parolni bilgan odam hujumchi emas,
    // hisob egasi — uni bloklash muammoni hal qilmaydi, faqat yashiradi.
    if (isLeakedPassword(password)) {
      await this.recordFailure(normalized, context, 'sizib-chiqqan', admin.id);
      throw new ForbiddenException(LEAKED_PASSWORD);
    }

    return this.openSession(admin, now, context);
  }

  /**
   * Sessiya yaratish — kirish muvaffaqiyatli tugaganda.
   *
   * Xato hisoblagichi SHU YERDA tozalanadi: bloklanishga olib kelgan
   * urinishlar muvaffaqiyatli kirishdan keyin yashab qolmasligi kerak.
   */
  private async openSession(
    admin: AdminUser,
    now: Date,
    context: RequestContext,
  ): Promise<SignedIn> {
    const rawToken = randomBytes(48).toString('base64url');

    await this.prisma.$transaction([
      this.prisma.adminUser.update({
        where: { id: admin.id },
        data: { ...clearedState(), lastLoginAt: now },
      }),
      this.prisma.adminSession.create({
        data: {
          adminId: admin.id,
          tokenHash: this.hashToken(rawToken),
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
      }),
    ]);

    await this.audit.record({
      action: AuditAction.ADMIN_LOGIN_SUCCEEDED,
      actorType: ActorType.ADMIN,
      actorId: admin.id,
      metadata: { email: admin.email, role: admin.role },
      ...context,
    });

    return { token: rawToken, admin: this.present(admin, this.idleTtlMs / 1000) };
  }

  /**
   * Har bir himoyalangan soʻrovda chaqiriladi.
   *
   * `null` — sessiya yoʻq, bekor qilingan yoki faolsizlikdan oʻlgan.
   * Guard bu uchtasini ajratmaydi: hammasi 401.
   */
  async resolveSession(rawToken: string): Promise<AdminIdentity | null> {
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
      include: { admin: true },
    });

    const now = new Date();
    if (!session || !isSessionAlive(session, now, this.idleTtlMs)) return null;
    if (!session.admin.isActive) return null;

    if (shouldTouch(session.lastSeenAt, now)) {
      await this.prisma.adminSession.update({
        where: { id: session.id },
        data: { lastSeenAt: now },
      });
    }

    return this.present(
      session.admin,
      secondsUntilIdleLogout({ ...session, lastSeenAt: now }, now, this.idleTtlMs),
    );
  }

  async signOut(rawToken: string, context: RequestContext): Promise<void> {
    const session = await this.prisma.adminSession.findUnique({
      where: { tokenHash: this.hashToken(rawToken) },
    });
    if (!session || session.revokedAt) return;

    await this.prisma.adminSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    await this.audit.record({
      action: AuditAction.ADMIN_LOGGED_OUT,
      actorType: ActorType.ADMIN,
      actorId: session.adminId,
      ...context,
    });
  }

  private present(admin: AdminUser, idleTimeoutSeconds: number): AdminIdentity {
    return {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
      sections: sectionsFor(admin.role),
      idleTimeoutSeconds,
    };
  }

  private recordFailure(
    email: string,
    context: RequestContext,
    reason: 'notopildi' | 'parol' | 'totp' | 'sizib-chiqqan',
    adminId?: string,
  ): Promise<void> {
    return this.audit.record({
      action: AuditAction.ADMIN_LOGIN_FAILED,
      actorType: ActorType.ADMIN,
      actorId: adminId ?? null,
      metadata: { email, reason },
      ...context,
    });
  }

  /** Sessiya tokeni bazada OCHIQ saqlanmaydi — faqat HMAC hashi. */
  private hashToken(rawToken: string): string {
    return createHmac('sha256', this.secret).update(rawToken).digest('hex');
  }

}

/**
 * Email topilmaganda ham parol tekshiriladi — javob vaqti bir xil qolsin.
 * Bu hash hech qanday parolga mos kelmaydi (tuz va kalit tasodifiy).
 */
const DUMMY_HASH =
  'scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

/** Email yoʻqmi, parol notoʻgʻrimi — foydalanuvchiga bitta javob. */
const INVALID_CREDENTIALS = 'Email yoki parol notoʻgʻri';

/**
 * NEGA kirish oʻrniga aniq matn: bu yerda "email yoki parol notoʻgʻri"
 * deyish yolgʻon boʻlardi — parol toʻgʻri. Xabar maxfiy hech narsani
 * ochmaydi (roʻyxat ochiq manbada), lekin hisob egasiga nima qilish
 * kerakligini aniq aytadi. Panelda parol almashtirish oynasi hali yoʻq,
 * shuning uchun matn ishlaydigan yoʻlni — CLI buyrugʻini koʻrsatadi.
 */
const LEAKED_PASSWORD =
  'Bu parol ochiq manbada koʻringan va mangu taqiqlangan. Kirish uchun ' +
  'administrator "npm run admin:create" buyrugʻi bilan parolni almashtirishi shart.';
