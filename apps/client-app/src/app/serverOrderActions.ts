import * as ordersApi from '@/api/orders';
import { toCreatePayload } from '@/api/orderDto';
import type { LiveOrder, OrderDraft, RatingInput } from './types';

/**
 * Server rejimidagi buyurtma amallari.
 *
 * `store.tsx` dan ajratildi: fayl 500 qator chegarasiga tiralgan va bu
 * amallarning oʻz savoli bor — «serverga nima yuboriladi va javob holatga
 * qanday tushadi».
 *
 * Qoida bitta: holat SERVER javobidan yangilanadi. Mahalliy taxmin yasab,
 * keyin boshqa natija kelishi ekranda sakrash boʻlib koʻrinardi. Xato
 * boʻlsa — holat oʻzgarmaydi va chaqiruvchi xatoni koʻrsatadi.
 */
export interface ServerOrderActionsInput {
  /** Bitta buyurtmani roʻyxatga qoʻshadi yoki almashtiradi. */
  upsertOrder: (order: LiveOrder) => void;
  /** Qoralamani tozalaydi — buyurtma yaratilgach. */
  resetDraft: () => void;
  /** Joriy qoralama — `createOrder` uni soʻrovga aylantiradi. */
  readDraft: () => OrderDraft;
}

export interface ServerOrderActions {
  createOrder: () => Promise<string | null>;
  cancelOrder: (orderId: string, reason: string) => Promise<void>;
  confirmMaster: (orderId: string) => Promise<void>;
  rejectMaster: (orderId: string, note: string) => Promise<void>;
  rateOrder: (orderId: string, rating: RatingInput) => Promise<void>;
}

export function buildServerOrderActions(input: ServerOrderActionsInput): ServerOrderActions {
  const run = async (action: Promise<LiveOrder>): Promise<void> => {
    input.upsertOrder(await action);
  };

  return {
    createOrder: async () => {
      const payload = toCreatePayload(input.readDraft());
      // Toʻliq boʻlmagan qoralama serverga umuman yuborilmaydi: ekranlardagi
      // qorovullar buni ushlaydi, bu esa oxirgi chegara.
      if (!payload) return null;

      const order = await ordersApi.createOrder(payload);
      input.upsertOrder(order);
      input.resetDraft();
      return order.id;
    },

    cancelOrder: (orderId, reason) => run(ordersApi.cancelOrder(orderId, reason)),

    confirmMaster: (orderId) => run(ordersApi.confirmMaster(orderId, true)),

    // Tasdiqlamaslik — xavfsizlik signali: server buyurtmani SAFETY_FLAGGED
    // qiladi va signalni oʻz navbatiga yozadi.
    rejectMaster: (orderId, note) => run(ordersApi.confirmMaster(orderId, false, note || undefined)),

    rateOrder: (orderId, rating) => run(ordersApi.rateOrder(orderId, rating)),
  };
}
