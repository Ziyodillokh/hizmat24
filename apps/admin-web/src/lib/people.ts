/**
 * Odamlar boʻlimining sof matnlari va qoidalari.
 *
 * Yorliqlar `operations.ts` va `applications.ts` da allaqachon bor —
 * bu yerda faqat tafsilot ekranlariga xos narsalar.
 */

/** Smena ochiqmi — ikki soʻz bilan. */
export const shiftLabel = (isOnShift: boolean): string =>
  isOnShift ? 'Smena ochiq' : 'Smena yopiq';

/**
 * Ish vaqti — «08:00 – 20:00».
 *
 * Daqiqa yoʻq: usta arizasida ham soatdan aniqroq vaqt soʻralmaydi.
 * Soat chegaradan chiqsa ham ekran buzilmasin — qiymat qisiladi.
 */
export function workHoursLabel(from: number, to: number): string {
  const hour = (value: number) => String(Math.max(0, Math.min(23, Math.round(value)))).padStart(2, '0');

  return `${hour(from)}:00 – ${hour(to)}:00`;
}

/**
 * Foydalanuvchining holati.
 *
 * `BLOCKED` — admin qoʻlda bloklagan; avtomatik chetlatish yoʻq.
 */
export const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Faol',
  BLOCKED: 'Bloklangan',
};

/** Holatga mos rang ohangi. */
export const userStatusTone = (status: string): 'success' | 'danger' | 'neutral' => {
  if (status === 'ACTIVE') return 'success';
  if (status === 'BLOCKED') return 'danger';
  return 'neutral';
};
