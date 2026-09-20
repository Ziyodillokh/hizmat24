/**
 * Koʻrsatish uchun formatlash — oʻzbekcha, sof funksiyalar.
 *
 * `Intl` ning `uz-UZ` lokali Node va brauzerlarda toʻliq emas, shuning
 * uchun son ajratkichi QOʻLDA qoʻyiladi: `Intl` ga tashlab qoʻyilsa
 * "1,234,567" (ingliz) yoki "1 234 567" (rus) chiqib, ikki ekranda ikki
 * xil koʻrinardi.
 */
const NBSP = ' ';

export function formatNumber(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString();
  const groups: string[] = [];

  for (let end = digits.length; end > 0; end -= 3) {
    groups.unshift(digits.slice(Math.max(0, end - 3), end));
  }

  return sign + groups.join(NBSP);
}

/** Narx — butun soʻmda, tiyin yoʻq (biznes-qoida 5.1). */
export const formatPrice = (value: number): string => `${formatNumber(value)}${NBSP}soʻm`;

const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];

/**
 * "21 sentabr, 14:05". Sana serverdan Asia/Tashkent siljishi bilan
 * keladi, shuning uchun `Date` uni toʻgʻri oʻqiydi va mahalliy zonada
 * koʻrsatadi.
 */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${time}`;
}
