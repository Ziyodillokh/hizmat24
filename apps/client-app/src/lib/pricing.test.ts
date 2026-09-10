import { describe, expect, it } from 'vitest';
import { buildInvoice, MONEY_STEP, URGENT_FEE } from './pricing';

describe('buildInvoice', () => {
  it('oddiy buyurtmada shoshilinch qoʻshimchasi yoʻq', () => {
    const invoice = buildInvoice({ base: 150_000, isUrgent: false, discountPercent: 0 });

    expect(invoice).toEqual({
      base: 150_000,
      urgentFee: 0,
      discountPercent: 0,
      discount: 0,
      total: 150_000,
    });
  });

  it('shoshilinch qoʻshimchasi qatʼiy summa — foiz emas', () => {
    const arzon = buildInvoice({ base: 80_000, isUrgent: true, discountPercent: 0 });
    const qimmat = buildInvoice({ base: 1_500_000, isUrgent: true, discountPercent: 0 });

    expect(arzon.urgentFee).toBe(URGENT_FEE);
    expect(qimmat.urgentFee).toBe(URGENT_FEE);
  });

  it('chegirma faqat asosiy narxdan olinadi, shoshilinch qoʻshimchasidan emas', () => {
    const invoice = buildInvoice({ base: 100_000, isUrgent: true, discountPercent: 4 });

    // 4% x 100 000 = 4 000. Qoʻshimchaga chegirma tegmaydi.
    expect(invoice.discount).toBe(4_000);
    expect(invoice.total).toBe(100_000 + URGENT_FEE - 4_000);
  });

  it('chegirma eng yaqin 100 soʻmga yaxlitlanadi', () => {
    // 2% x 155 555 = 3 111,1 → 3 100.
    expect(buildInvoice({ base: 155_555, isUrgent: false, discountPercent: 2 }).discount).toBe(3_100);
  });

  it('chegirma asosiy narxdan oshmaydi', () => {
    const invoice = buildInvoice({ base: 50_000, isUrgent: false, discountPercent: 500 });

    expect(invoice.discount).toBe(50_000);
    expect(invoice.total).toBe(0);
  });

  it('manfiy narx nolga tushadi', () => {
    expect(buildInvoice({ base: -1_000, isUrgent: false, discountPercent: 6 }).total).toBe(0);
  });

  it('yakuniy summa har doim tarkibiy qismlar yigʻindisiga teng', () => {
    for (const base of [80_000, 100_000, 350_000, 1_500_000]) {
      for (const percent of [0, 2, 4, 6]) {
        for (const isUrgent of [false, true]) {
          const invoice = buildInvoice({ base, isUrgent, discountPercent: percent });
          expect(invoice.total).toBe(invoice.base + invoice.urgentFee - invoice.discount);
          expect(invoice.discount % MONEY_STEP).toBe(0);
        }
      }
    }
  });
});
