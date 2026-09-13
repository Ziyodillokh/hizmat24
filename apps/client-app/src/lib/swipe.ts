/**
 * Gorizontal surish (swipe) mantigʻi — sof funksiyalar. React YOʻQ, DOM YOʻQ.
 *
 * Hodisa ulanishi `src/app/useSwipe.ts` da; bu yerda faqat arifmetika:
 *  - `lockAxis`     — barmoq 10px yurgach oʻqni tanlaydi (x → surish, y → scroll);
 *  - `resolveSwipe` — qoʻyib yuborilganda surish sanaladimi;
 *  - `previewOffset` — barmoq ostida roʻyxat qancha siljishi (rezina chekka).
 */
export type SwipeDirection = 'left' | 'right';
export type SwipeAxis = 'x' | 'y';

export interface SwipeSample {
  /** Boshlangan nuqtadan gorizontal siljish, px (chapga manfiy). */
  dx: number;
  /** Vertikal siljish, px. */
  dy: number;
  /** Bosishdan qoʻyib yuborishgacha, ms. */
  elapsedMs: number;
}

export interface SwipeRules {
  /** Shu masofadan kam siljish — surish emas. */
  minDistance: number;
  /** |dy| / |dx| shu nisbatdan katta boʻlsa — foydalanuvchi scroll qilgan. */
  maxOffAxisRatio: number;
  /** Sekin sudrash surish emas — foydalanuvchi shunchaki ushlab turgan. */
  maxDurationMs: number;
}

export const SWIPE_RULES: SwipeRules = { minDistance: 48, maxOffAxisRatio: 0.6, maxDurationMs: 800 };

/** Oʻq tanlanadigan minimal yoʻl — Chromium click-slop (~8px) dan biroz katta. */
export const AXIS_LOCK_DISTANCE = 10;

/** Roʻyxat barmoq ortidan koʻpi bilan shuncha siljiydi. */
export const PREVIEW_MAX_OFFSET = 24;
/** Chekkada (keyingi filtr yoʻq) siljish uch barobar qisqa — "rezina". */
export const EDGE_MAX_OFFSET = 8;
const PREVIEW_DAMPING = 0.4;
const EDGE_DAMPING = 0.15;

const isFiniteNumber = (value: number): boolean => Number.isFinite(value);

/**
 * Oʻqni bir marta, dastlabki ~10px da tanlash. `null` — hali erta.
 * Teng boʻlganda vertikal gʻolib: scroll surishdan koʻra tez-tez uchraydi.
 */
export function lockAxis(dx: number, dy: number, slop: number = AXIS_LOCK_DISTANCE): SwipeAxis | null {
  if (!isFiniteNumber(dx) || !isFiniteNumber(dy)) return null;
  if (Math.hypot(dx, dy) < slop) return null;
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
}

/** Barmoq yoʻnalishi: chapga surish → 'left' (keyingi filtr), oʻngga → 'right'. */
export function resolveSwipe(sample: SwipeSample, rules: SwipeRules = SWIPE_RULES): SwipeDirection | null {
  const { dx, dy, elapsedMs } = sample;
  if (!isFiniteNumber(dx) || !isFiniteNumber(dy) || !isFiniteNumber(elapsedMs)) return null;
  if (elapsedMs < 0 || elapsedMs > rules.maxDurationMs) return null;
  const distance = Math.abs(dx);
  if (distance < rules.minDistance) return null;
  if (Math.abs(dy) > distance * rules.maxOffAxisRatio) return null;
  return dx < 0 ? 'left' : 'right';
}

/**
 * Sudrash paytidagi vizual siljish. Yoʻnalishda filtr bor boʻlsa 24px gacha,
 * chekkada 8px gacha "rezina". `dx = 0` → 0.
 */
export function previewOffset(dx: number, hasTarget: boolean): number {
  if (!isFiniteNumber(dx) || dx === 0) return 0;
  const max = hasTarget ? PREVIEW_MAX_OFFSET : EDGE_MAX_OFFSET;
  const damping = hasTarget ? PREVIEW_DAMPING : EDGE_DAMPING;
  const magnitude = Math.min(max, Math.abs(dx) * damping);
  return Math.sign(dx) * magnitude;
}
