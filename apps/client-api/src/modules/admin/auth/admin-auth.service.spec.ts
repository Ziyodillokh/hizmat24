import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { AdminRole, AuditAction, type AdminUser } from '@prisma/client';
import { authenticator } from 'otplib';
import type { AuditService } from '@client/modules/audit/audit.service';
import type { PrismaService } from '@client/infra/prisma/prisma.service';
import { AdminAuthService } from './admin-auth.service';
import { hashPassword } from './admin-password';
import { MAX_FAILED_ATTEMPTS } from './admin-lockout';

const PASSWORD = 'Juda-Kuchli-Parol-2026';
const CONTEXT = { ipAddress: '10.0.0.1', userAgent: 'jest' };
const ENV: Record<string, unknown> = {
  ADMIN_TOKEN_SECRET: 'a'.repeat(48),
  ADMIN_SESSION_IDLE_MINUTES: 30,
  ADMIN_TOTP_ISSUER: 'Hizmat24',
};

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let admin: AdminUser;
  let prisma: {
    adminUser: { findUnique: jest.Mock; update: jest.Mock };
    adminSession: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { record: jest.Mock };

  const build = async (overrides: Partial<AdminUser> = {}): Promise<AdminUser> => ({
    id: '11111111-1111-4111-8111-111111111111',
    email: 'admin@hizmat24.uz',
    fullName: 'Admin Boshqaruvchi',
    passwordHash: await hashPassword(PASSWORD),
    role: AdminRole.SUPERADMIN,
    totpSecret: authenticator.generateSecret(),
    totpEnabledAt: new Date('2026-09-01T00:00:00.000Z'),
    isActive: true,
    failedAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    admin = await build();
    prisma = {
      adminUser: {
        findUnique: jest.fn().mockImplementation(({ where }: { where: Record<string, string> }) =>
          Promise.resolve(
            where.email === admin.email || where.id === admin.id ? admin : null,
          ),
        ),
        update: jest.fn().mockResolvedValue(admin),
      },
      adminSession: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    service = new AdminAuthService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      { get: (key: string) => ENV[key] } as unknown as ConfigService<never, true>,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const loginOk = () => service.signInWithPassword(admin.email, PASSWORD, CONTEXT);

  describe('1-bosqich: parol', () => {
    it('toʻgʻri parol sessiya EMAS, chipta beradi', async () => {
      const result = await loginOk();

      expect(result.stage).toBe('totp');
      expect(result.challengeToken).toContain(admin.id);
    });

    it('registri farq qilgan email ham topiladi', async () => {
      await expect(
        service.signInWithPassword('  ADMIN@Hizmat24.UZ ', PASSWORD, CONTEXT),
      ).resolves.toMatchObject({ stage: 'totp' });
    });

    it('notoʻgʻri parolda 401 va bir xil matn', async () => {
      await expect(
        service.signInWithPassword(admin.email, 'boshqa-parol', CONTEXT),
      ).rejects.toThrow('Email yoki parol notoʻgʻri');
    });

    it('mavjud boʻlmagan emailda HAM oʻsha matn — hisob borligi oshkor boʻlmaydi', async () => {
      await expect(
        service.signInWithPassword('yoq@hizmat24.uz', PASSWORD, CONTEXT),
      ).rejects.toThrow('Email yoki parol notoʻgʻri');
    });

    it('oʻchirilgan hisob kirita olmaydi', async () => {
      admin = await build({ isActive: false });

      await expect(loginOk()).rejects.toThrow(UnauthorizedException);
    });

    it('har bir muvaffaqiyatsiz urinish auditga tushadi', async () => {
      await expect(
        service.signInWithPassword(admin.email, 'boshqa-parol', CONTEXT),
      ).rejects.toThrow();

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ADMIN_LOGIN_FAILED,
          ipAddress: '10.0.0.1',
        }),
      );
    });

    it(`${MAX_FAILED_ATTEMPTS}-xatoda hisobni bloklaydi va auditga yozadi`, async () => {
      admin = await build({ failedAttempts: MAX_FAILED_ATTEMPTS - 1 });

      await expect(
        service.signInWithPassword(admin.email, 'boshqa-parol', CONTEXT),
      ).rejects.toThrow(ForbiddenException);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ADMIN_LOCKED }),
      );
    });

    it('bloklangan hisobda toʻgʻri parol ham oʻtmaydi', async () => {
      admin = await build({
        failedAttempts: MAX_FAILED_ATTEMPTS,
        lockedUntil: new Date(Date.now() + 60_000),
      });

      await expect(loginOk()).rejects.toThrow(/bloklandi/);
    });

    it('TOTP ulanmagan boʻlsa QR havolasini beradi va sirni saqlaydi', async () => {
      admin = await build({ totpSecret: null, totpEnabledAt: null });

      const result = await loginOk();

      expect(result.enrollmentUri).toContain('otpauth://totp/');
      expect(prisma.adminUser.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ totpSecret: expect.any(String) }) }),
      );
    });

    it('TOTP allaqachon ulangan boʻlsa QR qaytarmaydi', async () => {
      expect((await loginOk()).enrollmentUri).toBeNull();
    });
  });

  describe('2-bosqich: TOTP', () => {
    const passTotp = async () => {
      const { challengeToken } = await loginOk();
      return service.signInWithTotp(
        challengeToken,
        authenticator.generate(admin.totpSecret as string),
        CONTEXT,
      );
    };

    it('toʻgʻri kod sessiya tokeni beradi', async () => {
      const result = await passTotp();

      expect(result.stage).toBe('ready');
      expect(result.token.length).toBeGreaterThan(40);
    });

    it('javobda admin roli va boʻlimlari boʻladi', async () => {
      const { admin: identity } = await passTotp();

      expect(identity.role).toBe(AdminRole.SUPERADMIN);
      expect(identity.sections).toContain('catalog');
      expect(identity.idleTimeoutSeconds).toBe(1800);
    });

    it('sessiya tokeni bazaga OCHIQ yozilmaydi', async () => {
      const { token } = await passTotp();
      const written = JSON.stringify(prisma.$transaction.mock.calls);

      expect(written).not.toContain(token);
    });

    it('notoʻgʻri kodni rad etadi', async () => {
      const { challengeToken } = await loginOk();

      await expect(service.signInWithTotp(challengeToken, '000000', CONTEXT)).rejects.toThrow(
        'Tasdiqlash kodi notoʻgʻri',
      );
    });

    it('soxta chiptani rad etadi', async () => {
      await expect(
        service.signInWithTotp(`${admin.id}.${Date.now() + 60_000}.soxta`, '123456', CONTEXT),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('muddati oʻtgan chiptani rad etadi', async () => {
      const { challengeToken } = await loginOk();

      // Xizmat `new Date()` ishlatadi, `Date.now()` ni emas — shuning uchun
      // soatni butunlay oldinga suramiz. `jest.spyOn(Date, 'now')` bu yerda
      // hech narsa qilmaydi va mok keyingi testlarga oqib ketardi.
      jest.useFakeTimers().setSystemTime(new Date(Date.now() + 10 * 60 * 1000));

      await expect(
        service.signInWithTotp(
          challengeToken,
          authenticator.generate(admin.totpSecret as string),
          CONTEXT,
        ),
      ).rejects.toThrow(/muddati tugadi/);
    });

    it('muvaffaqiyatli kirish auditga tushadi', async () => {
      await passTotp();

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ADMIN_LOGIN_SUCCEEDED }),
      );
    });
  });

  describe('sessiya', () => {
    const aliveSession = (overrides: Record<string, unknown> = {}) => ({
      id: 'session-1',
      adminId: admin.id,
      lastSeenAt: new Date(),
      revokedAt: null,
      admin,
      ...overrides,
    });

    it('tirik sessiyadan admin qaytaradi', async () => {
      prisma.adminSession.findUnique.mockResolvedValue(aliveSession());

      await expect(service.resolveSession('token')).resolves.toMatchObject({ id: admin.id });
    });

    it('notanish token — null', async () => {
      await expect(service.resolveSession('yoʻq')).resolves.toBeNull();
    });

    it('bekor qilingan sessiya — null', async () => {
      prisma.adminSession.findUnique.mockResolvedValue(aliveSession({ revokedAt: new Date() }));

      await expect(service.resolveSession('token')).resolves.toBeNull();
    });

    it('faolsizlikdan oʻlgan sessiya — null', async () => {
      prisma.adminSession.findUnique.mockResolvedValue(
        aliveSession({ lastSeenAt: new Date(Date.now() - 31 * 60 * 1000) }),
      );

      await expect(service.resolveSession('token')).resolves.toBeNull();
    });

    it('hisob oʻchirilgan boʻlsa ochiq sessiya ham ishlamaydi', async () => {
      prisma.adminSession.findUnique.mockResolvedValue(
        aliveSession({ admin: { ...admin, isActive: false } }),
      );

      await expect(service.resolveSession('token')).resolves.toBeNull();
    });

    it('bir daqiqadan kam oʻtgan boʻlsa bazaga yozmaydi', async () => {
      prisma.adminSession.findUnique.mockResolvedValue(aliveSession());

      await service.resolveSession('token');

      expect(prisma.adminSession.update).not.toHaveBeenCalled();
    });

    it('bir daqiqadan koʻp oʻtgan boʻlsa faollikni yangilaydi', async () => {
      prisma.adminSession.findUnique.mockResolvedValue(
        aliveSession({ lastSeenAt: new Date(Date.now() - 2 * 60 * 1000) }),
      );

      await service.resolveSession('token');

      expect(prisma.adminSession.update).toHaveBeenCalled();
    });

    it('chiqishda sessiyani bekor qiladi va auditga yozadi', async () => {
      prisma.adminSession.findUnique.mockResolvedValue(aliveSession());

      await service.signOut('token', CONTEXT);

      expect(prisma.adminSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { revokedAt: expect.any(Date) } }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ADMIN_LOGGED_OUT }),
      );
    });

    it('notanish token bilan chiqish jim oʻtadi', async () => {
      await expect(service.signOut('yoʻq', CONTEXT)).resolves.toBeUndefined();
      expect(audit.record).not.toHaveBeenCalled();
    });
  });
});
