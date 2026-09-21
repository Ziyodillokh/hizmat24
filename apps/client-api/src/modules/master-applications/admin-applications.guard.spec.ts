import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { AdminGuard } from '@client/modules/admin/guards/admin.guard';
import type {
  AdminAuthService,
  AdminIdentity,
} from '@client/modules/admin/auth/admin-auth.service';
import { ADMIN_SECTION_KEY } from '@client/common/decorators/admin.decorator';
import { AdminApplicationsController } from './admin-applications.controller';

const identity = (role: AdminRole): AdminIdentity => ({
  id: 'admin-1',
  email: 'a@hizmat24.uz',
  fullName: 'Admin',
  role,
  sections: [],
  idleTimeoutSeconds: 1800,
});

/**
 * Arizalar boʻlimi OPERATOR ga yopiq — bu A2 ning qabul sharti.
 *
 * Tekshiruv ikki qismdan iborat va ikkalasi ham kerak: kontroller
 * haqiqatan `applications` boʻlimini talab qiladimi (dekorator metadatasi)
 * va qorovul shu boʻlimda operatorni toʻxtatadimi. Faqat ruxsatlar
 * jadvalini sinash yetarli emas — dekorator unutilsa jadval baribir
 * toʻgʻri javob berardi, marshrut esa ochiq qolardi.
 */
describe('arizalar boʻlimiga kirish', () => {
  it('kontroller `applications` boʻlimini talab qiladi', () => {
    const section: unknown = Reflect.getMetadata(ADMIN_SECTION_KEY, AdminApplicationsController);

    expect(section).toBe('applications');
  });

  const contextFor = (role: AdminRole) => {
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer ok' } };
    const guard = new AdminGuard(
      { getAllAndOverride: () => 'applications' } as never,
      {
        resolveSession: jest.fn().mockResolvedValue(identity(role)),
      } as unknown as AdminAuthService,
    );

    return {
      guard,
      context: {
        switchToHttp: () => ({ getRequest: () => request }),
        getHandler: () => undefined,
        getClass: () => AdminApplicationsController,
      } as unknown as ExecutionContext,
    };
  };

  it('OPERATOR toʻgʻridan-toʻgʻri URL bilan ham kira olmaydi', async () => {
    const { guard, context } = contextFor(AdminRole.OPERATOR);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it.each([AdminRole.MODERATOR, AdminRole.SUPERADMIN])('%s kira oladi', async (role) => {
    const { guard, context } = contextFor(role);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
