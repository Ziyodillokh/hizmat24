import { Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { AppEnv } from '@client/infra/config/env.validation';
import { AuthService } from '@client/modules/auth/auth.service';

export const clientRoom = (userId: string): string => `client:${userId}`;

/**
 * Real-vaqt kanal (TZ 3.5). Mijoz polling qilmaydi — barcha holat o'zgarishlari
 * shu yerdan yetkaziladi, offline holat uchun parallel ravishda FCM push ketadi.
 */
@WebSocketGateway({ namespace: '/ws/client' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<AppEnv, true>,
    private readonly auth: AuthService,
  ) {}

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const token = this.extractToken(socket);
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });

      // REST qatlamidagi kabi foydalanuvchi holati ham tekshiriladi — aks holda
      // bloklangan foydalanuvchi token muddati tugagunicha hodisalarni olaverardi.
      const user = await this.auth.findActiveUser(payload.sub);
      if (!user) throw new UnauthorizedException('Foydalanuvchi faol emas');

      await socket.join(clientRoom(payload.sub));
      socket.data.userId = payload.sub;
    } catch {
      this.logger.warn({ socketId: socket.id }, 'WS ulanish rad etildi: token yaroqsiz');
      socket.emit('error', { code: 'UNAUTHORIZED' });
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket): void {
    this.logger.debug({ socketId: socket.id, userId: socket.data?.userId }, 'WS uzildi');
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server?.to(clientRoom(userId)).emit(event, payload);
  }

  private extractToken(socket: Socket): string {
    const fromAuth = socket.handshake.auth?.token as string | undefined;
    const header = socket.handshake.headers.authorization;
    const token = fromAuth ?? (header?.startsWith('Bearer ') ? header.slice(7) : undefined);

    if (!token) throw new UnauthorizedException("Token yo'q");
    return token;
  }
}
