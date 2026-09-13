/**
 * Buyurtmalar roʻyxati (24-ekran) mantigʻi — sof funksiyalar. React YOʻQ.
 *
 * Kartadagi HAR BIR satr `LiveOrder` ning haqiqiy maydonidan chiqadi va
 * aynan shu maydon maʼnoli boʻlgan holatga bogʻlanadi. Masalan `etaMinutes`
 * store’da `IN_PROGRESS` da ham 15 boʻlib qoladi — u faqat usta yoʻlga
 * chiqmasdan oldin koʻrsatiladi. Tugma esa faqat mavjud marshrutga olib boradi.
 */
import type { LiveOrder } from '@/app/types';
import type { SwipeDirection } from './swipe';
import {
  formatApproxDuration,
  formatDateTime,
  formatQueuePosition,
  formatTime,
  orderDateGroup,
} from './formatters';
import {
  canCancel,
  canOpenEnRoute,
  HISTORY_FILTER_LABELS,
  isTerminal,
  matchesHistoryFilter,
  ORDER_STATUS,
  type HistoryFilter,
  type OrderStatus,
} from './orderStateMachine';

export const HISTORY_FILTERS: readonly HistoryFilter[] = ['all', 'active', 'done', 'cancelled'];

/**
 * Surish boʻyicha qoʻshni filtr: chapga surish → keyingisi (all → active → done
 * → cancelled), oʻngga → oldingisi. Chekkada `null` — aylanib oʻtish YOʻQ.
 */
export function adjacentHistoryFilter(filter: HistoryFilter, direction: SwipeDirection): HistoryFilter | null {
  const index = HISTORY_FILTERS.indexOf(filter);
  if (index === -1) return null;
  const next = direction === 'left' ? index + 1 : index - 1;
  return HISTORY_FILTERS[next] ?? null;
}

// ───────────────────────────────────────────── saralash va guruhlash ──

type Dated = { createdAt: Date };
type Listable = Pick<LiveOrder, 'id' | 'status' | 'createdAt'>;

/** Yangi array qaytaradi — kirish massivi oʻzgarmaydi. */
export const sortByCreatedDesc = <T extends Dated>(orders: readonly T[]): T[] =>
  [...orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

export interface OrderGroup<T> {
  title: string;
  orders: readonly T[];
}

/**
 * Sana guruhlari: "Bugun" · "Kecha" · "Sentabr" · "2025-yil dekabr".
 * Avval saralanadi, shuning uchun guruhlar uzluksiz va sarlavhalar takrorlanmaydi.
 */
export function groupOrdersByDate<T extends Dated>(orders: readonly T[], now: Date): OrderGroup<T>[] {
  return sortByCreatedDesc(orders).reduce<OrderGroup<T>[]>((groups, order) => {
    const title = orderDateGroup(order.createdAt, now);
    const last = groups[groups.length - 1];
    if (last && last.title === title) {
      return [...groups.slice(0, -1), { title, orders: [...last.orders, order] }];
    }
    return [...groups, { title, orders: [order] }];
  }, []);
}

export interface OrderListView<T> {
  /** Terminal boʻlmagan buyurtmalar — boy karta, yangidan eskiga. */
  active: readonly T[];
  /** Terminal buyurtmalar — ixcham qator, sana guruhlarida. */
  history: readonly OrderGroup<T>[];
}

/**
 * Filtr boʻyicha ikki zona: `all` → ikkalasi, `active` → faqat faol,
 * `done`/`cancelled` → faqat tarix. Store tartibiga tayanmaydi.
 */
export function splitOrderList<T extends Listable>(
  orders: readonly T[],
  filter: HistoryFilter,
  now: Date,
): OrderListView<T> {
  const showsActive = filter === 'all' || filter === 'active';
  const active = showsActive ? sortByCreatedDesc(orders.filter((o) => !isTerminal(o.status))) : [];
  const history =
    filter === 'active'
      ? []
      : groupOrdersByDate(
          orders.filter((o) => isTerminal(o.status) && matchesHistoryFilter(o.status, filter)),
          now,
        );
  return { active, history };
}

/** "Bugun"/"Kecha" guruhida sarlavha kunni aytgan — qatorda faqat soat qoladi. */
export const historyDateLabel = (createdAt: Date, groupTitle: string, now: Date): string =>
  groupTitle === 'Bugun' || groupTitle === 'Kecha'
    ? formatTime(createdAt)
    : formatDateTime(createdAt, now);

// ─────────────────────────────────────────────────── filtr hisoblari ──

export type OrderCounts = Record<HistoryFilter, number>;

export function countByHistoryFilter(statuses: readonly OrderStatus[]): OrderCounts {
  const count = (filter: HistoryFilter) =>
    statuses.filter((status) => matchesHistoryFilter(status, filter)).length;
  return { all: count('all'), active: count('active'), done: count('done'), cancelled: count('cancelled') };
}

/** "Faol · 2"; nol boʻlsa faqat yorliq — "· 0" hech narsa aytmaydi. */
export const filterLabelWithCount = (filter: HistoryFilter, count: number): string =>
  count > 0 ? `${HISTORY_FILTER_LABELS[filter]} · ${count}` : HISTORY_FILTER_LABELS[filter];

// ───────────────────────────────────────────────────── haqiqiy fakt ──

export type FactKind =
  | 'sent'
  | 'scheduled'
  | 'queue'
  | 'eta'
  | 'confirm'
  | 'progress'
  | 'completed'
  | 'cancel'
  | 'flagged';

export interface OrderFact {
  kind: FactKind;
  text: string;
}

export type OrderFactSource = Pick<
  LiveOrder,
  'status' | 'createdAt' | 'scheduledAt' | 'queuePosition' | 'etaMinutes' | 'completedAt' | 'cancelReason' | 'master'
>;

/**
 * Kartadagi YAGONA ruxsat etilgan fakt satri.
 *
 * `etaMinutes` faqat ASSIGNED/MASTER_EN_ROUTE da (keyin u eskirgan 15),
 * `queuePosition` faqat SEARCHING_QUEUED da (tayinlangach tozalanmaydi),
 * `completedAt` faqat yakunlanganda, `cancelReason` faqat bekor qilinganda.
 * Navbat kutish vaqti YOʻQ — ilovadagi yagona qiymat demo konstanta.
 */
export function orderFactLine(order: OrderFactSource, now: Date): OrderFact | null {
  switch (order.status) {
    case ORDER_STATUS.SEARCHING:
      return order.scheduledAt
        ? { kind: 'scheduled', text: `Rejalashtirilgan: ${formatDateTime(order.scheduledAt, now)}` }
        : { kind: 'sent', text: `Soʻrov ${formatTime(order.createdAt)} da yuborildi` };
    case ORDER_STATUS.SEARCHING_QUEUED:
      return order.queuePosition !== null
        ? { kind: 'queue', text: `Navbatdagi oʻrningiz: ${formatQueuePosition(order.queuePosition)}` }
        : null;
    case ORDER_STATUS.ASSIGNED:
    case ORDER_STATUS.MASTER_EN_ROUTE:
      return order.etaMinutes !== null
        ? { kind: 'eta', text: `Taxminiy yetib kelish: ${formatApproxDuration(order.etaMinutes)}` }
        : null;
    case ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION:
      return { kind: 'confirm', text: 'Tasdiqlashingiz kutilmoqda' };
    case ORDER_STATUS.IN_PROGRESS:
      // Usta qatori yagona haqiqiy faktni aytadi; u boʻlmasa neytral satr.
      return order.master ? null : { kind: 'progress', text: 'Ish davom etmoqda' };
    case ORDER_STATUS.COMPLETED_BY_MASTER:
      return {
        kind: 'completed',
        text: order.completedAt
          ? `Yakunlandi: ${formatDateTime(order.completedAt, now)} · Baholashni kutmoqda`
          : 'Baholashni kutmoqda',
      };
    case ORDER_STATUS.CLOSED:
      return order.completedAt
        ? { kind: 'completed', text: `Yakunlandi: ${formatDateTime(order.completedAt, now)}` }
        : null;
    case ORDER_STATUS.CANCELLED:
      return order.cancelReason ? { kind: 'cancel', text: `Sabab: ${order.cancelReason}` } : null;
    case ORDER_STATUS.SAFETY_FLAGGED:
      return { kind: 'flagged', text: 'Ustani tasdiqlamadingiz' };
  }
}

// ───────────────────────────────────────────────────────── amallar ──

export const ORDER_ROUTES = {
  detail: (id: string) => `/app/order/${id}`,
  confirmMaster: (id: string) => `/app/order/${id}/confirm-master`,
  rate: (id: string) => `/app/order/${id}/rate`,
  receipt: (id: string) => `/app/order/${id}/receipt`,
  map: (id: string) => `/app/order/${id}/map`,
} as const;

export type ListActionKind = 'track' | 'map' | 'cancel' | 'confirm-master' | 'rate' | 'receipt';

export interface ListAction {
  kind: ListActionKind;
  label: string;
  route: string;
  /** `OrderTracking` shu holat bilan bekor qilish varagʻini oʻzi ochadi. */
  state?: { openCancel: true };
}

export type ListActionSource = Pick<LiveOrder, 'id' | 'status' | 'master'>;

/** Bosh amal — faqat kutubxona qoidalari orqali; terminal bekor holatlarda `null`. */
export function primaryListAction(order: ListActionSource): ListAction | null {
  const { id, status } = order;
  switch (status) {
    case ORDER_STATUS.SEARCHING:
    case ORDER_STATUS.SEARCHING_QUEUED:
    case ORDER_STATUS.ASSIGNED:
    case ORDER_STATUS.IN_PROGRESS:
      return { kind: 'track', label: 'Kuzatish', route: ORDER_ROUTES.detail(id) };
    case ORDER_STATUS.MASTER_EN_ROUTE:
      // Xarita sahifasi oʻzi `canOpenEnRoute && master` ni tekshiradi — shu qoida.
      return canOpenEnRoute(status) && order.master
        ? { kind: 'map', label: 'Xaritada kuzatish', route: ORDER_ROUTES.map(id) }
        : { kind: 'track', label: 'Kuzatish', route: ORDER_ROUTES.detail(id) };
    case ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION:
      return { kind: 'confirm-master', label: 'Ustani tasdiqlash', route: ORDER_ROUTES.confirmMaster(id) };
    case ORDER_STATUS.COMPLETED_BY_MASTER:
      return { kind: 'rate', label: 'Ishni baholash', route: ORDER_ROUTES.rate(id) };
    case ORDER_STATUS.CLOSED:
      return { kind: 'receipt', label: 'Chekni koʻrish', route: ORDER_ROUTES.receipt(id) };
    case ORDER_STATUS.CANCELLED:
    case ORDER_STATUS.SAFETY_FLAGGED:
      return null;
  }
}

/** Ikkinchi amal: bekor qilish (4 holat) yoki chek (baholash oldidan). */
export function secondaryListAction(order: ListActionSource): ListAction | null {
  if (canCancel(order.status)) {
    return {
      kind: 'cancel',
      label: 'Bekor qilish',
      route: ORDER_ROUTES.detail(order.id),
      state: { openCancel: true },
    };
  }
  if (order.status === ORDER_STATUS.COMPLETED_BY_MASTER) {
    return { kind: 'receipt', label: 'Chekni koʻrish', route: ORDER_ROUTES.receipt(order.id) };
  }
  return null;
}

/** Toʻldirilgan (primary) tugma faqat foydalanuvchidan javob kutilganda. */
export const isEmphasisedAction = (kind: ListActionKind): boolean =>
  kind === 'confirm-master' || kind === 'rate';

// ───────────────────────────────────────────────────── boʻsh holat ──

export type EmptyCta = 'services' | 'show-active' | 'show-all';

export interface EmptyCopy {
  title: string;
  description: string;
  cta: EmptyCta;
}

export const EMPTY_CTA_LABELS: Record<EmptyCta, string> = {
  services: 'Ustani chaqirish',
  'show-active': 'Faollarni koʻrish',
  'show-all': 'Barchasini koʻrish',
};

/** `null` — filtrlangan toʻplam boʻsh emas, boʻsh holat chizilmaydi. */
export function emptyStateFor(filter: HistoryFilter, counts: OrderCounts): EmptyCopy | null {
  if (counts.all === 0) {
    return {
      title: 'Hozircha buyurtmalaringiz yoʻq',
      description: 'Xizmatni tanlang — buyurtma shu yerda koʻrinadi',
      cta: 'services',
    };
  }
  if (counts[filter] > 0) return null;

  switch (filter) {
    case 'active':
      return {
        title: 'Hozir faol buyurtma yoʻq',
        description: 'Yangi buyurtma bergach, u shu yerda kuzatiladi',
        cta: 'services',
      };
    case 'done':
      return {
        title: 'Yakunlangan buyurtma yoʻq',
        description: 'Ish tugab, siz baholaganingizdan soʻng buyurtma shu yerga tushadi',
        cta: counts.active > 0 ? 'show-active' : 'services',
      };
    case 'cancelled':
      return {
        title: 'Bekor qilingan buyurtma yoʻq',
        description: 'Bekor qilingan yoki tekshiruvdagi buyurtmalar shu yerda koʻrinadi',
        cta: 'show-all',
      };
    case 'all':
      return null;
  }
}
