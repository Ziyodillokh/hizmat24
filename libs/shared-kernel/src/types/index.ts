export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Mijoz manzili.
 *
 * `lat`/`lng` IXTIYORIY: ilovada hali xarita yoʻq va soxta koordinata
 * yozilmaydi (TZ 2-bo'lim). Koordinata K1 bosqichida xaritadan tanlanadi.
 */
export interface ClientAddress extends Partial<GeoPoint> {
  label: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
  comment?: string;
}

/**
 * Toʻlov usulining API shakli — ilovadagi `PaymentMethod` bilan aynan bir xil.
 * DB enumʼi (CASH/CARD/ESCROW) bilan oʻgirish `orders/domain/payment-method.ts` da.
 */
export type ApiPaymentMethod = 'cash' | 'card' | 'escrow';

export const API_PAYMENT_METHODS: readonly ApiPaymentMethod[] = ['cash', 'card', 'escrow'];

export interface AuthenticatedUser {
  id: string;
  phoneNumber: string;
}
