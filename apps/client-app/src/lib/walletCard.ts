import type { PaymentMethod, WalletTransaction } from '@/app/types';
import { formatDayLabel, formatPercent, maskPhone } from './formatters';
import { CASHBACK_BLOCK, LEVELS, type CashbackProgress, type Level, type WalletView } from './wallet';

/**
 * "Karta" sahifasining matn va tanlov mantigʻi — sof funksiyalar, React YOʻQ,
 * `new Date()` YOʻQ.
 *
 * Bu yerda HALOLLIK qoidalari kodga aylantirilgan: kartada faqat haqiqiy
 * narsalar (ism, maskalangan raqam, real daraja chegirmasi, allaqachon
 * toʻlangan pul); ishlamaydigan usul hech qachon "ishlaydi" deb chiqmaydi;
 * demo tarix bor boʻlsa uni belgilash uchun `hasDemoHistory` bor.
 */

// ───────────────────────────────────────────────────────────── egasi ──

export interface CardHolder {
  /** Ism; ism yoʻq boʻlsa maskalangan raqam shu yerga koʻtariladi. */
  primary: string;
  /** Maskalangan raqam; ism yoʻq boʻlsa `null` — ikkinchi qator chizilmaydi. */
  secondary: string | null;
}

/** Ism ham, raqam ham yoʻq boʻlsa — rol yorligʻi, toʻqilgan ism EMAS. */
export const HOLDER_FALLBACK = 'Hizmat24 mijozi';

/** 8.3-band: raqam HAR DOIM maskalanadi (`maskPhone`), toʻliq raqam kartaga chiqmaydi. */
export function cardHolder(fullName: string | null | undefined, phone: string): CardHolder {
  const name = fullName?.trim() ?? '';
  const masked = phone.trim() ? maskPhone(phone.trim()) : null;
  if (name) return { primary: name, secondary: masked };
  return { primary: masked ?? HOLDER_FALLBACK, secondary: null };
}

/** Ekran oʻquvchi uchun kartaning bir jumlalik tavsifi. */
export function cardAriaLabel(level: Level, holder: CardHolder): string {
  const parts = [
    'Hizmat24 mijoz kartasi',
    `${level.label} daraja, ${formatPercent(level.discountPercent)} chegirma`,
    holder.primary,
    holder.secondary,
  ].filter((part): part is string => part !== null);
  return `${parts.join('. ')}.`;
}

// ────────────────────────────────────────────────────────── tarix ──

/** Kartaning ostidagi "Soʻnggi toʻlovlar" blokidagi qatorlar soni. */
export const RECENT_LIMIT = 3;

/** Roʻyxat allaqachon yangidan eskiga (`mergeTransactions`); birinchi `limit` ta. */
export const recentTransactions = (
  transactions: readonly WalletTransaction[],
  limit: number = RECENT_LIMIT,
): WalletTransaction[] => transactions.slice(0, Math.max(0, limit));

/**
 * Roʻyxatda jonli buyurtmaga bogʻlanmagan (demo) yozuv bormi.
 * Bor boʻlsa ekran "Demo · namunaviy tarix" chipini chizadi — toʻqilgan
 * raqam haqiqiy deb koʻrsatilmasligi doktrinasi.
 */
export const hasDemoHistory = (transactions: readonly WalletTransaction[]): boolean =>
  transactions.some((item) => item.orderId === null);

/** "Demo" chipining matni — bitta joyda, ikki ekran ham shundan oladi. */
export const DEMO_HISTORY_LABEL = 'Demo · namunaviy tarix';

// ────────────────────────────────────────────────────── toʻlov usuli ──

/**
 * YAGONA haqiqat manbai: qaysi usul ISHLAYDI. `PaymentStep` ham shundan
 * oʻqiydi — checkout va "Karta" sahifasi hech qachon bir-biriga zid kelmaydi.
 */
export const METHOD_AVAILABILITY: Readonly<Record<PaymentMethod, boolean>> = {
  cash: true,
  escrow: false,
  card: false,
};

export const isMethodAvailable = (method: PaymentMethod): boolean => METHOD_AVAILABILITY[method];

export type PaymentOptionKey = 'cash' | 'click' | 'payme';

export interface PaymentOption {
  key: PaymentOptionKey;
  /** Qaysi `PaymentMethod` orqali ishlaydi — mavjudlik shundan olinadi. */
  method: PaymentMethod;
  label: string;
  hint: string;
  isAvailable: boolean;
}

/**
 * "Karta" sahifasidagi usullar roʻyxati. Click va Payme — bank kartasi
 * (`card`) orqali toʻlov; ular ulanmaguncha qator `Tez orada` chipi bilan,
 * tugma EMAS.
 */
const PAYMENT_SEEDS: readonly Omit<PaymentOption, 'isAvailable'>[] = [
  { key: 'cash', method: 'cash', label: 'Naqd', hint: 'Ish tugagach ustaga joyida toʻlaysiz' },
  { key: 'click', method: 'card', label: 'Click', hint: 'Ilova orqali toʻlov' },
  { key: 'payme', method: 'card', label: 'Payme', hint: 'Ilova orqali toʻlov' },
];

export const PAYMENT_OPTIONS: readonly PaymentOption[] = PAYMENT_SEEDS.map((option) => ({
  ...option,
  isAvailable: isMethodAvailable(option.method),
}));

// ───────────────────────────────────────────────────────── daraja ──

/** "Oltin darajaga yana 14 ta buyurtma" · "Eng yuqori daraja". */
export function levelProgressCopy(view: Pick<WalletView, 'nextLevel' | 'ordersToNextLevel'>): string {
  if (!view.nextLevel) return 'Eng yuqori daraja';
  return `${view.nextLevel.label} darajaga yana ${view.ordersToNextLevel} ta buyurtma`;
}

/** "16 / 30" — joriy daraja ichidagi oʻrin; eng yuqorisida faqat son. */
export function levelRatio(view: Pick<WalletView, 'nextLevel' | 'ordersTotal'>): string {
  return view.nextLevel ? `${view.ordersTotal} / ${view.nextLevel.minOrders}` : `${view.ordersTotal} ta`;
}

/**
 * "0–9 ta buyurtma" · "10–29 ta buyurtma" · "30+ ta buyurtma" — chegaralar
 * `LEVELS` dan olinadi, qoʻlda yozilmaydi (aks holda ikki manba ajralib ketadi).
 */
export function levelRangeLabel(level: Level): string {
  const index = LEVELS.findIndex((item) => item.key === level.key);
  const next = index >= 0 ? LEVELS[index + 1] : undefined;
  return next
    ? `${level.minOrders}–${next.minOrders - 1} ta buyurtma`
    : `${level.minOrders}+ ta buyurtma`;
}

/** Keshbek shtamp kartasi izohi — ikki ekranda bir xil matn. */
export function stampHint(cashback: Pick<CashbackProgress, 'filled' | 'remaining'>): string {
  if (cashback.filled === 0) return `Blok boshlanmagan · ${CASHBACK_BLOCK} ta buyurtma qoldi`;
  if (cashback.remaining === 0) return `${CASHBACK_BLOCK} ta toʻldirildi · blok yakunlandi`;
  return `${cashback.filled} ta toʻldirildi · ${cashback.remaining} ta qoldi`;
}

// ────────────────────────────────────────────────────────── izohlar ──

/** "Sentabrda sarflangan" — oy nomi oʻrin-payt kelishigida. */
export const spentOverline = (monthLabel: string): string => `${monthLabel}da sarflangan`;

/**
 * Kartadagi oy izohi. Bu oyda buyurtma boʻlmasa, lekin tarix boʻlsa, yalangʻoch
 * "buyurtma yoʻq" oʻrniga oxirgi toʻlov sanasi — nol halol, lekin maʼnoli.
 */
export function monthCaption(
  ordersThisMonth: number,
  lastPaidAt: Date | null,
  now: Date,
): string {
  if (ordersThisMonth > 0) return `${ordersThisMonth} ta buyurtma`;
  // "Kecha" → "kecha": jumla oʻrtasida bosh harf boʻlmaydi.
  if (lastPaidAt) return `oxirgi toʻlov ${formatDayLabel(lastPaidAt, now).toLocaleLowerCase()}`;
  return 'buyurtma yoʻq';
}

/** "16 ta buyurtma" · "hali buyurtma yoʻq". */
export const totalCaption = (ordersTotal: number): string =>
  ordersTotal > 0 ? `${ordersTotal} ta buyurtma` : 'hali buyurtma yoʻq';
