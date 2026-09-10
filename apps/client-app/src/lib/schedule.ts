/**
 * Sana tasmasi va vaqt slotlari — sof hisob.
 *
 * REACT YOʻQ va `new Date()` CHAQIRILMAYDI: joriy vaqt har doim `now`
 * parametri sifatida keladi — `wallet.ts` va `pricing.ts` bilan bir xil
 * shartnoma.
 *
 * BANDLIK YOʻQ: bizda usta jadvali maʼlumoti yoʻq, boʻlmagan bandlikni
 * chizish esa soxta maʼlumotni haqiqat sifatida koʻrsatish boʻlardi. Yagona
 * haqiqiy cheklov — joriy vaqt: oʻtib ketgan soatlar "band" emas, "mavjud
 * emas".
 */
import { formatDateTime } from './formatters';

/**
 * Buyurtma vaqtining inson oʻqiydigan yorligʻi.
 *
 * Uch ekranda (toʻlov, tasdiqlash, chek) bir xil boʻlishi shart, shuning
 * uchun bitta joyda.
 */
export function timingLabel(
  value: { scheduledAt: Date | null; isUrgent: boolean },
  now: Date,
): string {
  if (value.scheduledAt) return formatDateTime(value.scheduledAt, now);
  return value.isUrgent ? 'Shoshilinch' : 'Imkon qadar tez';
}

/** Sana tasmasidagi kunlar soni. */
export const DAY_STRIP_LENGTH = 7;

/** Ish kuni 09:00 dan 17:00 gacha, bir soatlik qadam — toʻqqizta slot. */
export const FIRST_SLOT_HOUR = 9;
export const LAST_SLOT_HOUR = 17;

/** Bugungi slot kamida shuncha vaqtdan keyin boshlanishi kerak. */
export const SLOT_LEAD_MINUTES = 60;

const MINUTE_MS = 60_000;

export interface DayOption {
  /** Kunning 00:00 i. */
  date: Date;
  /** `dayKey(date)` — React kaliti va tanlov identifikatori. */
  key: string;
  /** Shu kunda tanlanadigan slot bormi. */
  hasSlots: boolean;
}

export type SlotGroupKey = 'morning' | 'day' | 'evening';

export interface SlotGroup {
  key: SlotGroupKey;
  label: string;
  hours: number[];
}

const pad = (value: number): string => value.toString().padStart(2, '0');

/**
 * Kun identifikatori: "2026-09-12".
 *
 * Bu FORMATLASH emas — foydalanuvchiga hech qachon koʻrsatilmaydi. U sana
 * tasmasi har daqiqada qayta qurilganda tanlangan kunni yoʻqotmaslik uchun
 * kerak: har safar yangi `Date` obyekti yasaladi va havola boʻyicha
 * taqqoslash ishlamaydi.
 */
export const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Kun va soatdan aniq vaqt yasaydi. */
export const slotAt = (date: Date, hour: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour);

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Shu kundagi TANLANADIGAN soatlar.
 *
 * Bugun uchun `now + SLOT_LEAD_MINUTES` dan oldingi soatlar umuman
 * qaytarilmaydi: bir soatdan kam vaqt qolganda ustaning yetib kelishiga
 * ishonch yoʻq.
 */
export function buildHours(date: Date, now: Date): number[] {
  const hours: number[] = [];
  const earliest = now.getTime() + SLOT_LEAD_MINUTES * MINUTE_MS;
  const isToday = dayKey(date) === dayKey(now);

  for (let hour = FIRST_SLOT_HOUR; hour <= LAST_SLOT_HOUR; hour += 1) {
    const slot = slotAt(date, hour);
    // Oʻtgan kun ham shu tekshiruvga tushadi — uning hamma sloti oʻtib ketgan.
    if (!isToday && slot.getTime() < now.getTime()) continue;
    if (isToday && slot.getTime() < earliest) continue;
    hours.push(hour);
  }

  return hours;
}

/** Bugundan boshlab `DAY_STRIP_LENGTH` ta kun. */
export function buildDayStrip(now: Date): DayOption[] {
  const today = startOfDay(now);

  return Array.from({ length: DAY_STRIP_LENGTH }, (_, offset) => {
    // `new Date(y, m, d + offset)` oy va yil chegarasini oʻzi normallashtiradi.
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
    return { date, key: dayKey(date), hasSlots: buildHours(date, now).length > 0 };
  });
}

const GROUPS: readonly { key: SlotGroupKey; label: string; from: number; to: number }[] = [
  { key: 'morning', label: 'Ertalab', from: 9, to: 11 },
  { key: 'day', label: 'Kunduzi', from: 12, to: 14 },
  { key: 'evening', label: 'Kechqurun', from: 15, to: 17 },
];

/** Ertalab 09–11 · Kunduzi 12–14 · Kechqurun 15–17. Boʻsh guruh qaytarilmaydi. */
export function groupHours(hours: readonly number[]): SlotGroup[] {
  return GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    hours: hours.filter((hour) => hour >= group.from && hour <= group.to),
  })).filter((group) => group.hours.length > 0);
}
