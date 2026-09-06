import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '@shared/index';

type UserField = keyof AuthenticatedUser;

/** Guard joylashtirgan foydalanuvchini so'rovdan oladi (test qilinadigan sof funksiya). */
export function extractCurrentUser(
  field: UserField | undefined,
  ctx: ExecutionContext,
): AuthenticatedUser | string | undefined {
  const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
  return field ? request.user?.[field] : request.user;
}

export const CurrentUser = createParamDecorator(extractCurrentUser);
