import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_ADMIN_ROUTE_KEY } from '@client/common/decorators/admin.decorator';
import { IS_PUBLIC_KEY } from '@client/common/decorators/public.decorator';

/** Global guard — barcha endpointlar himoyalangan, `@Public()` bundan mustasno. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const skip = [IS_PUBLIC_KEY, IS_ADMIN_ROUTE_KEY].some((key) =>
      this.reflector.getAllAndOverride<boolean>(key, [context.getHandler(), context.getClass()]),
    );

    // Admin marshruti bu qorovuldan oʻtmaydi — u BOSHQA jadvalga qaraydi.
    // Himoyasiz qolmaydi: `@AdminOnly()` oʻzi bilan `AdminGuard` ni olib
    // keladi, shuning uchun ikkalasini ajratib yozish imkoni ham yoʻq.
    return skip ? true : super.canActivate(context);
  }
}
