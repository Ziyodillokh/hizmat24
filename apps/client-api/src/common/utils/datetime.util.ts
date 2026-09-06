import { formatInTimeZone } from 'date-fns-tz';
import { CLIENT_TIMEZONE } from '@shared/index';

/**
 * UTC'da saqlangan vaqtni mijoz vaqt zonasida ISO-8601 offset bilan qaytaradi (1.2).
 * Masalan: 2026-09-05T12:00:00.000Z → 2026-09-05T17:00:00.000+05:00
 */
export function toClientZone(date: Date): string;
export function toClientZone(date: Date | null | undefined): string | null;
export function toClientZone(date: Date | null | undefined): string | null {
  if (!date) return null;
  return formatInTimeZone(date, CLIENT_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
}
