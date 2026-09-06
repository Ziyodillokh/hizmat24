import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationType, OrderStatus } from '@prisma/client';
import {
  ORDER_EVENTS,
  type MatchingEscalatedEvent,
  type OrderAssignedEvent,
  type OrderCancelledEvent,
  type OrderQueuedEvent,
  type OrderSafetyFlaggedEvent,
  type OrderStatusChangedEvent,
} from '@shared/index';
import { NotificationsService } from './notifications.service';

/**
 * Domain event → bildirishnoma (TZ 3.5, 4).
 * Modullar orasida to'g'ridan-to'g'ri bog'liqlik yo'q: notifications moduli
 * orders/matching modullarini import qilmaydi, faqat event'larga obuna bo'ladi.
 */
@Injectable()
export class NotificationsListener {
  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent(ORDER_EVENTS.ASSIGNED, { async: true })
  async onAssigned(event: OrderAssignedEvent): Promise<void> {
    await this.notifications.dispatch({
      userId: event.clientId,
      orderId: event.orderId,
      type: NotificationType.MASTER_ASSIGNED,
      title: 'Usta topildi',
      body: 'Buyurtmangizga usta tayinlandi',
      payload: { masterId: event.masterId },
    });
  }

  @OnEvent(ORDER_EVENTS.QUEUED, { async: true })
  async onQueued(event: OrderQueuedEvent): Promise<void> {
    await this.notifications.dispatch({
      userId: event.clientId,
      orderId: event.orderId,
      type: NotificationType.QUEUE_POSITION_UPDATE,
      title: 'Siz navbatdasiz',
      body:
        event.estimatedWaitMinutes === null
          ? `Navbatdagi o'rningiz: ${event.queuePosition}`
          : `Navbatdagi o'rningiz: ${event.queuePosition}. Taxminiy kutish: ${event.estimatedWaitMinutes} daqiqa`,
      payload: {
        queuePosition: event.queuePosition,
        estimatedWaitMinutes: event.estimatedWaitMinutes,
      },
    });
  }

  /**
   * Usta ilovasi tomonidan boshqariladigan holatlar (yo'lga chiqdi / yetib keldi /
   * ish yakunlandi) shu yerda mijozga uzatiladi.
   */
  @OnEvent(ORDER_EVENTS.STATUS_CHANGED, { async: true })
  async onStatusChanged(event: OrderStatusChangedEvent): Promise<void> {
    const mapping: Partial<
      Record<OrderStatus, { type: NotificationType; title: string; body: string }>
    > = {
      [OrderStatus.MASTER_EN_ROUTE]: {
        type: NotificationType.MASTER_EN_ROUTE,
        title: "Usta yo'lga chiqdi",
        body: "Usta sizga qarab yo'lga chiqdi",
      },
      [OrderStatus.ARRIVED_PENDING_CONFIRMATION]: {
        type: NotificationType.MASTER_ARRIVED,
        title: 'Usta yetib keldi',
        body: "Iltimos, kelgan ustani ilovadagi ma'lumot bilan solishtiring va tasdiqlang",
      },
      [OrderStatus.IN_PROGRESS]: {
        type: NotificationType.ORDER_IN_PROGRESS,
        title: 'Ish boshlandi',
        body: 'Usta ishni boshladi',
      },
      [OrderStatus.COMPLETED_BY_MASTER]: {
        type: NotificationType.ORDER_COMPLETED_BY_MASTER,
        title: 'Ish yakunlandi',
        body: 'Iltimos, ustaning ishini baholang',
      },
    };

    const template = mapping[event.toStatus];
    if (!template) return;

    await this.notifications.dispatch({
      userId: event.clientId,
      orderId: event.orderId,
      type: template.type,
      title: template.title,
      body: template.body,
      payload: { status: event.toStatus },
    });
  }

  @OnEvent(ORDER_EVENTS.CANCELLED, { async: true })
  async onCancelled(event: OrderCancelledEvent): Promise<void> {
    await this.notifications.dispatch({
      userId: event.clientId,
      orderId: event.orderId,
      type: NotificationType.ORDER_CANCELLED,
      title: 'Buyurtma bekor qilindi',
      body: event.reason ?? 'Buyurtma bekor qilindi',
      payload: { cancelledBy: event.cancelledBy },
    });
  }

  /** Kritik: kechiktirib bo'lmaydi (TZ 4-jadval). */
  @OnEvent(ORDER_EVENTS.SAFETY_FLAGGED, { async: true })
  async onSafetyFlagged(event: OrderSafetyFlaggedEvent): Promise<void> {
    await this.notifications.publishSafetyAlert({
      safetyAlertId: event.safetyAlertId,
      orderId: event.orderId,
      clientId: event.clientId,
      masterId: event.masterId,
    });

    await this.notifications.dispatch({
      userId: event.clientId,
      orderId: event.orderId,
      type: NotificationType.SAFETY_ALERT_RECEIVED,
      title: 'Signalingiz qabul qilindi',
      body: "Operatorimiz hoziroq siz bilan bog'lanadi",
      payload: { safetyAlertId: event.safetyAlertId },
    });
  }

  @OnEvent(ORDER_EVENTS.MATCHING_ESCALATED, { async: true })
  async onEscalated(event: MatchingEscalatedEvent): Promise<void> {
    await this.notifications.dispatch({
      userId: event.clientId,
      orderId: event.orderId,
      type: NotificationType.MATCHING_ESCALATED,
      title: 'Usta qidirilmoqda',
      body: "Hozircha bo'sh usta yo'q — operatorimiz buyurtmangizni qo'lda ko'rib chiqadi",
      payload: { attempts: event.attempts },
    });
  }
}
