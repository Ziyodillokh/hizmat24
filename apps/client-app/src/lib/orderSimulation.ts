/**
 * Server oʻtishlarining taqlidi — sof funksiyalar. React YOʻQ, DOM YOʻQ.
 *
 * Backend ulanmagan, shuning uchun mijoz tomonidagi «usta topildi → yoʻlga
 * chiqdi → yetib keldi» oʻtishlari taymer bilan taqlid qilinadi. Usta rejimi
 * paydo boʻlgach bu taqlid TOPSHIRIQNI TOPSHIRADI: bitta buyurtmani ikki
 * aktyor surmaydi (TZ 0.2).
 *
 * `simulationStep` — yagona qorovul. U IKKI joyda tekshiriladi: taymerni
 * rejalashtiruvchi effektda va `applyServerStep` ichidagi `setState` da.
 * Ikkinchisi majburiy, chunki kutayotgan eski `setTimeout` usta buyurtmani
 * qabul qilgandan KEYIN ham oʻq uzishi mumkin.
 */
import type { LiveOrder } from '@/app/types';
import { ORDER_STATUS, type OrderStatus } from './orderStateMachine';

export interface SimulationStep {
  next: OrderStatus;
  /** Demo tezligidagi kutish vaqti (ms). */
  delayMs: number;
}

/** Har bir avtomatik oʻtish uchun kutish vaqti — demo tezligida. */
export const SERVER_STEPS: Partial<Record<OrderStatus, SimulationStep>> = {
  [ORDER_STATUS.SEARCHING]: { next: ORDER_STATUS.ASSIGNED, delayMs: 3500 },
  [ORDER_STATUS.SEARCHING_QUEUED]: { next: ORDER_STATUS.ASSIGNED, delayMs: 6000 },
  [ORDER_STATUS.ASSIGNED]: { next: ORDER_STATUS.MASTER_EN_ROUTE, delayMs: 5000 },
  [ORDER_STATUS.MASTER_EN_ROUTE]: {
    next: ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION,
    delayMs: 6000,
  },
  [ORDER_STATUS.IN_PROGRESS]: { next: ORDER_STATUS.COMPLETED_BY_MASTER, delayMs: 7000 },
};

export type SimulationOrder = Pick<
  LiveOrder,
  'id' | 'status' | 'scheduledAt' | 'handledByMaster'
>;

const isSearching = (status: OrderStatus): boolean =>
  status === ORDER_STATUS.SEARCHING || status === ORDER_STATUS.SEARCHING_QUEUED;

/**
 * Buyurtmaning keyingi avtomatik oʻtishi; `null` — taymer TEGMAYDI.
 *
 * Ikki sabab bilan `null` qaytadi:
 *  1. buyurtmani usta qabul qilgan (`handledByMaster`) — har qanday holatda;
 *  2. smena ochiq va profil toʻliq (`masterTakeover`), buyurtma esa hali
 *     qidiruvda — u ustaning kabinetida taklif boʻlib turibdi va 3,5
 *     soniyadan keyin mock ustaga berib yuborilmaydi.
 *
 * Terminal holatlar `SERVER_STEPS` da yoʻq, shuning uchun ular ham `null`.
 */
export function simulationStep(
  order: Pick<SimulationOrder, 'status' | 'handledByMaster'>,
  masterTakeover: boolean,
): SimulationStep | null {
  if (order.handledByMaster) return null;
  if (masterTakeover && isSearching(order.status)) return null;
  return SERVER_STEPS[order.status] ?? null;
}

/**
 * Keyingi avtomatik oʻtishgacha kutish vaqti.
 *
 * Rejalashtirilgan buyurtmada usta qidiruvi belgilangan vaqtda boshlanadi.
 * Busiz kelasi haftaga yozilgan buyurtmada ham 3,5 soniyadan keyin «Usta
 * topildi» chiqardi — bu ekranda koʻrinadigan yolgʻon. Faqat BIRINCHI qadam
 * suriladi, keyingilari odatdagi tezlikda ketadi.
 *
 * 7 kun = 604 800 000 ms; `setTimeout` chegarasi 2 147 483 647 ms.
 */
export function waitMsFor(
  order: Pick<SimulationOrder, 'status' | 'scheduledAt'>,
  delayMs: number,
  now: Date,
): number {
  if (!isSearching(order.status) || !order.scheduledAt) return delayMs;
  return Math.max(0, order.scheduledAt.getTime() - now.getTime()) + delayMs;
}

/**
 * Taymer kaliti — buyurtma VA holat.
 *
 * Holat kalitning bir qismi: aks holda bitta buyurtma uchun bir marta
 * rejalashtirilgan taymer keyingi qadamlarda qayta yozilmasdan qolib ketardi.
 */
export const simulationTimerKey = (order: Pick<SimulationOrder, 'id' | 'status'>): string =>
  `${order.id}:${order.status}`;

/**
 * Mijoz ekranidagi uzuq chegarali «Demo ·» tugmasining yorligʻi.
 *
 * `null` — tugma UMUMAN chizilmaydi: buyurtmani usta yuritayotgan boʻlsa,
 * mijozdagi demo tugmasi uning ishini oʻgʻirlab, holatni orqasidan surib
 * yuborardi.
 */
export function demoActionLabel(
  order: Pick<SimulationOrder, 'status' | 'handledByMaster'>,
  masterTakeover: boolean,
): string | null {
  if (!simulationStep(order, masterTakeover)) return null;

  switch (order.status) {
    case ORDER_STATUS.SEARCHING:
      return 'ustani darhol topish';
    case ORDER_STATUS.SEARCHING_QUEUED:
      return 'navbatdan chiqarish';
    case ORDER_STATUS.IN_PROGRESS:
      return 'ishni yakunlash';
    default:
      return 'keyingi bosqich';
  }
}

/** Mijoz ekranidagi «bu vaqt qayerdan keldi» qatori. */
export function etaSourceLine(
  order: Pick<LiveOrder, 'etaMinutes' | 'handledByMaster'>,
): string {
  if (order.etaMinutes === null) return 'Usta hali vaqt koʻrsatmadi.';
  if (order.handledByMaster) return 'Vaqtni usta oʻzi koʻrsatdi.';
  return 'Yetib kelish vaqti — demo maʼlumot. Haqiqiy hisob usta ilovasi ulangach koʻrsatiladi.';
}

/** Mijoz ekranidagi qator: taklif ustaning kabinetida turibdi. */
export const TAKEOVER_SEARCHING_LINE =
  'Shu qurilmada usta rejimi yoqilgan — taklif sizning usta kabinetingizda turibdi.';

/** Mijoz ekranidagi qator: buyurtmani shu qurilmadagi usta yuritmoqda. */
export const HANDLED_BY_MASTER_LINE =
  'Bu buyurtmani shu qurilmadagi usta rejimi boshqarmoqda.';
