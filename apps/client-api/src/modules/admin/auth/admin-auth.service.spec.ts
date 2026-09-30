import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { AdminRole, AuditAction, type AdminUser } from '@prisma/client';
import type { AuditService } from '@client/modules/audit/audit.service';
import type { PrismaService } from '@client/infra/prisma/prisma.service';
import { AdminAuthService } from './admin-auth.service';
import { hashPassword } from './admin-password';
import { MAX_FAILED_ATTEMPTS } from './admin-lockout';
import { LEAKED_PASSWORDS, generatePassword } from './password-policy';

/**
 * Baxtli yoʻl paroli HAR YUGURISHDA yangidan yaratiladi.
 *
 * NEGA qatʼiy satr emas: testda ochiq yozilgan har qanday qiymat ommaviy
 * boʻlib qoladi, demak uni taqiqlangan roʻyxatga qoʻshish kerak — roʻyxat
 * esa endi KIRISHNI ham bloklaydi, shuning uchun bunday fikstura bilan
 * muvaffaqiyatli kirishni umuman sinab boʻlmasdi. Tasodifiy qiymat repoda
 * qolmaydi, siyosatdan oʻtadi va ikkala talabni ham bir vaqtda bajaradi.
 */
const PASSWORD = generatePassword();
const CONTEXT = { ipAddress: '10.0.0.1', userAgent: 'jest' };
const ENV: Record<string, unknown> = {
  ADMIN_TOKEN_SECRET: 'a'.repeat(48),
  ADMIN_SESSION_IDLE_MINUTES: 30,
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
    // Ustunlar bazada QOLDI (migratsiyalar faqat qoʻshimcha), lekin
    // ikkinchi bosqich olib tashlangani uchun ular ishlatilmaydi.
    totpSecret: null,
    totpEnabledAt: null,
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
        findUnique: jest
          .fn()
          .mockImplementation(({ where }: { where: Record<string, string> }) =>
            Promise.resolve(where.email === admin.email || where.id === admin.id ? admin : null),
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

  describe('kirish: email va parol', () => {
    it('fikstura paroli repoda qolmaydi — taqiqlangan roʻyxatga tushmaydi', () => {
      // Qiymat har yugurishda yangi, shuning uchun uni hech kim oldindan
      // bila olmaydi va roʻyxatga qoʻshish shart emas.
      expect(LEAKED_PASSWORDS).not.toContain(PASSWORD);
    });

    it.each(LEAKED_PASSWORDS)(
      'sizib chiqqan "%s" paroli TOʻGʻRI boʻlsa ham kirish bermaydi',
      async (leaked) => {
        // Taqiq hujjatda "mangu" deb yozilgan. Bu yerda u aynan kirish
        // yoʻlida sinaladi: hash mos tushsa ham sessiya berilmasligi kerak,
        // aks holda taqiq faqat hisob yaratishda ishlagan boʻlardi.
        admin = await build({ passwordHash: await hashPassword(leaked) });

        await expect(service.signInWithPassword(admin.email, leaked, CONTEXT)).rejects.toThrow(
          ForbiddenException,
        );
      },
    );

    it('sizib chiqqan parol chipta ham, TOTP sirini ham bermaydi', async () => {
      const leaked = LEAKED_PASSWORDS[0];
      admin = await build({ passwordHash: await hashPassword(leaked) });

      await expect(service.signInWithPassword(admin.email, leaked, CONTEXT)).rejects.toThrow(
        /ochiq manbada koʻringan/,
      );
      // Sir yaratilmasligi kerak: kirish rad etilgan, demak hech qanday
      // ikkinchi bosqich resursi ham berilmaydi.
      expect(prisma.adminUser.update).not.toHaveBeenCalled();
    });

    it('sizib chiqqan parol bilan urinish auditga tushadi', async () => {
      const leaked = LEAKED_PASSWORDS[0];
      admin = await build({ passwordHash: await hashPassword(leaked) });

      await expect(service.signInWithPassword(admin.email, leaked, CONTEXT)).rejects.toThrow();

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.ADMIN_LOGIN_FAILED,
          metadata: expect.objectContaining({ reason: 'sizib-chiqqan' }),
        }),
      );
    });

    it('toʻgʻri parol darhol sessiya tokeni beradi', async () => {
      const result = await loginOk();

      expect(result.token.length).toBeGreaterThan(40);
    });

    it('javobda admin roli va boʻlimlari boʻladi', async () => {
      const { admin: identity } = await loginOk();

      expect(identity.role).toBe(AdminRole.SUPERADMIN);
      expect(identity.sections).toContain('catalog');
      expect(identity.idleTimeoutSeconds).toBe(1800);
    });

    /* Token bazada faqat HASH koʻrinishida yashaydi. */
    it('sessiya tokeni bazaga OCHIQ yozilmaydi', async () => {
      const { token } = await loginOk();
      const written = JSON.stringify(prisma.$transaction.mock.calls);

      expect(written).not.toContain(token);
    });

    it('muvaffaqiyatli kirish auditga tushadi', async () => {
      await loginOk();

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.ADMIN_LOGIN_SUCCEEDED }),
      );
    });

    it('registri farq qilgan email ham topiladi', async () => {
      await expect(
        service.signInWithPassword('  ADMIN@Hizmat24.UZ ', PASSWORD, CONTEXT),
      ).resolves.toMatchObject({ admin: { email: 'admin@hizmat24.uz' } });
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
