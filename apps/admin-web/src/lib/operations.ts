import type { AdminOrderRow, OrderStatus, SafetyResolution } from '@/api/admin';

/**
 * Operator boʻlimlarining sof mantiqi — React yoʻq, tarmoq yoʻq (A3, A4).
 *
 * Bu yerda faqat KOʻRSATISH qoidalari. «Qaysi amal mumkin» degan qaror
 * SERVERDA: panel uni takrorlamaydi, aks holda ikki joy bir-biridan
 * ogʻib ketardi va tugma ochiq turib, soʻrov rad etilardi.
 */

export type OrderStatusFilter = OrderStatus | 'ALL';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: 'Qoralama',
  SEARCHING: 'Usta qidirilmoqda',
  SEARCHING_QUEUED: 'Navbatda',
  ASSIGNED: 'Usta tayinlandi',
  MASTER_EN_ROUTE: 'Usta yoʻlda',
  ARRIVED_PENDING_CONFIRMATION: 'Eshik oldida',
  IN_PROGRESS: 'Ish jarayonida',
  COMPLETED_BY_MASTER: 'Usta yakunladi',
  RATED: 'Baholandi',
  CLOSED: 'Yopildi',
  CANCELLED: 'Bekor qilindi',
  SAFETY_FLAGGED: 'Xavfsizlik signali',
};

export type Tone = 'neutral' | 'success' | 'warning' | 'danger';

export const ORDER_STATUS_TONES: Record<OrderStatus, Tone> = {
  DRAFT: 'neutral',
  SEARCHING: 'warning',
  SEARCHING_QUEUED: 'warning',
  ASSIGNED: 'neutral',
  MASTER_EN_ROUTE: 'neutral',
  ARRIVED_PENDING_CONFIRMATION: 'warning',
  IN_PROGRESS: 'neutral',
  COMPLETED_BY_MASTER: 'success',
  RATED: 'success',
  CLOSED: 'success',
  CANCELLED: 'neutral',
  SAFETY_FLAGGED: 'danger',
};

/** Roʻyxat tepasidagi filtrlar — operator kunlik ishi shu tartibda. */
export const ORDER_FILTERS: ReadonlyArray<{ key: OrderStatusFilter; label: string }> = [
  { key: 'ALL', label: 'Hammasi' },
  { key: 'SEARCHING', label: 'Qidiruvda' },
  { key: 'ASSIGNED', label: 'Tayinlangan' },
  { key: 'IN_PROGRESS', label: 'Ishda' },
  { key: 'CLOSED', label: 'Yopilgan' },
  { key: 'CANCELLED', label: 'Bekor' },
];

/**
 * Qatorning ogohlantiruvchi rangi.
 *
 * Faqat IKKI holat ajratiladi: eskalatsiya (usta topilmadi) va
 * xavfsizlik signali. Qolganini boʻyash roʻyxatni oʻqib boʻlmas holga
 * keltirardi — rang koʻp boʻlsa, u maʼnosini yoʻqotadi.
 */
export function rowTone(order: Pick<AdminOrderRow, 'isEscalated' | 'status'>): Tone | null {
  if (order.status === 'SAFETY_FLAGGED') return 'danger';
  return order.isEscalated ? 'warning' : null;
}

/** Sabab chegaralari — server DTO si bilan bir xil. */
export const REASON_MIN = 10;
export const REASON_MAX = 500;
export const NOTE_MIN = 10;
export const NOTE_MAX = 1000;

/** Sabab maydonidagi xato; `null` — yozish mumkin. */
export function reasonProblem(value: string, min = REASON_MIN, max = REASON_MAX): string | null {
  const length = value.trim().length;
  if (length === 0) return 'Sababni yozing';
  if (length < min) return `Kamida ${min} belgi — hozir ${length} ta`;
  if (length > max) return `Koʻpi bilan ${max} belgi`;
  return null;
}

export const SAFETY_RESOLUTIONS: ReadonlyArray<{ key: SafetyResolution; label: string; hint: string }> =
  [
    {
      key: 'CONFIRMED',
      label: 'Tasdiqlandi',
      hint: 'Kelgan odam haqiqatan boshqa shaxs edi',
    },
    {
      key: 'FALSE_ALARM',
      label: 'Yolgʻon signal',
      hint: 'Mijoz adashgan, usta oʻsha odam edi',
    },
    {
      key: 'NO_CONTACT',
      label: 'Bogʻlana olmadim',
      hint: 'Mijoz ham, usta ham javob bermadi',
    },
  ];

export const SAFETY_RESOLUTION_LABELS: Record<SafetyResolution, string> = {
  CONFIRMED: 'Tasdiqlandi',
  FALSE_ALARM: 'Yolgʻon signal',
  NO_CONTACT: 'Bogʻlana olmadim',
};

/** Signal holati yorligʻi. */
export const ALERT_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ochiq',
  ACKNOWLEDGED: 'Koʻrildi',
  RESOLVED: 'Yopildi',
};

/**
 * Holatlar tarixidagi aktyor nomi.
 *
 * `SYSTEM` — avtomatik qidiruv yoki taymer. Buni «admin» deb koʻrsatish
 * kimdir qoʻlda aralashgandek taassurot berardi.
 */
export const ACTOR_LABELS: Record<string, string> = {
  CLIENT: 'Mijoz',
  MASTER: 'Usta',
  ADMIN: 'Operator',
  SYSTEM: 'Tizim',
};

/**
 * Toʻlov usuli — odam tilida.
 *
 * Server enum qiymatini (`CASH`) qaytaradi; uni ekranda shundayligicha
 * koʻrsatish texnik tafsilotni operatorga yuklash boʻlardi.
 */
export function paymentLabel(method: string | null): string {
  if (method === null) return 'tanlanmagan';
  return PAYMENT_LABELS[method] ?? method;
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Naqd',
  CARD: 'Karta',
  ESCROW: 'Kafolatli toʻlov',
};
