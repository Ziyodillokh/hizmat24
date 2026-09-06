import { OrderStatus } from '@prisma/client';
import { InvalidStateTransitionException } from '@client/common/exceptions/domain.exception';

/**
 * Buyurtma holatlar grafi (TZ 9.4).
 *
 * TZ 9.4 jadvaliga nisbatan bitta qo'shimcha o'tish bor: ASSIGNED → SEARCHING.
 * Sababi — TZ 3.4 "avtomatik qayta ishga tushirish" bandi: usta 3 daqiqa ichida
 * javob bermasa, buyurtma 1-bandga (ya'ni qidiruvga) qaytadi. Mos usta topilmasa,
 * u yerdan SEARCHING_QUEUED'ga o'tadi — bu 9.4 jadvalidagi yo'l.
 */
export const ORDER_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> =
  Object.freeze({
    [OrderStatus.DRAFT]: [OrderStatus.SEARCHING, OrderStatus.CANCELLED],
    [OrderStatus.SEARCHING]: [
      OrderStatus.ASSIGNED,
      OrderStatus.SEARCHING_QUEUED,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.SEARCHING_QUEUED]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
    [OrderStatus.ASSIGNED]: [
      OrderStatus.MASTER_EN_ROUTE,
      OrderStatus.SEARCHING,
      OrderStatus.SEARCHING_QUEUED,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.MASTER_EN_ROUTE]: [
      OrderStatus.ARRIVED_PENDING_CONFIRMATION,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.ARRIVED_PENDING_CONFIRMATION]: [
      OrderStatus.IN_PROGRESS,
      OrderStatus.SAFETY_FLAGGED,
    ],
    [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED_BY_MASTER],
    [OrderStatus.COMPLETED_BY_MASTER]: [OrderStatus.RATED],
    [OrderStatus.RATED]: [OrderStatus.CLOSED],
    [OrderStatus.SAFETY_FLAGGED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.CLOSED]: [],
  });

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

/** Ruxsat etilmagan o'tishda `InvalidStateTransitionException` tashlaydi. */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidStateTransitionException(from, to);
  }
}

export function allowedNextStatuses(from: OrderStatus): readonly OrderStatus[] {
  return ORDER_TRANSITIONS[from];
}
