import { formatTime } from './formatters';

/**
 * Qoʻllab-quvvatlash kanallari — yagona manba.
 *
 * Ilgari bu qiymatlar faqat qoʻllab-quvvatlash ekranida qattiq yozilgan edi.
 * Endi ularni uchta ekran ishlatadi va telefon raqami ikki joyda ikki xil
 * boʻlib qolish xavfi yoʻq.
 */
export const SUPPORT_PHONE = '+998712002424';
export const SUPPORT_PHONE_LABEL = '+998 71 200 24 24';
export const SUPPORT_TELEGRAM_URL = 'https://t.me/hizmat24_support';
export const SUPPORT_TELEGRAM_LABEL = '@hizmat24_support';

export const SUPPORT_OPEN_HOUR = 8;
export const SUPPORT_CLOSE_HOUR = 22;
export const SUPPORT_HOURS_LABEL = 'Har kuni 08:00 — 22:00';

/** 08:00 dan 21:59 gacha ochiq. */
export function isSupportOpen(now: Date): boolean {
  const hour = now.getHours();
  return hour >= SUPPORT_OPEN_HOUR && hour < SUPPORT_CLOSE_HOUR;
}

/**
 * Keyingi ochilish payti.
 *
 * Kirish sanasi MUTATSIYA QILINMAYDI: `now` chaqiruvchida ham ishlatiladi.
 */
export function nextOpenAt(now: Date): Date {
  const open = new Date(now.getFullYear(), now.getMonth(), now.getDate(), SUPPORT_OPEN_HOUR);
  // Ochilish payti oʻtib ketgan boʻlsa — ertangi kun.
  if (open.getTime() <= now.getTime()) open.setDate(open.getDate() + 1);
  return open;
}

/**
 * Ish vaqti qatori.
 *
 * Nega kerak: soat 02:00 da odamni javobsiz qoʻngʻiroqqa yuborish — himoya
 * vositasining eng yomon ishlashi. Qachon javob kelishini oldindan aytish
 * kutishni tushuntiradi.
 */
export function supportStatusLine(now: Date): string {
  return isSupportOpen(now)
    ? `${SUPPORT_HOURS_LABEL} · hozir ochiq`
    : `${SUPPORT_HOURS_LABEL} · hozir yopiq, ${formatTime(nextOpenAt(now))} da ochiladi`;
}

/** Foydalanuvchi ochishi mumkin boʻlgan haqiqiy kanallar. */
export type SupportChannel = 'telegram' | 'phone';

export interface SupportChannelEvent {
  channel: SupportChannel;
  openedAt: Date;
}

/**
 * Kanal jurnali yorliqlari.
 *
 * "Yuborildi" bu yerda YOʻQ va boʻlmaydi: ilova havola ochilganini biladi,
 * xabar yuborilganini bilmaydi.
 */
export const CHANNEL_OPENED_LABELS: Record<SupportChannel, string> = {
  telegram: 'Telegram ochildi',
  phone: 'Qoʻngʻiroq qilindi',
};
