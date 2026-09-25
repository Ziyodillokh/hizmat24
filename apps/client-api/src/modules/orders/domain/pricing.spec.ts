import { MONEY_STEP_UZS, URGENT_FEE_UZS } from '@shared/index';
import { buildInvoice, MAX_QUANTITY } from './pricing';

describe('buildInvoice (TZ 4.1 — narxni faqat server hisoblaydi)', () => {
  it('oddiy buyurtmada qoʻshimcha ham, chegirma ham yoʻq', () => {
    // Arrange & Act
    const invoice = buildInvoice({ base: 100_000, isUrgent: false, discountPercent: 0 });

    // Assert
    expect(invoice).toEqual({
      unitPrice: 100_000,
      quantity: 1,
      base: 100_000,
      urgentFee: 0,
      discountPercent: 0,
      discount: 0,
      total: 100_000,
    });
  });

  it('shoshilinchlik qoʻshimchasi QATʼIY 20 000 soʻm — foiz emas', () => {
    const cheap = buildInvoice({ base: 50_000, isUrgent: true, discountPercent: 0 });
    const expensive = buildInvoice({ base: 1_500_000, isUrgent: true, discountPercent: 0 });

    expect(cheap.urgentFee).toBe(URGENT_FEE_UZS);
    expect(expensive.urgentFee).toBe(URGENT_FEE_UZS);
    expect(expensive.total).toBe(1_520_000);
  });

  it('chegirma FAQAT asosiy narxdan olinadi, shoshilinchlik qoʻshimchasiga tegmaydi', () => {
    // Arrange: 6% · 100 000 = 6 000. Agar qoʻshimchadan ham olinsa 7 200 boʻlardi.
    const invoice = buildInvoice({ base: 100_000, isUrgent: true, discountPercent: 6 });

    expect(invoice.discount).toBe(6_000);
    expect(invoice.total).toBe(100_000 + URGENT_FEE_UZS - 6_000);
  });

  it('chegirma 100 soʻmlik qadamga yaxlitlanadi', () => {
    // Arrange: 2% · 83 333 = 1 666,66 → 1 700
    const invoice = buildInvoice({ base: 83_333, isUrgent: false, discountPercent: 2 });

    expect(invoice.discount % MONEY_STEP_UZS).toBe(0);
    expect(invoice.discount).toBe(1_700);
  });

  it('chegirma hech qachon asosiy narxdan oshmaydi', () => {
    const invoice = buildInvoice({ base: 10_000, isUrgent: false, discountPercent: 250 });

    expect(invoice.discountPercent).toBe(100);
    expect(invoice.discount).toBe(10_000);
    expect(invoice.total).toBe(0);
  });

  it('manfiy narx va manfiy foiz nolga keltiriladi', () => {
    const invoice = buildInvoice({ base: -5_000, isUrgent: false, discountPercent: -10 });

    expect(invoice.base).toBe(0);
    expect(invoice.discountPercent).toBe(0);
    expect(invoice.total).toBe(0);
  });

  it('yakuniy summa har doim base + urgentFee − discount', () => {
    const invoice = buildInvoice({ base: 250_000, isUrgent: true, discountPercent: 4 });

    expect(invoice.total).toBe(invoice.base + invoice.urgentFee - invoice.discount);
  });
});

describe('buildInvoice — miqdor', () => {
  it('asosiy narx miqdorga koʻpaytiriladi', () => {
    // Arrange / Act
    const invoice = buildInvoice({ base: 120_000, quantity: 2, isUrgent: false, discountPercent: 0 });

    // Assert
    expect(invoice.unitPrice).toBe(120_000);
    expect(invoice.quantity).toBe(2);
    expect(invoice.base).toBe(240_000);
    expect(invoice.total).toBe(240_000);
  });

  /*
   * Shoshilinch qoʻshimchasi ustani yuborish xarajati — usta ikkita ish
   * uchun ham bir marta chiqadi, shuning uchun u koʻpaytirilmaydi.
   */
  it('shoshilinch qoʻshimchasi miqdorga koʻpaytirilmaydi', () => {
    const invoice = buildInvoice({ base: 100_000, quantity: 3, isUrgent: true, discountPercent: 0 });

    expect(invoice.base).toBe(300_000);
    expect(invoice.urgentFee).toBe(20_000);
    expect(invoice.total).toBe(320_000);
  });

  it('chegirma koʻpaytirilgan summadan olinadi', () => {
    const invoice = buildInvoice({ base: 100_000, quantity: 2, isUrgent: false, discountPercent: 10 });

    expect(invoice.discount).toBe(20_000);
    expect(invoice.total).toBe(180_000);
  });

  it('miqdor berilmasa bitta deb hisoblanadi', () => {
    expect(buildInvoice({ base: 50_000, isUrgent: false, discountPercent: 0 }).quantity).toBe(1);
  });

  /* Ilova buzilgan qiymat yuborsa ham chek toʻgʻri qolishi kerak. */
  it('chegaradan tashqaridagi miqdor qisiladi', () => {
    expect(buildInvoice({ base: 10_000, quantity: 0, isUrgent: false, discountPercent: 0 }).quantity).toBe(1);
    expect(buildInvoice({ base: 10_000, quantity: -5, isUrgent: false, discountPercent: 0 }).quantity).toBe(1);
    expect(buildInvoice({ base: 10_000, quantity: 999, isUrgent: false, discountPercent: 0 }).quantity).toBe(MAX_QUANTITY);
  });
});
