import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_KEY = 'rawResponse';

/**
 * Javobni `{ success, data, error }` konvertiga OʻRAMASLIK.
 *
 * Konvert ilova uchun qulay, lekin fayl yuklab olish uchun zararli:
 * CSV satri obyekt ichiga tushib qolsa, brauzer uni fayl sifatida
 * ocha olmaydi. Shuning uchun faylga aylanadigan javoblar konvertdan
 * chetlab oʻtadi.
 */
export const RawResponse = (): MethodDecorator => SetMetadata(RAW_RESPONSE_KEY, true);
