/**
 * Mijoz darajasi va uning chegirmasi.
 *
 * Daraja YAKUNLANGAN buyurtma soniga bogʻliq, sarflangan pulga emas: aks
 * holda bitta qimmat ish bilan eng yuqori daraja olinardi.
 *
 * Chegaralar ilovadagi `src/lib/wallet.ts` dagi `LEVELS` bilan bir xil.
 */

export type LevelKey = 'bronze' | 'silver' | 'gold';

export interface ClientLevel {
  key: LevelKey;
  /** Shu darajaga kirish uchun kerak boʻlgan eng kam yakunlangan buyurtma soni. */
  minClosedOrders: number;
  /** Platforma komissiyasidan beriladigan chegirma. */
  discountPercent: number;
}

/**
 * Birinchi darajaning chegarasi 0: buyurtmasi yoʻq foydalanuvchi ham
 * darajasiz qolmaydi.
 */
export const CLIENT_LEVELS: readonly ClientLevel[] = [
  { key: 'bronze', minClosedOrders: 0, discountPercent: 2 },
  { key: 'silver', minClosedOrders: 10, discountPercent: 4 },
  { key: 'gold', minClosedOrders: 30, discountPercent: 6 },
];

/**
 * Yakunlangan buyurtmalar soniga mos daraja.
 *
 * `reduce` boshlangʻich qiymatsiz ishlaydi — roʻyxatdagi birinchi daraja
 * (bronza) doim javob boʻlib turadi, shuning uchun "hech biri mos kelmadi"
 * degan yetib borilmaydigan tarmoq yozilmaydi.
 */
export function levelForClosedOrders(closedOrdersCount: number): ClientLevel {
  const safeCount = Math.max(0, Math.floor(closedOrdersCount));

  return CLIENT_LEVELS.reduce((best, level) =>
    safeCount >= level.minClosedOrders ? level : best,
  );
}

export function levelDiscountPercent(closedOrdersCount: number): number {
  return levelForClosedOrders(closedOrdersCount).discountPercent;
}
