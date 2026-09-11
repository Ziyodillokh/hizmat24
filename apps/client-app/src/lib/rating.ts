/**
 * Baholash qoidalari — sof funksiyalar. React YOʻQ, store YOʻQ.
 *
 * Ekran "1 yulduz" yoki "salbiy baho" kabi qoidani OʻZI bilmaydi: aks holda
 * qoida kutubxonadan tashqarida qolib ketadi va test bilan qoplanmaydi —
 * `orderStateMachine.ts` fayl boshidagi qoidaning aynan oʻzi.
 *
 * Yorliqlar ilgari IKKI faylda takrorlangan edi va ayrilib ketish xavfi bor
 * edi; endi yagona manba shu yerda.
 */

export interface OrderRating {
  /** 1–5 butun son. */
  stars: number;
  comment: string | null;
  /** Tanlangan teglar — koʻrsatiladigan matnning oʻzi. */
  tags: string[];
}

/**
 * Yulduz yorligʻi. Shkala MONOTON: ilgari 2-yulduz "Qoniqarli" edi —
 * salbiy bahoga ijobiy yorliq.
 */
export const RATING_LABELS = [
  'Juda yomon',
  'Yomon',
  'Oʻrtacha',
  'Yaxshi',
  'Ajoyib',
] as const;

/** Shu qiymatgacha (shu jumladan) baho salbiy hisoblanadi. */
export const NEGATIVE_RATING_MAX = 2;

export const POSITIVE_TAGS = [
  'Oʻz vaqtida keldi',
  'Ishni sifatli bajardi',
  'Yaxshi muloqat',
  'Narx kelishilgandek',
  'Ortidan tozalab ketdi',
] as const;

export const NEGATIVE_TAGS = [
  'Kech keldi',
  'Ish sifatsiz',
  'Qoʻpol muomala',
  'Narxni oshirdi',
  'Ortidan tozalamadi',
] as const;

export const isNegativeRating = (stars: number): boolean =>
  stars >= 1 && stars <= NEGATIVE_RATING_MAX;

export const ratingLabel = (stars: number): string | null =>
  Number.isInteger(stars) && stars >= 1 && stars <= 5 ? RATING_LABELS[stars - 1] : null;

/**
 * Yulduzga mos teg toʻplami.
 *
 * Havola BARQAROR (`as const` massivlar): ekran ikki toʻplamni havola
 * boʻyicha solishtirib, toʻplam almashganda tanlovni tozalaydi.
 */
const NO_TAGS: readonly string[] = [];

export function ratingTagsFor(stars: number): readonly string[] {
  // Umumiy konstanta: har chaqiruvda yangi massiv qaytarilsa, havola
  // boʻyicha solishtirish boʻsh holatda ham "almashdi" deb hisoblardi.
  if (stars < 1) return NO_TAGS;
  return isNegativeRating(stars) ? NEGATIVE_TAGS : POSITIVE_TAGS;
}

/**
 * Past bahoda sabab MAJBURIY — lekin izoh sifatida emas, TEG sifatida.
 *
 * Uzun izoh talab qilish eng asabiy daqiqadagi eng katta toʻsiq boʻlardi,
 * buyurtma esa baholanmaguncha yopilmaydi. Bitta teg — bir marta bosish —
 * xuddi shu signalni beradi.
 */
export const requiresReasonTag = (stars: number): boolean => isNegativeRating(stars);

/** Yagona haqiqat manbai: "Bahoni yuborish" tugmasi qachon ochiladi. */
export function canSubmitRating(stars: number, tags: readonly string[]): boolean {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return false;
  if (!requiresReasonTag(stars)) return true;
  return tags.length > 0;
}

/** Tugma oʻchiq boʻlganda sababini aytadi; aks holda `null`. */
export function submitHint(stars: number, tags: readonly string[]): string | null {
  if (stars < 1) return 'Yulduz tanlang';
  if (requiresReasonTag(stars) && tags.length === 0) return 'Kamida bitta sabab tanlang';
  return null;
}

/**
 * Yulduz ijobiydan salbiyga (yoki teskari) oʻtdimi — teglar tozalanadimi.
 *
 * Birinchi tanlovda (`prev < 1`) tozalanadigan narsa yoʻq, shuning uchun
 * `false`: bu qoida ekranda keraksiz holat yangilanishining oldini oladi.
 */
export const shouldResetTags = (prev: number, next: number): boolean =>
  prev >= 1 && ratingTagsFor(prev) !== ratingTagsFor(next);

/**
 * Saqlangan yozuvdan bahoni tiklaydi.
 *
 * Yaroqsiz yulduz TUZATILMAYDI, balki butun baho `null` qilinadi: "9 yulduz"
 * buzilgan yozuv, uni 5 ga qisqartirish esa soxta maʼlumot yasash boʻlardi.
 */
export function normalizeRating(raw: unknown): OrderRating | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const value = raw as { stars?: unknown; comment?: unknown; tags?: unknown };
  if (!Number.isInteger(value.stars)) return null;

  const stars = value.stars as number;
  if (stars < 1 || stars > 5) return null;

  return {
    stars,
    comment:
      typeof value.comment === 'string' && value.comment.length > 0 ? value.comment : null,
    tags: Array.isArray(value.tags)
      ? value.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
  };
}
