/**
 * Usta «Ishlar» ekranining mantigʻi — sof funksiyalar. React YOʻQ, DOM YOʻQ.
 *
 * Usta uchun yagona maʼlumot manbai — mijoz rejimida shu qurilmada berilgan
 * `LiveOrder` lar. Parallel «demo ish» obyektlari, soxta mijozlar va soxta
 * `shortId` lar yaratilmaydi (TZ 0.1), shuning uchun bu yerdagi hamma narsa
 * mavjud buyurtmani FILTRLAYDI va unga usta tilida nom beradi.
 *
 * `new Date()` chaqirilmaydi: joriy vaqt har doim `now` parametri.
 */
import type { LiveOrder } from '@/app/types';
import { formatDateTime, formatDuration, formatTime } from './formatters';
import { sortByCreatedDesc } from './orderList';
import {
  isTerminal,
  ORDER_STATUS,
  STATUS_CHIPS,
  type ChipTone,
  type OrderStatus,
} from './orderStateMachine';
import type { SwipeDirection } from './swipe';

// ─────────────────────────────────────────────────────────── filtrlar ──

export type MasterJobFilter = 'offers' | 'active';

export const MASTER_FILTERS: readonly MasterJobFilter[] = ['offers', 'active'];

export const MASTER_FILTER_LABELS: Record<MasterJobFilter, string> = {
  offers: 'Takliflar',
  active: 'Faol',
};

/**
 * Surish boʻyicha qoʻshni filtr: chapga → keyingisi, oʻngga → oldingisi.
 * Chekkada `null` — aylanib oʻtish YOʻQ (mijoz tabidagi jest bilan bir xil).
 */
export function adjacentMasterFilter(
  filter: MasterJobFilter,
  direction: SwipeDirection,
): MasterJobFilter | null {
  const index = MASTER_FILTERS.indexOf(filter);
  if (index === -1) return null;
  return MASTER_FILTERS[direction === 'left' ? index + 1 : index - 1] ?? null;
}

// ───────────────────────────────────────────────────── holat yorliqlari ──

/**
 * Usta koʻradigan holat yorliqlari.
 *
 * TON mijoznikidan OLINADI (`STATUS_CHIPS`) — bir xil holat ikki ekranda
 * bir xil rangda boʻlishi kerak. YORLIQ esa har doim boshqacha: mijozning
 * «Usta topildi» jumlasi ustaning oʻziga hech narsa aytmaydi.
 */
export const MASTER_STATUS_CHIPS: Record<OrderStatus, { label: string; tone: ChipTone }> = {
  SEARCHING: { label: 'Yangi taklif', tone: STATUS_CHIPS.SEARCHING.tone },
  SEARCHING_QUEUED: { label: 'Navbatdagi taklif', tone: STATUS_CHIPS.SEARCHING_QUEUED.tone },
  ASSIGNED: { label: 'Qabul qildingiz', tone: STATUS_CHIPS.ASSIGNED.tone },
  MASTER_EN_ROUTE: { label: 'Yoʻldasiz', tone: STATUS_CHIPS.MASTER_EN_ROUTE.tone },
  ARRIVED_PENDING_CONFIRMATION: {
    label: 'Tasdiq kutilmoqda',
    tone: STATUS_CHIPS.ARRIVED_PENDING_CONFIRMATION.tone,
  },
  IN_PROGRESS: { label: 'Ishdasiz', tone: STATUS_CHIPS.IN_PROGRESS.tone },
  COMPLETED_BY_MASTER: { label: 'Baho kutilmoqda', tone: STATUS_CHIPS.COMPLETED_BY_MASTER.tone },
  CLOSED: { label: 'Yopildi', tone: STATUS_CHIPS.CLOSED.tone },
  CANCELLED: { label: 'Bekor boʻldi', tone: STATUS_CHIPS.CANCELLED.tone },
  SAFETY_FLAGGED: { label: 'Mijoz toʻxtatdi', tone: STATUS_CHIPS.SAFETY_FLAGGED.tone },
};

/**
 * Ustadan hech narsa talab qilinmaydigan, lekin kutish sababi bor holatlar.
 *
 * Ikkala oʻtishni ham MIJOZ qiladi: shaxsni tasdiqlash va baho. Ekran buni
 * yashirmaydi — tugma oʻrniga sabab yoziladi.
 */
export function masterWaitingCopy(status: OrderStatus): string | null {
  if (status === ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION) {
    return 'Mijoz tasdigʻini kutyapsiz';
  }
  if (status === ORDER_STATUS.COMPLETED_BY_MASTER) return 'Mijoz baholashini kutmoqda';
  return null;
}

// ──────────────────────────────────────────────────── roʻyxatga boʻlish ──

export type MasterJobOrder = Pick<LiveOrder, 'id' | 'status' | 'createdAt' | 'handledByMaster'>;

export interface MasterJobsInput {
  /** Usta rad etgan buyurtmalar — ular taklif boʻlib qaytmaydi. */
  declinedIds: readonly string[];
  /** Smena yopiq boʻlsa taklif umuman koʻrsatilmaydi. */
  isAvailable: boolean;
}

/** Taklif shartlari (TZ 0.1) — toʻrttasi ham bajarilishi shart. */
export function isOffer(
  order: MasterJobOrder,
  declinedIds: readonly string[],
  isAvailable: boolean,
): boolean {
  if (!isAvailable || order.handledByMaster) return false;
  const isSearching =
    order.status === ORDER_STATUS.SEARCHING || order.status === ORDER_STATUS.SEARCHING_QUEUED;
  return isSearching && !declinedIds.includes(order.id);
}

/** Faol ish — usta qabul qilgan va hali yopilmagan buyurtma. */
export const isMyJob = (order: MasterJobOrder): boolean =>
  order.handledByMaster && !isTerminal(order.status);

export interface MasterJobsView<T> {
  offers: readonly T[];
  active: readonly T[];
}

/** Ikki zona, ikkalasi ham yangidan eskiga. Kirish massivi oʻzgarmaydi. */
export function splitMasterJobs<T extends MasterJobOrder>(
  orders: readonly T[],
  input: MasterJobsInput,
): MasterJobsView<T> {
  return {
    offers: sortByCreatedDesc(
      orders.filter((order) => isOffer(order, input.declinedIds, input.isAvailable)),
    ),
    active: sortByCreatedDesc(orders.filter(isMyJob)),
  };
}

export type MasterJobCounts = Record<MasterJobFilter, number>;

export function countMasterJobs(
  orders: readonly MasterJobOrder[],
  input: MasterJobsInput,
): MasterJobCounts {
  return {
    offers: orders.filter((order) => isOffer(order, input.declinedIds, input.isAvailable)).length,
    active: orders.filter(isMyJob).length,
  };
}

// ────────────────────────────────────────────────────────── fakt satri ──

export type MasterFactSource = Pick<
  LiveOrder,
  'status' | 'createdAt' | 'scheduledAt' | 'etaMinutes' | 'completedAt' | 'cancelReason'
>;

/**
 * Kartadagi YAGONA ruxsat etilgan fakt satri.
 *
 * `etaMinutes` faqat `ASSIGNED` va `MASTER_EN_ROUTE` da: keyinroq u eskirgan
 * raqamga aylanadi va «yetib kelish» haqida yolgʻon gapirardi.
 */
export function masterJobFactLine(order: MasterFactSource, now: Date): string | null {
  switch (order.status) {
    case ORDER_STATUS.SEARCHING:
    case ORDER_STATUS.SEARCHING_QUEUED:
      return order.scheduledAt
        ? `Rejalashtirilgan: ${formatDateTime(order.scheduledAt, now)}`
        : `Soʻrov ${formatTime(order.createdAt)} da keldi`;
    case ORDER_STATUS.ASSIGNED:
      return order.etaMinutes === null
        ? null
        : `Siz aytgan vaqt: ${formatDuration(order.etaMinutes)}`;
    case ORDER_STATUS.MASTER_EN_ROUTE:
      return order.etaMinutes === null
        ? null
        : `Yetib borish vaqti: ${formatDuration(order.etaMinutes)}`;
    case ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION:
    case ORDER_STATUS.COMPLETED_BY_MASTER:
      return masterWaitingCopy(order.status);
    case ORDER_STATUS.IN_PROGRESS:
      return 'Ish davom etmoqda';
    case ORDER_STATUS.CLOSED:
      return order.completedAt ? `Yakunlandi: ${formatDateTime(order.completedAt, now)}` : null;
    case ORDER_STATUS.CANCELLED:
      return order.cancelReason ? `Sabab: ${order.cancelReason}` : null;
    case ORDER_STATUS.SAFETY_FLAGGED:
      return 'Mijoz eshik oldida ishni toʻxtatdi';
  }
}

// ─────────────────────────────────────────────────────── qabul qilish ──

export interface AcceptGuardInput {
  isComplete: boolean;
  hasActiveJob: boolean;
}

/** Toʻliq boʻlmagan profil bilan ham, ikkinchi faol ish bilan ham qabul qilinmaydi. */
export const canAcceptOffer = (input: AcceptGuardInput): boolean =>
  input.isComplete && !input.hasActiveJob;

/** Tugma nega oʻchiq — sababi ekranda yoziladi, jimgina oʻchirilmaydi. */
export function acceptBlockedLine(input: AcceptGuardInput): string | null {
  if (!input.isComplete) return 'Profil toʻliq boʻlgunicha taklifni qabul qila olmaysiz.';
  if (input.hasActiveJob) {
    return 'Avval faol ishni yakunlang — bir vaqtda bitta ish olib boriladi.';
  }
  return null;
}

/** Usta tanlaydigan yetib borish vaqtlari (daqiqa). */
export const ETA_OPTIONS: readonly number[] = [10, 15, 20, 30, 45, 60];

export const etaOptionLabel = (minutes: number): string => formatDuration(minutes);

export const ETA_SHEET_TITLE = 'Qancha vaqtda yetib borasiz?';

export const ETA_SHEET_HINT =
  'Mijoz aynan shu vaqtni koʻradi. Aniq boʻlmasa, koʻproq vaqt tanlang.';

/** Ish izohi chegarasi — `buildFinishPatch` ham, revive ham shu raqamga tayanadi. */
export const WORK_NOTE_MAX = 300;

// ───────────────────────────────────────────────────────── boʻsh holat ──

export type MasterEmptyCta = 'open-shift' | 'client-mode' | 'show-offers';

export const MASTER_EMPTY_CTA_LABELS: Record<MasterEmptyCta, string> = {
  'open-shift': 'Smenani boshlash',
  'client-mode': 'Mijoz rejimiga oʻtish',
  'show-offers': 'Takliflarga oʻtish',
};

export interface MasterEmptyCopy {
  title: string;
  description: string;
  cta: MasterEmptyCta;
}

export interface MasterEmptyInput {
  isAvailable: boolean;
  counts: MasterJobCounts;
}

/** `null` — roʻyxat boʻsh emas, boʻsh holat chizilmaydi. */
export function masterEmptyStateFor(
  filter: MasterJobFilter,
  input: MasterEmptyInput,
): MasterEmptyCopy | null {
  if (filter === 'active') {
    return input.counts.active > 0
      ? null
      : {
          title: 'Faol ish yoʻq',
          description: 'Taklifni qabul qilsangiz, ish shu yerda kuzatiladi.',
          cta: 'show-offers',
        };
  }

  if (!input.isAvailable) {
    return {
      title: 'Smena yopiq',
      description: 'Smenani boshlang — shu qurilmadagi buyurtmalar taklif boʻlib shu yerda chiqadi.',
      cta: 'open-shift',
    };
  }

  return input.counts.offers > 0
    ? null
    : {
        title: 'Hozircha taklif yoʻq',
        description:
          'Mijoz rejimiga oʻtib bitta buyurtma bering — smena ochiq boʻlsa, u shu yerda taklif boʻlib chiqadi.',
        cta: 'client-mode',
      };
}

// ───────────────────────────────────────────────────────── ekran matni ──

/** Ishlar ekranidagi manba bayonoti — hech qachon yashirilmaydi (TZ 0.1). */
export const MASTER_SOURCE_LINE =
  'Server ulanmagan. Takliflar shu telefonda mijoz rejimida berilgan buyurtmalardan keladi; boshqa odamlarning buyurtmalari ilovaga tushmaydi.';

/** Rad etishdan keyingi toast — buyurtma mijoz dunyosida qoladi. */
export const DECLINE_TOAST = 'Rad etdingiz — buyurtma shu qurilmada boshqa ustaga qoladi.';

export const ACCEPT_TOAST = 'Qabul qildingiz — mijoz ekranida sizning kartangiz chiqdi.';

/**
 * Faol ish kartasi ostidagi qator.
 *
 * Bu bosqichda «Yoʻlga chiqdim» tugmasi hali yoʻq va uni chizmaslik yetarli
 * emas: ekran nima kutilayotganini AYTADI, oʻlik tugma qoldirmaydi.
 */
export const MASTER_NEXT_STAGE_LINE =
  'Yoʻlga chiqish, yetib kelish va yakunlash tugmalari keyingi bosqichda ulanadi.';

// ────────────────────────────────────────────────────────── ish amallari ──

/**
 * Usta bajara oladigan oʻtishlar.
 *
 * Roʻyxat holat mashinasining oʻzidan KOʻPAYTIRMAYDI: har bir amal mavjud
 * beshta avtomatik oʻtishdan bittasini almashtiradi. Ikkita oʻtish ustaga
 * hech qachon berilmaydi — shaxsni tasdiqlash va baho MIJOZNIKI.
 */
export type MasterAction = 'depart' | 'arrive' | 'finish' | 'cancel' | 'client-mode' | 'support';

export const MASTER_ACTION_LABELS: Record<MasterAction, string> = {
  depart: 'Yoʻlga chiqdim',
  arrive: 'Yetib keldim',
  finish: 'Ishni yakunlash',
  cancel: 'Ishni bekor qilish',
  'client-mode': 'Mijoz rejimiga oʻtish',
  support: 'Qoʻllab-quvvatlash',
};

/** Toʻldirilgan tugma — ekrandagi asosiy amal; qolganlari ikkinchi darajali. */
export const isPrimaryMasterAction = (action: MasterAction): boolean =>
  action === 'depart' || action === 'arrive' || action === 'finish';

/**
 * Holatga mos amallar, tartibi bilan (birinchisi — asosiy).
 *
 * `IN_PROGRESS` da bekor qilish YOʻQ: mijoz eshik oldida shaxsni tasdiqlagan
 * va ish boshlangan; chiqish yoʻli — qoʻllab-quvvatlash.
 */
export function getMasterActions(status: OrderStatus): readonly MasterAction[] {
  switch (status) {
    case ORDER_STATUS.ASSIGNED:
      return ['depart', 'cancel'];
    case ORDER_STATUS.MASTER_EN_ROUTE:
      return ['arrive', 'cancel'];
    case ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION:
      return ['client-mode', 'support'];
    case ORDER_STATUS.IN_PROGRESS:
      return ['finish', 'support'];
    case ORDER_STATUS.CANCELLED:
    case ORDER_STATUS.SAFETY_FLAGGED:
      return ['support'];
    default:
      return [];
  }
}

/** Ish kartasidagi ixcham stepper yorliqlari — usta tilida. */
export const MASTER_STEPPER_LABELS: readonly string[] = [
  'Taklif',
  'Qabul qildim',
  'Yoʻldaman',
  'Ish jarayonida',
  'Yakunladim',
];

/** Bekor qilish sabablari — erkin matn emas, tanlov. */
export const MASTER_CANCEL_REASONS: readonly string[] = [
  'Manzilga yetib bora olmadim',
  'Kerakli ehtiyot qism yoʻq',
  'Mijoz javob bermadi',
  'Ish mening yoʻnalishimda emas',
  'Boshqa sabab',
];

export const CANCEL_SHEET_TITLE = 'Ishni bekor qilasizmi?';

export const CANCEL_SHEET_HINT =
  'Bekor qilsangiz, mijoz buni koʻradi va buyurtma yopiladi. Boshqa ustaga oʻtmaydi — server yoʻq.';

/** Kutish kartalari — tugma oʻrniga sabab (TZ 4.4, 8-blok). */
export interface MasterWaitingCard {
  title: string;
  description: string;
}

export function masterWaitingCard(status: OrderStatus): MasterWaitingCard | null {
  if (status === ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION) {
    return {
      title: 'Mijozning tasdigʻini kutyapsiz',
      description:
        'Mijoz eshik oldida shaxsingizni tasdiqlaydi. Tasdiqlamaguncha bu yerda tugma boʻlmaydi — bu uning xavfsizlik qadami.',
    };
  }
  if (status === ORDER_STATUS.COMPLETED_BY_MASTER) {
    return {
      title: 'Mijoz baholaydi',
      description:
        'Buyurtma mijoz baho bergach yopiladi. Naqd pulni olganingizga ishonch hosil qiling.',
    };
  }
  return null;
}

/** Ish kartasidagi doimiy izohlar — ilova nimani BILMASLIGI ochiq aytiladi. */
export const ADDRESS_HINT = 'Manzil mijoz kiritgan matn. Xarita va masofa yoʻq.';

export const PRICE_FIXED_HINT = 'Narx buyurtma berilganda belgilangan va oʻzgarmaydi.';

export const COMMISSION_HINT =
  'Platforma komissiyasi foizi hali belgilanmagan — sof daromad koʻrsatilmaydi.';

export const CLIENT_CONTACT_HINT =
  'Bu qurilmada mijoz ham, usta ham — bitta raqam. Shuning uchun qoʻngʻiroq tugmasi chizilmaydi.';

export const DEPART_TOAST = 'Yoʻlga chiqdingiz — mijoz ekranida holat yangilandi.';

export const ARRIVE_TOAST = 'Yetib keldingiz — mijoz shaxsingizni tasdiqlaydi.';

export const CANCEL_TOAST = 'Ish bekor qilindi — mijoz buni koʻradi.';

export const FINISH_TOAST = 'Ish yakunlandi — mijoz baholashini kutamiz.';
