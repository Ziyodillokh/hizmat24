import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from '@client/infra/config/env.validation';
import { maskPhoneNumber } from '@client/common/utils/phone.util';

/**
 * SMS provayderi. v1'da `console` (development) va HTTP-based provayderlar
 * uchun yagona interfeys. Provayder kaliti env orqali beriladi — hardcode yo'q.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  async sendOtp(phoneNumber: string, code: string): Promise<void> {
    const provider = this.config.get('SMS_PROVIDER', { infer: true });
    const message = `Hizmat24 tasdiqlash kodi: ${code}. Hech kimga aytmang.`;

    if (provider === 'console') {
      this.logger.warn(
        { phone: maskPhoneNumber(phoneNumber), code },
        'SMS provayderi "console" — kod faqat logga yozildi',
      );
      return;
    }

    await this.sendViaHttpProvider(phoneNumber, message);
  }

  private async sendViaHttpProvider(phoneNumber: string, message: string): Promise<void> {
    const url = this.config.get('SMS_API_URL', { infer: true });
    const token = this.config.get('SMS_API_TOKEN', { infer: true });

    if (!url || !token) {
      throw new Error("SMS provayderi sozlanmagan: SMS_API_URL yoki SMS_API_TOKEN yo'q");
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        mobile_phone: phoneNumber.replace('+', ''),
        message,
        from: this.config.get('SMS_SENDER', { infer: true }),
      }),
    });

    if (!response.ok) {
      this.logger.error(
        { status: response.status, phone: maskPhoneNumber(phoneNumber) },
        'SMS yuborilmadi',
      );
      throw new Error(`SMS provayderi ${response.status} qaytardi`);
    }
  }
}
