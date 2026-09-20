import { applyDecorators, createParamDecorator, SetMetadata, UseGuards } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { AdminSection } from '@client/modules/admin/admin-permissions';
import { AdminGuard } from '@client/modules/admin/guards/admin.guard';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';

export const IS_ADMIN_ROUTE_KEY = 'isAdminRoute';
export const ADMIN_SECTION_KEY = 'adminSection';

/**
 * Admin endpointi: global mijoz qorovuli chetlab oʻtiladi va oʻrniga
 * `AdminGuard` qoʻyiladi.
 *
 * Qorovul SHU dekorator ichida ulanadi — alohida `@UseGuards` yozish
 * unutilsa, marshrut himoyasiz ochilib qolardi. Boʻlim berilsa, rol
 * tekshiruvi ham shu yerda: `@AdminOnly('catalog')` — faqat katalogga
 * kira oladigan rollar.
 */
export const AdminOnly = (section?: AdminSection) =>
  applyDecorators(
    SetMetadata(IS_ADMIN_ROUTE_KEY, true),
    SetMetadata(ADMIN_SECTION_KEY, section),
    UseGuards(AdminGuard),
  );

export function extractCurrentAdmin(
  field: keyof AdminIdentity | undefined,
  ctx: ExecutionContext,
): AdminIdentity | AdminIdentity[keyof AdminIdentity] | undefined {
  const request = ctx.switchToHttp().getRequest<{ admin?: AdminIdentity }>();
  return field ? request.admin?.[field] : request.admin;
}

export const CurrentAdmin = createParamDecorator(extractCurrentAdmin);
