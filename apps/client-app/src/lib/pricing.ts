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
  /** Katalogdagi BIR DONA narxi — mijoz butun oqim davomida shuni koʻrgan. */
  unitPrice: number;
  /** Nechta ish buyurtma qilinmoqda. */
  quantity: number;
  /** `unitPrice × quantity` — chegirma aynan shundan olinadi. */
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
  /** Katalogdagi bir dona narxi. */
  base: number;
  /** Nechta ish. Berilmasa 1. */
  quantity?: number;
  isUrgent: boolean;
  /** Foydalanuvchi darajasining chegirmasi; daraja yoʻq boʻlsa 0. */
  discountPercent: number;
}

/** Bir buyurtmada koʻpi bilan shuncha ish — server bilan BIR XIL. */
export const MAX_QUANTITY = 10;

/**
 * Hisob-fakturani yigʻadi.
 *
 * Chegirma FAQAT `base` dan olinadi, `base + urgentFee` dan emas: chegirma
 * platformaning xizmat marjasidan qoplanadi, shoshilinch qoʻshimchasi esa
 * platforma haqiqatan sarflaydigan yuborish xarajati. Undan chegirma berish
 * formulani tushuntirib boʻlmaydigan qilardi.
 */
export function buildInvoice({
  base,
  quantity = 1,
  isUrgent,
  discountPercent,
}: InvoiceInput): OrderInvoice {
  const unitPrice = Math.max(0, Math.round(base));
  const safeQuantity = Math.max(1, Math.min(MAX_QUANTITY, Math.round(quantity)));
  const safeBase = unitPrice * safeQuantity;

  /*
   * Shoshilinch qoʻshimchasi miqdorga KOʻPAYTIRILMAYDI: u ustani darhol
   * yuborish xarajati va usta baribir bir marta chiqadi. Server ham
   * xuddi shunday hisoblaydi.
   */
  const urgentFee = isUrgent ? URGENT_FEE : 0;
  const safePercent = Math.max(0, Math.min(100, discountPercent));

  // Chegirma asosiy narxdan oshib ketmaydi — foiz 100 dan katta berilsa ham.
  const raw = (safeBase * safePercent) / 100;
  const discount = Math.min(safeBase, Math.round(raw / MONEY_STEP) * MONEY_STEP);

  return {
    unitPrice,
    quantity: safeQuantity,
    base: safeBase,
    urgentFee,
    discountPercent: safePercent,
    discount,
    total: safeBase + urgentFee - discount,
  };
}
