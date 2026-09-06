import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthenticatedUser } from '@shared/index';
import type { AppEnv } from '@client/infra/config/env.validation';
import { AuthService } from '../auth.service';

interface JwtPayload {
  sub: string;
  phoneNumber: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<AppEnv, true>,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  /** Har bir so'rovda foydalanuvchi holati tekshiriladi — bloklangan bo'lsa kirish yopiladi. */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.auth.findActiveUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Foydalanuvchi topilmadi yoki bloklangan');
    }

    return { id: user.id, phoneNumber: user.phoneNumber };
  }
}
