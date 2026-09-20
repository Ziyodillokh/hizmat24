import { OrderStatus } from '@prisma/client';

export { OrderStatus };

/** Yakuniy (terminal) holatlar — bu yerdan hech qayerga oʻtilmaydi. */
export const TERMINAL_STATUSES: readonly OrderStatus[] = [
  OrderStatus.CLOSED,
  OrderStatus.CANCELLED,
  OrderStatus.SAFETY_FLAGGED,
];

/**
 * Mijoz tomonidan oddiy bekor qilish mumkin bo'lgan holatlar (3.6, biznes-qoida 5.5).
 * IN_PROGRESS'dan keyin — faqat support orqali.
 */
export const CLIENT_CANCELLABLE_STATUSES: readonly OrderStatus[] = [
  OrderStatus.SEARCHING,
  OrderStatus.SEARCHING_QUEUED,
  OrderStatus.ASSIGNED,
  OrderStatus.MASTER_EN_ROUTE,
];

/** Usta telefon raqami mijozga koʻrinadigan holatlar (xavfsizlik talabi 6.2). */
export const MASTER_PHONE_VISIBLE_STATUSES: readonly OrderStatus[] = [
  OrderStatus.ASSIGNED,
  OrderStatus.MASTER_EN_ROUTE,
  OrderStatus.ARRIVED_PENDING_CONFIRMATION,
  OrderStatus.IN_PROGRESS,
];

/** Ustani qayta qidirish mumkin bo'lgan holatlar. */
export const MATCHABLE_STATUSES: readonly OrderStatus[] = [
  OrderStatus.SEARCHING,
  OrderStatus.SEARCHING_QUEUED,
];

/**
 * Mijoz darajasi uchun sanaladigan holatlar.
 *
 * `RATED` ham kiradi: u yakunlangan, lekin hali yopilmagan buyurtma emas —
 * baholashdan keyin buyurtma darhol `CLOSED` ga oʻtadi va ilova ikkalasini
 * ham "yakunlangan" deb koʻrsatadi. Faqat `CLOSED` sanalsa, baholash bilan
 * yopilish orasidagi buyurtma darajadan tushib qolardi.
 */
export const LEVEL_COUNTED_STATUSES: readonly OrderStatus[] = [
  OrderStatus.RATED,
  OrderStatus.CLOSED,
];
