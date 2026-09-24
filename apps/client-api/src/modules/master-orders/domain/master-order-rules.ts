import { OrderStatus } from '@prisma/client';

/**
 * Usta tomonining qoidalari — SOF mantiq.
 *
 * Bu yerda na Prisma, na HTTP bor: «qaysi amal qaysi holatda mumkin» degan
 * savol bitta joyda turadi va test bilan toʻliq yopiladi. Servis faqat
 * tranzaksiya va yozuv bilan shugʻullanadi.
 */

/** Usta ilovasidagi amallar. */
export type MasterAction = 'accept' | 'decline' | 'depart' | 'arrive' | 'finish' | 'cancel';

/** Ish ustaning ekranida qaysi roʻyxatga tushadi. */
export type MasterOrderBucket = 'offer' | 'active' | 'history';

/**
 * Usta yetib borish vaqti — daqiqa.
 *
 * Pastki chegara 1: «0 daqiqa» degan javob mijozga hech narsa aytmaydi.
 * Yuqori chegara 240 (4 soat): undan uzoq vaqt ish emas, reja — uni
 * buyurtma ichida emas, qayta rejalashtirish bilan hal qilish kerak.
 */
export const MASTER_ETA_MIN = 1;
export const MASTER_ETA_MAX = 240;

/** Ustaning ish izohi — mijoz chekda koʻradi. */
export const WORK_NOTE_MAX = 300;

/** Usta bandligini bildiruvchi holatlar — `MasterAvailabilityService` bilan bir xil. */
export const MASTER_ACTIVE_STATUSES: readonly OrderStatus[] = [
  OrderStatus.ASSIGNED,
  OrderStatus.MASTER_EN_ROUTE,
  OrderStatus.ARRIVED_PENDING_CONFIRMATION,
  OrderStatus.IN_PROGRESS,
];

/** Usta ekranidagi tarixga tushadigan holatlar. */
export const MASTER_HISTORY_STATUSES: readonly OrderStatus[] = [
  OrderStatus.COMPLETED_BY_MASTER,
  OrderStatus.RATED,
  OrderStatus.CLOSED,
  OrderStatus.CANCELLED,
  OrderStatus.SAFETY_FLAGGED,
];

export interface MasterOrderState {
  readonly status: OrderStatus;
  readonly masterId: string | null;
  /** Usta «qabul qilaman» bosgan payt; `null` — hali javob bermagan. */
  readonly masterAckedAt: Date | null;
}

/**
 * Ish qaysi roʻyxatga tushadi.
 *
 * `ASSIGNED` ikki xil maʼno beradi: usta hali javob bermagan boʻlsa — bu
 * TAKLIF (u yoʻqolishi mumkin, chunki javob kutish vaqti tugaydi), javob
 * bergan boʻlsa — bu allaqachon UNING ishi.
 */
export function bucketOf(order: MasterOrderState): MasterOrderBucket {
  if (order.status === OrderStatus.ASSIGNED) {
    return order.masterAckedAt === null ? 'offer' : 'active';
  }
  if (MASTER_ACTIVE_STATUSES.includes(order.status)) return 'active';
  return 'history';
}

/**
 * Buyurtma shu ustaniki emasligining sababi; `null` — ustaniki.
 *
 * Eng koʻp uchraydigan holat: usta javob berguncha kutish vaqti tugagan va
 * buyurtma boshqasiga oʻtgan. Ekranda «topilmadi» emas, AYNAN shu sabab
 * yozilishi kerak — aks holda usta ilovani buzuq deb oʻylaydi.
 */
export function ownershipProblem(order: MasterOrderState, masterId: string): string | null {
  if (order.masterId === masterId) return null;
  return order.masterId === null
    ? 'Bu buyurtma sizdan olib qoʻyilgan — javob kutish vaqti tugadi.'
    : 'Bu buyurtmani boshqa usta oldi.';
}

/** Amal uchun talab qilinadigan holatlar. */
const REQUIRED_STATUSES: Record<MasterAction, readonly OrderStatus[]> = {
  accept: [OrderStatus.ASSIGNED],
  decline: [OrderStatus.ASSIGNED],
  depart: [OrderStatus.ASSIGNED],
  arrive: [OrderStatus.MASTER_EN_ROUTE],
  finish: [OrderStatus.IN_PROGRESS],
  cancel: [OrderStatus.ASSIGNED, OrderStatus.MASTER_EN_ROUTE],
};

/** Amal bajarib boʻlmasligining sababi; `null` — mumkin. */
export function actionProblem(action: MasterAction, order: MasterOrderState): string | null {
  if (!REQUIRED_STATUSES[action].includes(order.status)) {
    return WRONG_STATE_MESSAGES[action];
  }

  const acked = order.masterAckedAt !== null;

  // «Qabul qilish» va «rad etish» faqat javob berilmagan taklifda maʼnoli.
  if ((action === 'accept' || action === 'decline') && acked) {
    return action === 'accept'
      ? 'Siz bu ishni allaqachon qabul qilgansiz.'
      : 'Ishni qabul qilgansiz — endi uni «Bekor qilish» orqali qaytarasiz.';
  }

  // Yoʻlga chiqishdan oldin ish qabul qilinishi shart: aks holda mijoz
  // ekranida «usta yoʻlda» yozilib, usta esa hali javob bermagan boʻlardi.
  if (action === 'depart' && !acked) {
    return 'Avval ishni qabul qiling.';
  }

  return null;
}

const WRONG_STATE_MESSAGES: Record<MasterAction, string> = {
  accept: 'Bu taklif endi kuchda emas.',
  decline: 'Bu taklif endi kuchda emas.',
  depart: 'Yoʻlga chiqishni faqat qabul qilingan ishda belgilanadi.',
  arrive: 'Yetib kelganingizni faqat yoʻldagi ishda belgilanadi.',
  finish: 'Ishni yakunlash mijoz sizni eshik oldida tasdiqlagandan keyin mumkin.',
  cancel: 'Bu ishni endi bekor qilib boʻlmaydi — mijoz bilan bogʻlaning.',
};

/** ETA chegaradan chiqqanmi; `null` — toʻgʻri. */
export function etaProblem(minutes: number): string | null {
  if (!Number.isInteger(minutes)) return 'Vaqt butun daqiqada koʻrsatiladi.';
  if (minutes < MASTER_ETA_MIN || minutes > MASTER_ETA_MAX) {
    return `Yetib borish vaqti ${MASTER_ETA_MIN} dan ${MASTER_ETA_MAX} daqiqagacha boʻlsin.`;
  }
  return null;
}
