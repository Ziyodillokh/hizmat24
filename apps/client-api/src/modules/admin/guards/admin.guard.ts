import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { ADMIN_SECTION_KEY } from '@client/common/decorators/admin.decorator';
import { canAccess, type AdminSection } from '../admin-permissions';
import { AdminAuthService, type AdminIdentity } from '../auth/admin-auth.service';

/** `Authorization: Bearer <token>` dan tokenni ajratadi (sof funksiya). */
export function readBearerToken(header: string | undefined): string | null {
  if (!header) return null;

  const [scheme, ...rest] = header.trim().split(/\s+/);
  if (scheme.toLowerCase() !== 'bearer' || rest.length !== 1) return null;

  return rest[0] || null;
}

/**
 * Admin marshrutlarining yagona qorovuli: sessiya + rol.
 *
 * Mijoz `JwtAuthGuard` idan mustaqil — admin boshqa jadvalda yashaydi va
 * uning tokeni JWT emas, bazadagi sessiya yozuvi. Ikkovi bir-birining
 * tokenini hech qachon qabul qilmaydi.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AdminAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { admin?: AdminIdentity }>();
    const token = readBearerToken(request.headers.authorization);

    if (!token) throw new UnauthorizedException('Kirish talab qilinadi');

    const admin = await this.auth.resolveSession(token);
    if (!admin) throw new UnauthorizedException('Sessiya tugadi — qaytadan kiring');

    const section = this.reflector.getAllAndOverride<AdminSection | undefined>(
      ADMIN_SECTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Boʻlim menyuda koʻrinmagani YETARLI emas: toʻgʻridan-toʻgʻri URL
    // bilan ham kirib boʻlmasligi kerak (A1 qabul sharti).
    if (section && !canAccess(admin.role, section)) {
      throw new ForbiddenException('Bu boʻlimga ruxsatingiz yoʻq');
    }

    request.admin = admin;
    return true;
  }
}
