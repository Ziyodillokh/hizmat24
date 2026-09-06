import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import type { AppEnv } from '@client/infra/config/env.validation';

export interface PushMessage {
  title: string;
  body: string;
  data: Record<string, string>;
}

/** Firebase Cloud Messaging — offline foydalanuvchilarga push yetkazish uchun (TZ 1.1, 4). */
@Injectable()
export class FcmProvider implements OnModuleInit {
  private readonly logger = new Logger(FcmProvider.name);
  private app?: admin.app.App;

  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  onModuleInit(): void {
    if (!this.config.get('FCM_ENABLED', { infer: true })) {
      this.logger.warn("FCM o'chirilgan — push xabarlar yuborilmaydi");
      return;
    }

    this.app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.config.get('FCM_PROJECT_ID', { infer: true }),
        clientEmail: this.config.get('FCM_CLIENT_EMAIL', { infer: true }),
        privateKey: this.config.get('FCM_PRIVATE_KEY', { infer: true })?.replace(/\\n/g, '\n'),
      }),
    });
  }

  /** Yaroqsiz tokenlar ro'yxatini qaytaradi — chaqiruvchi ularni o'chiradi. */
  async sendToTokens(tokens: string[], message: PushMessage): Promise<string[]> {
    if (!this.app || tokens.length === 0) return [];

    try {
      const response = await admin.messaging(this.app).sendEachForMulticast({
        tokens,
        notification: { title: message.title, body: message.body },
        data: message.data,
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });

      return response.responses
        .map((result, index) => (result.success ? null : tokens[index]))
        .filter((token): token is string => token !== null);
    } catch (error) {
      this.logger.error({ err: error }, 'FCM push yuborilmadi');
      return [];
    }
  }
}
