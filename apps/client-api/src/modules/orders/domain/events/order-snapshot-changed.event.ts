import type { OrderWithRelations } from '../../infrastructure/order.presenter';

/** Hodisa nomi — modul ichidagi hodisa, shu sababli `@shared` da emas. */
export const ORDER_SNAPSHOT_CHANGED = 'order.snapshot_changed';

/**
 * Buyurtmaning toʻliq surati oʻzgardi.
 *
 * `OrderStatusChangedEvent` dan farqi: bu hodisa YOZILGAN satrning oʻzini
 * olib yuradi. Shuning uchun tinglovchi bazaga qayta murojaat qilmaydi va
 * tranzaksiya ichida yuborilgan hodisada eski (hali commit boʻlmagan)
 * holatni oʻqib qolish xavfi yoʻq.
 */
export class OrderSnapshotChangedEvent {
  constructor(
    readonly orderId: string,
    readonly clientId: string,
    readonly snapshot: OrderWithRelations,
  ) {}
}
