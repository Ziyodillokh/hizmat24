import { PaymentMethod } from '@prisma/client';
import { API_PAYMENT_METHODS } from '@shared/index';
import { toApiPaymentMethod, toDbPaymentMethod } from './payment-method';

describe('Toʻlov usuli oʻgirishi', () => {
  it('har bir API qiymati DB enumiga va orqaga oʻzgarishsiz qaytadi', () => {
    for (const method of API_PAYMENT_METHODS) {
      expect(toApiPaymentMethod(toDbPaymentMethod(method))).toBe(method);
    }
  });

  it('DB enumining barcha qiymatlari qoplangan', () => {
    for (const value of Object.values(PaymentMethod)) {
      expect(API_PAYMENT_METHODS).toContain(toApiPaymentMethod(value));
    }
  });

  it("toʻlov usuli yoʻq eski buyurtmada taxmin yozilmaydi", () => {
    expect(toApiPaymentMethod(null)).toBeNull();
  });
});
