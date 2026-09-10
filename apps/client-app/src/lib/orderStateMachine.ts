/**
 * Buyurtma holatlar mantigʻi — spetsifikatsiya 1-boʻlimi (biznes qoidalari)
 * va 10-boʻlimi (status tizimi).
 *
 * MUHIM: ekran komponentlari holatni QOʻLDA tekshirmaydi. Har qanday
 * "shu holatda nima koʻrinadi / nima qilish mumkin" savoli faqat shu
 * fayldagi funksiyalar orqali javob oladi.
 */

/** Backend enum nomlari bilan bir xil. */
export const ORDER_STATUS = {
  SEARCHING: 'SEARCHING',
  SEARCHING_QUEUED: 'SEARCHING_QUEUED',
  ASSIGNED: 'ASSIGNED',
  MASTER_EN_ROUTE: 'MASTER_EN_ROUTE',
  ARRIVED_PENDING_CONFIRMATION: 'ARRIVED_PENDING_CONFIRMATION',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED_BY_MASTER: 'COMPLETED_BY_MASTER',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  SAFETY_FLAGGED: 'SAFETY_FLAGGED',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export type ChipTone = 'primary' | 'warning' | 'success' | 'danger' | 'neutral';

/** 10.2-band — aynan 10 ta chip. "Qoralama" va "Baholandi" yasalmaydi. */
export const STATUS_CHIPS: Record<OrderStatus, { label: string; tone: ChipTone }> = {
  SEARCHING: { label: 'Usta qidirilmoqda', tone: 'warning' },
  SEARCHING_QUEUED: { label: 'Navbatdasiz', tone: 'warning' },
  ASSIGNED: { label: 'Usta topildi', tone: 'primary' },
  MASTER_EN_ROUTE: { label: "Usta yoʻlda", tone: 'primary' },
  ARRIVED_PENDING_CONFIRMATION: { label: 'Usta yetib keldi', tone: 'warning' },
  IN_PROGRESS: { label: 'Ish jarayonida', tone: 'primary' },
  COMPLETED_BY_MASTER: { label: 'Ish yakunlandi — baholang', tone: 'success' },
  CLOSED: { label: 'Yakunlandi', tone: 'success' },
  CANCELLED: { label: 'Bekor qilindi', tone: 'danger' },
  SAFETY_FLAGGED: { label: 'Xavfsizlik tekshiruvida', tone: 'danger' },
};

/** 1-boʻlim, 17-qoida. */
const TERMINAL: readonly OrderStatus[] = [
  ORDER_STATUS.CLOSED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.SAFETY_FLAGGED,
];

export const isTerminal = (status: OrderStatus): boolean => TERMINAL.includes(status);

/** 1-boʻlim, 4-qoida: bekor qilish faqat 4 holatda. Boshqa holatda tugma CHIZILMAYDI. */
const CANCELLABLE: readonly OrderStatus[] = [
  ORDER_STATUS.SEARCHING,
  ORDER_STATUS.SEARCHING_QUEUED,
  ORDER_STATUS.ASSIGNED,
  ORDER_STATUS.MASTER_EN_ROUTE,
];

export const canCancel = (status: OrderStatus): boolean => CANCELLABLE.includes(status);

/** 1-boʻlim, 3-qoida: telefon faqat 4 holatda. Aks holda tugma butunlay yashiriladi. */
const PHONE_VISIBLE: readonly OrderStatus[] = [
  ORDER_STATUS.ASSIGNED,
  ORDER_STATUS.MASTER_EN_ROUTE,
  ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION,
  ORDER_STATUS.IN_PROGRESS,
];

export const isMasterPhoneVisible = (status: OrderStatus): boolean => PHONE_VISIBLE.includes(status);

/** 1-boʻlim, 8-qoida: chek faqat yakunlangan buyurtmalarda. */
export const hasReceipt = (status: OrderStatus): boolean =>
  status === ORDER_STATUS.COMPLETED_BY_MASTER || status === ORDER_STATUS.CLOSED;

/** 1-boʻlim, 7-qoida: baholash faqat "Ish yakunlandi" holatida. */
export const canRate = (status: OrderStatus): boolean => status === ORDER_STATUS.COMPLETED_BY_MASTER;

// ─────────────────────────────────────────────── stepper (10.1-band) ──

export const STEPPER_LABELS = [
  'Qabul qilindi',
  'Usta topildi',
  "Yoʻlda",
  'Ish jarayonida',
  'Yakunlandi',
] as const;

export interface StepperState {
  /** 0-indeksli joriy bosqich; `null` — stepper umuman chizilmaydi. */
  currentStep: number | null;
  /** Joriy bosqich bajarilgan deb belgilanadimi. */
  currentCompleted: boolean;
}

/**
 * 10.1-banddagi xarita, istisnosiz.
 *
 * `ARRIVED_PENDING_CONFIRMATION` — stepper CHIZILMAYDI: bu bloklovchi ekran,
 * 16-band boʻyicha butunlay alohida vizual tilga ega.
 */
export function getStepperState(status: OrderStatus): StepperState {
  switch (status) {
    case ORDER_STATUS.SEARCHING:
    case ORDER_STATUS.SEARCHING_QUEUED:
      return { currentStep: 0, currentCompleted: false };
    case ORDER_STATUS.ASSIGNED:
      return { currentStep: 1, currentCompleted: false };
    case ORDER_STATUS.MASTER_EN_ROUTE:
      return { currentStep: 2, currentCompleted: false };
    case ORDER_STATUS.IN_PROGRESS:
      return { currentStep: 3, currentCompleted: false };
    case ORDER_STATUS.COMPLETED_BY_MASTER:
      // 4-bosqich bajarilgan, 5-bosqich JORIY (pulsatsiya), lekin bajarilgan emas.
      return { currentStep: 4, currentCompleted: false };
    case ORDER_STATUS.CLOSED:
      return { currentStep: 4, currentCompleted: true };
    case ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION:
    case ORDER_STATUS.CANCELLED:
    case ORDER_STATUS.SAFETY_FLAGGED:
      return { currentStep: null, currentCompleted: false };
  }
}

/**
 * 06-ekrandagi aktiv buyurtma kartasi (6 variant).
 * `ARRIVED_PENDING_CONFIRMATION` bu roʻyxatda YOʻQ — u holatda bosh sahifa
 * umuman koʻrsatilmaydi, 16-ekran majburan ochiladi.
 */
export const ACTIVE_ORDER_STATUSES: readonly OrderStatus[] = [
  ORDER_STATUS.SEARCHING,
  ORDER_STATUS.SEARCHING_QUEUED,
  ORDER_STATUS.ASSIGNED,
  ORDER_STATUS.MASTER_EN_ROUTE,
  ORDER_STATUS.IN_PROGRESS,
  ORDER_STATUS.COMPLETED_BY_MASTER,
];

/** 1-boʻlim, 4-qoidaning davomi: bu holatda ilova boshqa ekranga oʻtolmaydi. */
export const isBlockingConfirmation = (status: OrderStatus): boolean =>
  status === ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION;

// ──────────────────────────────── buyurtma tafsiloti (23-ekran) ──

/**
 * 23-ekrandagi tugmalar toʻplami — universal shablon.
 *
 * Roʻyxat ataylab shu yerda, ekran ichida emas: bitta holat uchun notoʻgʻri
 * tugma chizilishi (masalan `IN_PROGRESS` da "Bekor qilish") biznes qoidasini
 * buzadi, shuning uchun u testlanadigan yagona joyda turishi kerak.
 */
export type DetailAction =
  | 'call'
  | 'cancel'
  | 'confirm-master'
  | 'reject-master'
  | 'support'
  | 'rate'
  | 'receipt'
  | 'reorder';

export const DETAIL_ACTION_LABELS: Record<DetailAction, string> = {
  call: "Qoʻngʻiroq qilish",
  cancel: 'Bekor qilish',
  'confirm-master': 'Ha, shu usta',
  'reject-master': "Yoʻq, bu boshqa odam",
  support: "Qoʻllab-quvvatlashga murojaat",
  rate: 'Ishni baholash',
  receipt: "Chekni koʻrish",
  reorder: 'Qayta buyurtma berish',
};

const DETAIL_ACTIONS: Record<OrderStatus, readonly DetailAction[]> = {
  SEARCHING: ['cancel'],
  SEARCHING_QUEUED: ['cancel'],
  ASSIGNED: ['call', 'cancel'],
  MASTER_EN_ROUTE: ['call', 'cancel'],
  ARRIVED_PENDING_CONFIRMATION: ['confirm-master', 'reject-master'],
  IN_PROGRESS: ['call', 'support'],
  COMPLETED_BY_MASTER: ['rate', 'receipt'],
  CLOSED: ['receipt', 'reorder'],
  CANCELLED: ['reorder'],
  SAFETY_FLAGGED: ['support'],
};

export const getDetailActions = (status: OrderStatus): readonly DetailAction[] =>
  DETAIL_ACTIONS[status];

// ──────────────────────────────────── tarix filtrlari (24-ekran) ──

/** Filtrlar KLIENT tomonda ishlaydi — server boʻlimlari emas (24-ekran). */
export type HistoryFilter = 'all' | 'active' | 'done' | 'cancelled';

/**
 * Filtr yorliqlari qisqa: toʻrttasi 390px ekranda bitta qatorga sigʻishi kerak.
 * "Bekor qilingan" bilan qator konteynerdan oshib ketardi va oxirgi segment
 * kesilgandek koʻrinardi.
 */
export const HISTORY_FILTER_LABELS: Record<HistoryFilter, string> = {
  all: 'Barchasi',
  active: 'Aktiv',
  done: 'Yakunlangan',
  cancelled: 'Bekor',
};

export function matchesHistoryFilter(status: OrderStatus, filter: HistoryFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'active':
      return !isTerminal(status);
    case 'done':
      return status === ORDER_STATUS.CLOSED;
    case 'cancelled':
      return status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.SAFETY_FLAGGED;
  }
}

/**
 * Buyurtma tafsilotida xavfsizlik ogohlantirishi koʻrsatiladimi (23-ekran).
 *
 * Alohida funksiya sifatida: ekran ichida `status === ...` yozilsa, qoida
 * kutubxonadan tashqarida qolib ketadi va test bilan qoplanmaydi.
 */
export const needsSafetyNotice = (status: OrderStatus): boolean =>
  status === ORDER_STATUS.SAFETY_FLAGGED;

/**
 * Toʻlov chekidagi holat.
 *
 * `paid` FAQAT `CLOSED` dan chiqadi: pul haqiqatan koʻchgani mijoz ishni
 * tasdiqlaganda maʼlum boʻladi. Undan oldin "toʻlanmagan" deb yozilmaydi —
 * naqd toʻlovda pul allaqachon ustaning qoʻlida boʻlishi mumkin.
 */
export type PaymentStateKey = 'pending' | 'confirm' | 'paid' | 'none';

export function paymentStateFor(status: OrderStatus): PaymentStateKey {
  if (status === ORDER_STATUS.CLOSED) return 'paid';
  if (status === ORDER_STATUS.COMPLETED_BY_MASTER) return 'confirm';
  if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.SAFETY_FLAGGED) return 'none';
  return 'pending';
}
