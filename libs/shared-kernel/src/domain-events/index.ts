import type { OrderStatus } from '@prisma/client';

/**
 * Domain event nomlari. Modullar bir-birini to'g'ridan-to'g'ri import qilmaydi —
 * faqat shu event'lar orqali aloqa qiladi (9.3).
 */
export const ORDER_EVENTS = {
  CREATED: 'order.created',
  ASSIGNED: 'order.assigned',
  QUEUED: 'order.queued',
  QUEUE_POSITION_CHANGED: 'order.queue_position_changed',
  STATUS_CHANGED: 'order.status_changed',
  CANCELLED: 'order.cancelled',
  SAFETY_FLAGGED: 'order.safety_flagged',
  RATED: 'order.rated',
  MATCHING_ESCALATED: 'order.matching_escalated',
} as const;

export const MASTER_EVENTS = {
  BECAME_AVAILABLE: 'master.became_available',
} as const;

export class OrderCreatedEvent {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
    readonly categoryId: string,
    readonly isUrgent: boolean,
  ) {}
}

export class OrderAssignedEvent {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
    readonly masterId: string,
    readonly attempt: number,
  ) {}
}

export class OrderQueuedEvent {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
    readonly queuePosition: number,
    readonly estimatedWaitMinutes: number | null,
  ) {}
}

export class OrderQueuePositionChangedEvent {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
    readonly queuePosition: number,
    readonly estimatedWaitMinutes: number | null,
  ) {}
}

export class OrderStatusChangedEvent {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
    readonly fromStatus: OrderStatus,
    readonly toStatus: OrderStatus,
  ) {}
}

export class OrderCancelledEvent {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
    readonly masterId: string | null,
    readonly cancelledBy: 'CLIENT' | 'MASTER' | 'SYSTEM',
    readonly reason: string | null,
  ) {}
}

export class OrderSafetyFlaggedEvent {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
    readonly masterId: string | null,
    readonly safetyAlertId: string,
  ) {}
}

export class OrderRatedEvent {
  constructor(
    readonly orderId: string,
    readonly masterId: string,
    readonly stars: number,
  ) {}
}

export class MatchingEscalatedEvent {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
    readonly attempts: number,
  ) {}
}

export class MasterBecameAvailableEvent {
  constructor(readonly masterId: string) {}
}
