import { MONEY_STEP_UZS, URGENT_FEE_UZS } from '@shared/index';

/**
 * Buyurtma hisob-fakturasi — YAGONA haqiqat manbai SERVERDA.
 *
 * Ilova yuborgan narx hech qachon ishlatilmaydi (TZ 4.1). Bu modul sof:
 * DB ham, `new Date()` ham yoʻq — shuning uchun har bir qoida testda
 * barqaror tekshiriladi.
 *
 * Formulalar ilovadagi `src/lib/pricing.ts` bilan AYNAN bir xil boʻlishi
 * shart: ikki tomon boshqacha hisoblasa, mijoz ekranda bir summani koʻrib,
 * chekda boshqasini olardi.
 */

export interface OrderInvoice {
  /** Katalogdagi BIR DONA narxi — mijoz butun oqim davomida shuni koʻrgan. */
  unitPrice: number;
  /** Nechta ish buyurtma qilindi. */
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
  /** Nechta ish. Berilmasa 1 — eski chaqiruvlar oʻzgarmaydi. */
  quantity?: number;
  isUrgent: boolean;
  /** Foydalanuvchi darajasining chegirmasi; daraja yoʻq boʻlsa 0. */
  discountPercent: number;
}

/** Bir buyurtmada koʻpi bilan shuncha ish. */
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
   * yuborish xarajati va usta baribir bir marta chiqadi.
   */
  const urgentFee = isUrgent ? URGENT_FEE_UZS : 0;
  const safePercent = Math.max(0, Math.min(100, Math.round(discountPercent)));

  // Chegirma asosiy narxdan oshib ketmaydi — foiz 100 dan katta berilsa ham.
  const raw = (safeBase * safePercent) / 100;
  const discount = Math.min(safeBase, Math.round(raw / MONEY_STEP_UZS) * MONEY_STEP_UZS);

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
