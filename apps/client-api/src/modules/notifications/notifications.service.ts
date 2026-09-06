import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import Redis from 'ioredis';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { REDIS_CLIENT } from '@client/infra/redis/redis.module';
import { toClientZone } from '@client/common/utils/datetime.util';
import { FcmProvider } from './fcm.provider';
import { NotificationsGateway } from './notifications.gateway';

export interface DispatchInput {
  userId: string;
  orderId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
}

export interface NotificationView {
  id: string;
  type: NotificationType;
  orderId: string | null;
  payload: unknown;
  sentAt: string;
  readAt: string | null;
}

/** Admin/support tomoni shu kanalni tinglaydi (TZ 3.7, 4-jadval "Kritik"). */
export const ADMIN_SAFETY_CHANNEL = 'admin:safety-alerts';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
    private readonly fcm: FcmProvider,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Yagona yetkazish nuqtasi (TZ 9.6): DB yozuvi + WebSocket + FCM push.
   * Controller qatlamidan hech qachon to'g'ridan-to'g'ri chaqirilmaydi —
   * faqat domain event listener orqali.
   */
  async dispatch(input: DispatchInput): Promise<void> {
    const payload = {
      title: input.title,
      body: input.body,
      ...(input.payload ?? {}),
    };

    // Push yetkazilmasa ham xabar ilovada ko'rinishi uchun avval DB'ga yoziladi (TZ 4).
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        orderId: input.orderId ?? null,
        type: input.type,
        payload: payload,
      },
    });

    this.gateway.emitToUser(input.userId, input.type, {
      id: notification.id,
      type: input.type,
      orderId: input.orderId ?? null,
      ...payload,
      sentAt: toClientZone(notification.sentAt),
    });

    await this.sendPush(input, payload);
  }

  /** Xavfsizlik signalini admin/support navbatiga darhol uzatish. */
  async publishSafetyAlert(alert: {
    safetyAlertId: string;
    orderId: string;
    clientId: string;
    masterId: string | null;
  }): Promise<void> {
    await this.redis.publish(
      ADMIN_SAFETY_CHANNEL,
      JSON.stringify({ ...alert, priority: 'critical', raisedAt: new Date().toISOString() }),
    );

    this.logger.error({ ...alert }, 'Xavfsizlik signali admin navbatiga yuborildi');
  }

  async list(userId: string, page: number, limit: number) {
    const [items, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      items: items.map((item): NotificationView => ({
        id: item.id,
        type: item.type,
        orderId: item.orderId,
        payload: item.payload,
        sentAt: toClientZone(item.sentAt),
        readAt: toClientZone(item.readAt),
      })),
      meta: { total, unread, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async registerDeviceToken(userId: string, token: string, platform: string): Promise<void> {
    await this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform },
      create: { userId, token, platform },
    });
  }

  private async sendPush(input: DispatchInput, payload: Record<string, unknown>): Promise<void> {
    const devices = await this.prisma.deviceToken.findMany({
      where: { userId: input.userId },
      select: { token: true },
    });

    if (devices.length === 0) return;

    const invalidTokens = await this.fcm.sendToTokens(
      devices.map((device) => device.token),
      {
        title: input.title,
        body: input.body,
        data: {
          type: input.type,
          orderId: input.orderId ?? '',
          payload: JSON.stringify(payload),
        },
      },
    );

    if (invalidTokens.length > 0) {
      await this.prisma.deviceToken.deleteMany({ where: { token: { in: invalidTokens } } });
    }
  }
}
