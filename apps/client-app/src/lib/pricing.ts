/**
 * Buyurtma hisob-fakturasi.
 *
 * REACT YOʻQ va `new Date()` CHAQIRILMAYDI. `wallet.ts` ni ham import
 * qilmaydi — chegirma foizi PARAMETR sifatida keladi, shu tufayli aylanma
 * import boʻlmaydi va modul sof qoladi.
 */

/**
 * Shoshilinch buyurtma qoʻshimchasi — QATʼIY summa, foiz emas.
 *
 * Shoshilinchlik ustani navbatdan tashqari yuborish xarajati va u ish
 * qiymatiga bogʻliq emas. Foiz qilinsa, 1 500 000 soʻmlik ish uchun
 * qoʻshimcha 300 000 soʻm boʻlib chiqardi — bu talon-toroj boʻlib oʻqiladi.
 *
 * Bu summa toʻlov ekranida BIRINCHI MARTA koʻrinmaydi: u shoshilinchlik
 * tugmasi yonida, tanlash paytidayoq aytiladi. Aks holda yashirin toʻlov
 * boʻlardi.
 */
export const URGENT_FEE = 20_000;

/** Soʻmda eng kichik amaliy birlik — chegirma shu qadamga yaxlitlanadi. */
export const MONEY_STEP = 100;

export interface OrderInvoice {
  /** Katalogdagi asosiy narx — mijoz butun oqim davomida shuni koʻrgan. */
  base: number;
  /** Shoshilinch qoʻshimchasi; oddiy buyurtmada 0. */
  urgentFee: number;
  /** Daraja chegirmasi foizi (2 · 4 · 6). */
  discountPercent: number;
  /** Chegirma summasi — faqat `base` dan olinadi. */
  discount: number;
  /** Toʻlanadigan yakuniy summa. */
  total: number;
}

export interface InvoiceInput {
  base: number;
  isUrgent: boolean;
  /** Foydalanuvchi darajasining chegirmasi; daraja yoʻq boʻlsa 0. */
  discountPercent: number;
}

/**
 * Hisob-fakturani yigʻadi.
 *
 * Chegirma FAQAT `base` dan olinadi, `base + urgentFee` dan emas: chegirma
 * platformaning xizmat marjasidan qoplanadi, shoshilinch qoʻshimchasi esa
 * platforma haqiqatan sarflaydigan yuborish xarajati. Undan chegirma berish
 * formulani tushuntirib boʻlmaydigan qilardi.
 */
export function buildInvoice({ base, isUrgent, discountPercent }: InvoiceInput): OrderInvoice {
  const safeBase = Math.max(0, Math.round(base));
  const urgentFee = isUrgent ? URGENT_FEE : 0;
  const safePercent = Math.max(0, Math.min(100, discountPercent));

  // Chegirma asosiy narxdan oshib ketmaydi — foiz 100 dan katta berilsa ham.
  const raw = (safeBase * safePercent) / 100;
  const discount = Math.min(safeBase, Math.round(raw / MONEY_STEP) * MONEY_STEP);

  return {
    base: safeBase,
    urgentFee,
    discountPercent: safePercent,
    discount,
    total: safeBase + urgentFee - discount,
  };
}
