import { authed } from './authed';
import { toLiveOrder, type CreateOrderPayload, type ServerOrder } from './orderDto';
import type { LiveOrder, RatingInput } from '@/app/types';

/**
 * Buyurtma amallari — serverga.
 *
 * Har bir amal javobida TOʻLIQ buyurtma qaytadi va ilova holati oʻsha
 * javobdan yangilanadi: mahalliy taxmin yasab, keyin serverdan boshqa
 * natija kelishi ekranda sakrash boʻlib koʻrinardi.
 */

interface HistoryPage {
  items: ServerOrder[];
}

/**
 * Buyurtmalar roʻyxati.
 *
 * Server sahifalab beradi; ilovaga hozircha birinchi sahifa yetarli —
 * roʻyxat ekrani faol va yopilgan ishlarni bitta joyda koʻrsatadi.
 * Sahifalash kerak boʻlganda shu yerga qoʻshiladi.
 */
export async function fetchOrders(limit = 50): Promise<LiveOrder[]> {
  const page = await authed<HistoryPage>(`/api/v1/orders/history?limit=${limit}`);
  return (page.items ?? []).map(toLiveOrder);
}

export const fetchOrder = async (orderId: string): Promise<LiveOrder> =>
  toLiveOrder(await authed<ServerOrder>(`/api/v1/orders/${orderId}`));

export const createOrder = async (payload: CreateOrderPayload): Promise<LiveOrder> =>
  toLiveOrder(
    await authed<ServerOrder>('/api/v1/orders', {
      method: 'POST',
      body: payload,
      // Ikki marta bosilgan tugma ikkita buyurtma yaratmaydi: server shu
      // kalit boʻyicha birinchi natijani qaytaradi.
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    }),
  );

export const cancelOrder = async (orderId: string, reason: string): Promise<LiveOrder> =>
  toLiveOrder(
    await authed<ServerOrder>(`/api/v1/orders/${orderId}/cancel`, {
      method: 'POST',
      body: { reason },
    }),
  );

export const confirmMaster = async (orderId: string, confirmed: boolean, note?: string): Promise<LiveOrder> =>
  toLiveOrder(
    await authed<ServerOrder>(`/api/v1/orders/${orderId}/confirm-master`, {
      method: 'POST',
      body: { confirmed, ...(note ? { note } : {}) },
    }),
  );

/**
 * Baho — YAGONA amal, qaytishi esa buyurtma emas.
 *
 * Server bu endpointda bahoning oʻzini qaytaradi, buyurtma esa `RATED`
 * boʻlib oʻzgaradi. Shuning uchun bahodan keyin buyurtma qayta oʻqiladi:
 * ekran holatni taxmin qilmaydi, serverdagi haqiqatni koʻrsatadi.
 */
export async function rateOrder(orderId: string, rating: RatingInput): Promise<LiveOrder> {
  await authed<unknown>(`/api/v1/orders/${orderId}/rating`, {
    method: 'POST',
    body: {
      stars: rating.stars,
      ...(rating.comment.trim() ? { comment: rating.comment.trim() } : {}),
      tags: [...rating.tags],
    },
  });

  return fetchOrder(orderId);
}
