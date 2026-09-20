import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ORDER_EVENTS,
  WS_EVENT_ORDER_UPDATED,
  type OrderQueuedEvent,
  type OrderQueuePositionChangedEvent,
} from '@shared/index';
import { NotificationsGateway } from '@client/modules/notifications/notifications.gateway';
import {
  ORDER_SNAPSHOT_CHANGED,
  type OrderSnapshotChangedEvent,
} from './domain/events/order-snapshot-changed.event';
import { OrdersRepository } from './infrastructure/orders.repository';
import { presentOrder } from './infrastructure/order.presenter';

/**
 * Buyurtma oʻzgarganda mijozga toʻliq suratni yuboradi (TZ 3.5).
 *
 * Nega surat, nega "nima oʻzgardi" emas: ilova WS xabarini boy berishi
 * mumkin (tunnel uzildi, telefon uxladi). Har safar toʻliq holat kelsa,
 * kechikkan yoki takrorlangan xabar hech narsani buzmaydi — oxirgisi rost.
 *
 * Bildirishnomadan FARQ QILADI: bu yerda DB yozuvi ham, push ham yoʻq —
 * faqat ekranni sinxronlash. Shuning uchun `NotificationsService` emas,
 * toʻgʻridan-toʻgʻri gateway ishlatiladi.
 */
@Injectable()
export class OrderRealtimeListener {
  private readonly logger = new Logger(OrderRealtimeListener.name);

  constructor(
    private readonly orders: OrdersRepository,
    private readonly gateway: NotificationsGateway,
  ) {}

  /** Holat oʻzgarishi: tayinlash, bekor qilish, tasdiqlash, baholash. */
  @OnEvent(ORDER_SNAPSHOT_CHANGED, { async: true })
  onSnapshotChanged(event: OrderSnapshotChangedEvent): void {
    this.emit(event.clientId, event.snapshot);
  }

  /**
   * Navbat oʻrni holatni oʻzgartirmasdan ham siljiydi — u alohida yoziladi,
   * shuning uchun surat bazadan qayta oʻqiladi. Bu hodisa tranzaksiyadan
   * TASHQARIDA yuboriladi, demak eski satrni oʻqib qolish xavfi yoʻq.
   */
  @OnEvent(ORDER_EVENTS.QUEUED, { async: true })
  @OnEvent(ORDER_EVENTS.QUEUE_POSITION_CHANGED, { async: true })
  async onQueueChanged(
    event: OrderQueuedEvent | OrderQueuePositionChangedEvent,
  ): Promise<void> {
    const order = await this.orders.findById(event.orderId);
    if (!order) return;

    this.emit(order.clientId, order);
  }

  /**
   * WS uzatish xatosi domen oqimini toʻxtatmaydi: buyurtma allaqachon
   * saqlangan va ilova uni keyingi `GET /orders/:id` da baribir koʻradi.
   */
  private emit(clientId: string, order: Parameters<typeof presentOrder>[0]): void {
    try {
      this.gateway.emitToUser(clientId, WS_EVENT_ORDER_UPDATED, presentOrder(order));
    } catch (error) {
      this.logger.error({ err: error, orderId: order.id }, "Jonli yangilanish yuborilmadi");
    }
  }
}
