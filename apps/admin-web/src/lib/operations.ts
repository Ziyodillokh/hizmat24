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

// ──────────────────────────────── foydalanuvchilar va audit (A5, A7) ──

export const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Faol',
  BLOCKED: 'Bloklangan',
};

export const MASTER_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Boʻsh',
  BUSY: 'Ishda',
  OFFLINE: 'Smena yopiq',
};

/**
 * Audit amallarining odam tilidagi nomi.
 *
 * Roʻyxat toʻliq boʻlmasligi mumkin — serverda yangi amal paydo
 * boʻlsa, u xom nomi bilan koʻrinadi. Bu «nomaʼlum» deb yashirishdan
 * yaxshi: operator hech boʻlmasa nima boʻlganini taxmin qila oladi.
 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  ORDER_STATUS_CHANGED: 'Buyurtma holati oʻzgardi',
  SAFETY_FLAG_RAISED: 'Xavfsizlik signali',
  MASTER_ASSIGNED: 'Usta tayinlandi',
  MASTER_ACK_TIMEOUT: 'Usta javob bermadi',
  MATCHING_ESCALATED: 'Usta topilmadi',
  ORDER_CANCELLED: 'Buyurtma bekor qilindi',
  ADMIN_LOGIN_SUCCEEDED: 'Panelga kirish',
  ADMIN_LOGIN_FAILED: 'Kirish urinishi rad etildi',
  ADMIN_LOCKED: 'Hisob qulflandi',
  ADMIN_LOGGED_OUT: 'Paneldan chiqish',
  CATALOG_CATEGORY_CREATED: 'Xizmat qoʻshildi',
  CATALOG_CATEGORY_UPDATED: 'Xizmat tahrirlandi',
  CATALOG_PRICE_CHANGED: 'Narx oʻzgardi',
  MASTER_SERVICES_CHANGED: 'Usta xizmatlarini oʻzgartirdi',
  MASTER_APPLICATION_SUBMITTED: 'Ariza yuborildi',
  MASTER_APPLICATION_APPROVED: 'Ariza tasdiqlandi',
  MASTER_APPLICATION_REJECTED: 'Ariza rad etildi',
  SERVICE_AREA_UPDATED: 'Xizmat hududi oʻzgardi',
  MASTER_ORDER_ACCEPTED: 'Usta ishni qabul qildi',
  MASTER_ORDER_DECLINED: 'Usta ishni rad etdi',
  MASTER_SHIFT_CHANGED: 'Usta smenasi oʻzgardi',
  ADMIN_ORDER_REQUEUED: 'Qayta qidiruvga qoʻyildi',
  ADMIN_ORDER_CANCELLED: 'Operator bekor qildi',
  SAFETY_ALERT_RESOLVED: 'Xavfsizlik signali yopildi',
  MASTER_BLOCKED: 'Usta bloklandi',
  MASTER_UNBLOCKED: 'Usta blokdan chiqarildi',
  USER_BLOCKED: 'Foydalanuvchi bloklandi',
  USER_UNBLOCKED: 'Foydalanuvchi blokdan chiqarildi',
  PII_VIEWED: 'Telefon raqami ochildi',
};

export const auditActionLabel = (action: string): string =>
  AUDIT_ACTION_LABELS[action] ?? action;

/** Audit filtridagi amallar — eng koʻp qidiriladiganlari. */
export const AUDIT_ACTION_FILTERS: readonly string[] = [
  'PII_VIEWED',
  'USER_BLOCKED',
  'MASTER_BLOCKED',
  'ADMIN_ORDER_CANCELLED',
  'ADMIN_ORDER_REQUEUED',
  'SAFETY_ALERT_RESOLVED',
  'CATALOG_PRICE_CHANGED',
  'SERVICE_AREA_UPDATED',
];

/**
 * Oʻrtacha tayinlash vaqti — odam oʻqiydigan shaklda.
 *
 * `null` — bu davrda tayinlangan buyurtma yoʻq. «0 s» deb yozish
 * «bir zumda tayinlandi» degan yolgʻon boʻlardi.
 */
export function assignSecondsLabel(seconds: number | null): string {
  if (seconds === null) return 'maʼlumot yoʻq';
  if (seconds < 60) return `${seconds} soniya`;

  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} daqiqa` : `${minutes} daq ${rest} s`;
}

/** Foiz koʻrsatkichi; `null` — hisoblab boʻlmaydi. */
export const percentLabel = (value: number | null): string =>
  value === null ? '—' : `${value}%`;

/** Qidiruvda serverning eng kam uzunligi (`SearchQueryDto`, `ListOrdersQueryDto`). */
export const SEARCH_MIN = 2;

/**
 * Qidiruv matni serverga yuborilsa boʻladimi.
 *
 * Bitta belgi server tekshiruvidan oʻtmaydi va 400 qaytaradi. Panel uni
 * yuborsa, operator ekranda inglizcha texnik matnni koʻrar va roʻyxat
 * yoʻqolardi — buyurtmalar ekranida bu har 5 soniyada takrorlanardi.
 *
 * `null` — yuborsa boʻladi (boʻsh matn ham: u shunchaki filtrsiz roʻyxat).
 */
export const searchProblem = (term: string): string | null => {
  const trimmed = term.trim();
  if (trimmed.length === 0 || trimmed.length >= SEARCH_MIN) return null;

  return `Qidiruv uchun kamida ${SEARCH_MIN} belgi yozing.`;
};

/** Serverga yuboriladigan qiymat; qisqa matn UMUMAN yuborilmaydi. */
export const searchParam = (term: string): string | undefined => {
  const trimmed = term.trim();
  return trimmed.length >= SEARCH_MIN ? trimmed : undefined;
};
