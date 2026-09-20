import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { AdminGuard, readBearerToken } from './admin.guard';
import type { AdminAuthService, AdminIdentity } from '../auth/admin-auth.service';

describe('readBearerToken', () => {
  it('toʻgʻri sarlavhadan tokenni ajratadi', () => {
    expect(readBearerToken('Bearer abc123')).toBe('abc123');
  });

  it('sxema nomining registriga qaramaydi', () => {
    expect(readBearerToken('bearer abc123')).toBe('abc123');
  });

  it.each([
    ['sarlavha yoʻq', undefined],
    ['boʻsh satr', ''],
    ['faqat token', 'abc123'],
    ['boshqa sxema', 'Basic abc123'],
    ['ortiqcha qism', 'Bearer abc123 qoʻshimcha'],
    ['token yoʻq', 'Bearer'],
  ])('%s boʻlsa null qaytaradi', (_name, header) => {
    expect(readBearerToken(header)).toBeNull();
  });
});

const identity = (role: AdminRole): AdminIdentity => ({
  id: 'admin-1',
  email: 'a@hizmat24.uz',
  fullName: 'Admin',
  role,
  sections: [],
  idleTimeoutSeconds: 1800,
});

describe('AdminGuard', () => {
  const contextWith = (header?: string) => {
    const request: Record<string, unknown> = { headers: { authorization: header } };
    return {
      request,
      context: {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => undefined,
        getClass: () => undefined,
      } as unknown as ExecutionContext,
    };
  };

  const build = (resolved: AdminIdentity | null, section?: string) =>
    new AdminGuard(
      { getAllAndOverride: () => section } as never,
      { resolveSession: jest.fn().mockResolvedValue(resolved) } as unknown as AdminAuthService,
    );

  it('token boʻlmasa 401', async () => {
    const { context } = contextWith(undefined);

    await expect(build(identity(AdminRole.SUPERADMIN)).canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('sessiya oʻlgan boʻlsa 401', async () => {
    const { context } = contextWith('Bearer eski');

    await expect(build(null).canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('boʻlim talab qilinmasa har qanday admin oʻtadi', async () => {
    const { context, request } = contextWith('Bearer ok');

    await expect(build(identity(AdminRole.MODERATOR)).canActivate(context)).resolves.toBe(true);
    expect(request.admin).toEqual(identity(AdminRole.MODERATOR));
  });

  it('roli yetmasa 403 — toʻgʻridan-toʻgʻri URL bilan ham kirib boʻlmaydi', async () => {
    const { context } = contextWith('Bearer ok');

    await expect(
      build(identity(AdminRole.OPERATOR), 'catalog').canActivate(context),
    ).rejects.toThrow(ForbiddenException);
  });

  it('roli yetsa boʻlimga kiritadi', async () => {
    const { context } = contextWith('Bearer ok');

    await expect(
      build(identity(AdminRole.SUPERADMIN), 'catalog').canActivate(context),
    ).resolves.toBe(true);
  });

  it('rad etilganda soʻrovga admin YOZILMAYDI', async () => {
    const { context, request } = contextWith('Bearer ok');

    await expect(
      build(identity(AdminRole.OPERATOR), 'catalog').canActivate(context),
    ).rejects.toThrow();
    expect(request.admin).toBeUndefined();
  });
});
