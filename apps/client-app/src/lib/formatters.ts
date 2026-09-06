/**
 * Format qoidalari — spetsifikatsiya 8.4 va 8.5-bandlari.
 * Bu yerdagi funksiyalardan tashqari joyda raqam/sana formatlash taqiqlanadi.
 */

const NBSP = ' ';

/**
 * 8.4-band: "150 000 soʻm" — mingliklar probel bilan, kasr YOʻQ, "soʻm" kichik harf.
 * `UZS`, `сум`, `150,000`, `150.000`, `150K` taqiqlanadi.
 */
export function formatPrice(amount: number): string {
  const digits = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${digits}${NBSP}soʻm`;
}

/** Bosh sahifa va xizmatlar roʻyxatida — aniq summa emas (14.6-band, 45-punkt). */
export const formatApproxPrice = (amount: number): string => `taxminan ${formatPrice(amount)}`;

export const formatPriceFrom = (amount: number): string => `${formatPrice(amount)}dan`;

export const formatPriceRange = (min: number, max: number): string =>
  `${Math.round(min).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP)}${NBSP}–${NBSP}${formatPrice(max)}`;

/**
 * Buyurtmalar roʻyxatidagi guruh sarlavhasi: "Bugun" · "Kecha" · "Sentabr" ·
 * "2025-yil dekabr".
 *
 * Uzun roʻyxat sanaga qarab boʻlinganda koʻz bilan skanerlash osonlashadi —
 * aks holda oʻttizta bir xil karta uzluksiz oqim boʻlib koʻrinadi.
 */
export function orderDateGroup(date: Date, now: Date): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return 'Bugun';
  if (isSameDay(date, yesterday)) return 'Kecha';

  const month = MONTHS[date.getMonth()];
  const capitalised = month.charAt(0).toUpperCase() + month.slice(1);

  return date.getFullYear() === now.getFullYear()
    ? capitalised
    : `${date.getFullYear()}-yil ${month}`;
}

/** 8.5-band: bitta kasr xona, oʻnlik ajratkich — VERGUL. Server 4.75 bersa ham 4,8. */
export const formatRating = (value: number): string => value.toFixed(1).replace('.', ',');

/** 8.5-band: 24 soatlik format, AM/PM taqiqlanadi. */
const pad = (n: number): string => n.toString().padStart(2, '0');

export const formatTime = (date: Date): string => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

const MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** 8.5-band: "Bugun, 14:30" · "Kecha, 09:15" · "5-sentabr, 14:30" · "2025-yil 5-sentabr, 14:30". */
export function formatDateTime(date: Date, now: Date): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, now)) return `Bugun, ${formatTime(date)}`;
  if (isSameDay(date, yesterday)) return `Kecha, ${formatTime(date)}`;

  const day = `${date.getDate()}-${MONTHS[date.getMonth()]}`;
  return date.getFullYear() === now.getFullYear()
    ? `${day}, ${formatTime(date)}`
    : `${date.getFullYear()}-yil ${day}, ${formatTime(date)}`;
}

/** Roʻyxatlar uchun qisqa shakl. */
export const formatShortDate = (date: Date): string =>
  `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;

/** 8.5-band: "15 daqiqa", "1 soat 20 daqiqa". "min", "daq", "15m" taqiqlanadi. */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} daqiqa`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} soat` : `${hours} soat ${rest} daqiqa`;
}

/** `~` faqat vaqt va navbat oʻrni uchun (8.5-band). */
export const formatApproxDuration = (minutes: number): string => `~${formatDuration(minutes)}`;

export const formatQueuePosition = (position: number): string => `~${position}-oʻrin`;

/** 8.3-band: "+998 90 *** ** 67". */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 12) return phone;
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} *** ** ${digits.slice(10, 12)}`;
}

/** 04-ekranda raqam toʻliq koʻrsatiladi (8.3-band istisnosi). */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 12) return phone;
  return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
}

/** Maʼlumot yoʻq boʻlganda — "N/A" emas (8.5-band). */
export const EMPTY_VALUE = '—';

export const orEmpty = (value: string | null | undefined): string => value ?? EMPTY_VALUE;

/** 8.3-band: vaqtga qarab salomlashuv. */
/**
 * Salomlashuv — vergulsiz. Vergul ilgari matnning oʻziga qoʻshib
 * yozilgandi, lekin u sarlavha uslubiga (katta harflar, kengaytirilgan
 * harf oraligʻi) mos kelmaydi va tinish belgisi tipografiyaning ishi
 * emas — komponentning ishi.
 */
export function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'Xayrli tong';
  if (hour >= 12 && hour < 18) return 'Xayrli kun';
  return 'Xayrli kech';
}
