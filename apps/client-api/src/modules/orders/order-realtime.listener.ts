import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ORDER_EVENTS,
  WS_EVENT_MASTER_ORDERS_CHANGED,
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

/** Ustaga yuborish uchun `master.userId` kerak — u `ORDER_RELATIONS` da bor. */
type OrderWithMaster = Parameters<typeof presentOrder>[0];

/**
 * Buyurtma oʻzgarganda MIJOZGA ham, USTAGA ham toʻliq suratni yuboradi
 * (TZ 3.5).
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
    this.broadcast(event.clientId, event.snapshot);
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

    this.broadcast(order.clientId, order);
  }

  /**
   * Bitta oʻzgarish — ikki ekran.
   *
   * Usta ham AYNAN shu buyurtmani ekranida koʻrib turadi: mijoz ustani
   * eshik oldida tasdiqlaganda usta «Ishni boshlash» tugmasini oʻzi
   * qayta yuklamasdan koʻrishi kerak. Usta yozuvi ilova hisobiga
   * bogʻlanmagan boʻlishi mumkin (eski, qoʻlda kiritilgan usta) —
   * bunda unga yuborish shunchaki tashlab ketiladi.
   */
  private broadcast(clientId: string, order: OrderWithMaster): void {
    this.emit(clientId, order);

    const masterUserId = order.master?.userId;
    if (!masterUserId) return;

    if (masterUserId !== clientId) this.emit(masterUserId, order);

    /*
     * Ustaga QISQA signal ham ketadi: `order.updated` mijoz koʻrinishi
     * boʻlib, unda ustaning boʻlimi (taklif/faol/tarix) yoʻq. Ilova shu
     * signaldan keyin roʻyxatni qayta oʻqiydi va boʻlimni hisoblash
     * mantigʻi faqat serverda qoladi.
     */
    try {
      this.gateway.emitToUser(masterUserId, WS_EVENT_MASTER_ORDERS_CHANGED, { orderId: order.id });
    } catch (error) {
      this.logger.error({ err: error, orderId: order.id }, 'Usta signali yuborilmadi');
    }
  }

  /**
   * WS uzatish xatosi domen oqimini toʻxtatmaydi: buyurtma allaqachon
   * saqlangan va ilova uni keyingi `GET /orders/:id` da baribir koʻradi.
   */
  private emit(userId: string, order: OrderWithMaster): void {
    try {
      this.gateway.emitToUser(userId, WS_EVENT_ORDER_UPDATED, presentOrder(order));
    } catch (error) {
      this.logger.error({ err: error, orderId: order.id }, "Jonli yangilanish yuborilmadi");
    }
  }
}
