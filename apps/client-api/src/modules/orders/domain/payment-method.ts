import { PaymentMethod } from '@prisma/client';
import type { ApiPaymentMethod } from '@shared/index';

/**
 * DB enumi (UPPER — sxemadagi barcha enumlar shunday) va ilova kutadigan
 * kichik harfli qiymat orasidagi yagona oʻgirish joyi.
 *
 * Oʻgirish bitta faylda turadi: ekranda `cash`, bazada `CASH` boʻlgani uchun
 * har bir presenter oʻzicha `toLowerCase()` yozsa, ertami-kechmi biri
 * unutilardi.
 */

const TO_API: Record<PaymentMethod, ApiPaymentMethod> = {
  [PaymentMethod.CASH]: 'cash',
  [PaymentMethod.CARD]: 'card',
  [PaymentMethod.ESCROW]: 'escrow',
};

const TO_DB: Record<ApiPaymentMethod, PaymentMethod> = {
  cash: PaymentMethod.CASH,
  card: PaymentMethod.CARD,
  escrow: PaymentMethod.ESCROW,
};

/** Eski buyurtmada toʻlov usuli yoʻq — taxmin yozilmaydi, `null` qaytadi. */
export function toApiPaymentMethod(value: PaymentMethod | null): ApiPaymentMethod | null {
  return value === null ? null : TO_API[value];
}

export function toDbPaymentMethod(value: ApiPaymentMethod): PaymentMethod {
  return TO_DB[value];
}
