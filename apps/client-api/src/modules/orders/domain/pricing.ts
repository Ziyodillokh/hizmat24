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
  const urgentFee = isUrgent ? URGENT_FEE_UZS : 0;
  const safePercent = Math.max(0, Math.min(100, Math.round(discountPercent)));

  // Chegirma asosiy narxdan oshib ketmaydi — foiz 100 dan katta berilsa ham.
  const raw = (safeBase * safePercent) / 100;
  const discount = Math.min(safeBase, Math.round(raw / MONEY_STEP_UZS) * MONEY_STEP_UZS);

  return {
    base: safeBase,
    urgentFee,
    discountPercent: safePercent,
    discount,
    total: safeBase + urgentFee - discount,
  };
}
