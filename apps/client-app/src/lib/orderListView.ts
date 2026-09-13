/**
 * Buyurtmalar tabi koʻrinishi (24-ekran) — filtr tablari va tarix qatori
 * matnlari. Sof funksiyalar, React YOʻQ.
 *
 * `orderList.ts` dan ajratilgan: u boʻlish/saralash/amallar haqida, bu fayl
 * esa ekranda NIMA yozilishi haqida (tab yorligʻi, hisob nishoni, meta satr).
 */
import { HISTORY_FILTER_LABELS, type HistoryFilter } from './orderStateMachine';
import { HISTORY_FILTERS, orderFactLine, type OrderFactSource } from './orderList';

// ───────────────────────────────────────────────────────── filtr tablari ──

/**
 * Tab yorliqlari QISQA: toʻrttasi hisob nishoni bilan birga 360px ekranda
 * (320px kontent) BIR qatorga sigʻishi shart — tab qatori scroll qilmaydi.
 * Toʻliq nom (`HISTORY_FILTER_LABELS`) aria-label orqali oʻqiladi.
 */
export const FILTER_TAB_LABELS: Record<HistoryFilter, string> = {
  all: 'Barchasi',
  active: 'Faol',
  done: 'Yakunlangan',
  cancelled: 'Bekor',
};

/** Eng uzun yorliq ("Yakunlangan") — undan uzuni 360px da sigʻmaydi. */
export const MAX_TAB_LABEL_CHARS = 11;

/** Nishonda ikki xonadan ortiq raqam sigʻmaydi — "99+" bilan cheklanadi. */
export const TAB_COUNT_CAP = 99;

/** Hisob nishoni matni; nol boʻlsa `null` — boʻsh nishon chizilmaydi. */
export function formatTabCount(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  return count > TAB_COUNT_CAP ? `${TAB_COUNT_CAP}+` : String(Math.floor(count));
}

/** Ekran oʻquvchi uchun toʻliq nom + son: "Bekor qilingan, 1 ta". */
export function filterTabAriaLabel(filter: HistoryFilter, count: number): string {
  const label = HISTORY_FILTER_LABELS[filter];
  return count > 0 ? `${label}, ${count} ta` : label;
}

export type FilterStep = -1 | 0 | 1;

/**
 * Filtr almashganda roʻyxat qaysi tomondan kiradi: oʻngdagi tabga oʻtilsa
 * kontent oʻngdan (+1), chapdagiga — chapdan (−1), oʻzgarmasa 0.
 */
export function filterStepDirection(from: HistoryFilter, to: HistoryFilter): FilterStep {
  const delta = HISTORY_FILTERS.indexOf(to) - HISTORY_FILTERS.indexOf(from);
  if (delta === 0) return 0;
  return delta > 0 ? 1 : -1;
}

// ───────────────────────────────────────────────────────── tarix qatori ──

/**
 * Tarix qatoridagi fakt. "Yakunlandi: …" TASHLANADI — holat chipi allaqachon
 * "Yakunlandi" deydi, vaqt esa chekda; qatorda ikki marta aytish shovqin.
 * Bekor sababi va xavfsizlik belgisi qoladi — ular yangi maʼlumot.
 */
export function historyRowFact(order: OrderFactSource, now: Date): string | null {
  const fact = orderFactLine(order, now);
  if (!fact || fact.kind === 'completed') return null;
  return fact.text;
}

