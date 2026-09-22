import type { AdminCategory, CategoryInput, PriceKind } from '@/api/admin';

/**
 * Xizmat kartasi shaklining sof mantiqi — React yoʻq, tarmoq yoʻq.
 *
 * Chegaralar server DTO si bilan BIR XIL: panel tugmani bosishdan oldin
 * sababini aytadi, server esa baribir oʻzi tekshiradi. Ikki joyda ikki
 * xil son boʻlsa, foydalanuvchi «nega rad etildi» degan savol bilan
 * qolardi.
 */
export const NAME_MIN = 2;
export const NAME_MAX = 120;
export const SUMMARY_MAX = 200;
export const DETAILS_MAX = 4000;
export const LIST_ITEM_MAX = 200;
export const LIST_MAX_ITEMS = 20;
export const PRICE_MAX = 100_000_000;
export const DURATION_MIN = 5;
export const DURATION_MAX = 1440;

/** Yuklanadigan fayl chegaralari — server `media-rules.ts` bilan bir xil. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
export const MAX_MEDIA_PER_CATEGORY = 8;
export const ACCEPTED_MEDIA = 'image/jpeg,image/png,image/webp,video/mp4';

export interface CategoryFormState {
  name: string;
  summary: string;
  details: string;
  includes: string[];
  excludes: string[];
  /** Matn sifatida saqlanadi — foydalanuvchi yozayotgan paytda boʻsh boʻlishi mumkin. */
  basePrice: string;
  priceKind: PriceKind;
  durationMinutes: string;
  groupId: string;
}

export const EMPTY_FORM: CategoryFormState = {
  name: '',
  summary: '',
  details: '',
  includes: [],
  excludes: [],
  basePrice: '',
  priceKind: 'FIXED',
  durationMinutes: '',
  groupId: '',
};

export const toFormState = (category: AdminCategory): CategoryFormState => ({
  name: category.name,
  summary: category.summary ?? '',
  details: category.details ?? '',
  includes: [...category.includes],
  excludes: [...category.excludes],
  basePrice: String(category.basePrice),
  priceKind: category.priceKind,
  durationMinutes: category.durationMinutes === null ? '' : String(category.durationMinutes),
  groupId: category.groupId ?? '',
});

/**
 * Raqam maydoni: faqat butun son; boʻsh yoki notoʻgʻri boʻlsa `null`.
 *
 * Ajratkich `\u00A0` (boʻlinmas boʻshliq) sifatida ham kelishi mumkin:
 * `formatPrice` narxni aynan shu belgi bilan yozadi va foydalanuvchi uni
 * nusxalab maydonga qoʻysa, oddiy `\s` uni tutmasdi. Belgi ESCAPE bilan
 * yoziladi — koʻrinmas belgi manbada turishi xato manbai.
 */
export function parseWholeNumber(raw: string): number | null {
  const cleaned = raw.replace(/[\s\u00A0\u202F]/g, '');
  if (cleaned.length === 0 || !/^\d+$/.test(cleaned)) return null;

  const value = Number(cleaned);
  return Number.isSafeInteger(value) ? value : null;
}

/** Barcha muammolar BIRDANIGA — foydalanuvchi ularni birma-bir topmasin. */
export function validateForm(form: CategoryFormState): string[] {
  const problems: string[] = [];
  const name = form.name.trim();

  if (name.length < NAME_MIN) problems.push(`Nomi kamida ${NAME_MIN} belgidan iborat boʻlsin.`);
  if (name.length > NAME_MAX) problems.push(`Nomi ${NAME_MAX} belgidan uzun boʻlmasin.`);
  if (form.summary.trim().length > SUMMARY_MAX) {
    problems.push(`Qisqa izoh ${SUMMARY_MAX} belgidan uzun boʻlmasin.`);
  }
  if (form.details.trim().length > DETAILS_MAX) {
    problems.push(`Tavsif ${DETAILS_MAX} belgidan uzun boʻlmasin.`);
  }

  const price = parseWholeNumber(form.basePrice);
  if (price === null) problems.push('Narx butun son boʻlsin (tiyin yoʻq).');
  else if (price > PRICE_MAX) problems.push('Narx juda katta.');

  if (form.durationMinutes.trim().length > 0) {
    const duration = parseWholeNumber(form.durationMinutes);
    if (duration === null || duration < DURATION_MIN || duration > DURATION_MAX) {
      problems.push(`Davomiylik ${DURATION_MIN}–${DURATION_MAX} daqiqa oraligʻida boʻlsin.`);
    }
  }

  for (const [label, list] of [
    ['«Narx ichiga kiradi»', form.includes],
    ['«Kirmaydi»', form.excludes],
  ] as const) {
    if (list.length > LIST_MAX_ITEMS) problems.push(`${label} roʻyxatida ${LIST_MAX_ITEMS} tadan koʻp band boʻlmasin.`);
    if (list.some((item) => item.trim().length > LIST_ITEM_MAX)) {
      problems.push(`${label} bandi ${LIST_ITEM_MAX} belgidan uzun boʻlmasin.`);
    }
  }

  return problems;
}

/** Shakl → serverga yuboriladigan maʼlumot. Boʻsh maydon UMUMAN yuborilmaydi. */
export function toCategoryInput(form: CategoryFormState): CategoryInput | null {
  if (validateForm(form).length > 0) return null;

  const price = parseWholeNumber(form.basePrice);
  if (price === null) return null;

  const duration = parseWholeNumber(form.durationMinutes);
  const clean = (list: string[]) => list.map((item) => item.trim()).filter(Boolean);

  return {
    name: form.name.trim(),
    ...(form.summary.trim() ? { summary: form.summary.trim() } : {}),
    ...(form.details.trim() ? { details: form.details.trim() } : {}),
    includes: clean(form.includes),
    excludes: clean(form.excludes),
    basePrice: price,
    priceKind: form.priceKind,
    ...(duration === null ? {} : { durationMinutes: duration }),
    ...(form.groupId ? { groupId: form.groupId } : {}),
  };
}

/** Yuklashdan OLDIN faylni tekshiradi; `null` — yaroqli. */
export function fileProblem(file: { type: string; size: number }, existingCount: number): string | null {
  if (existingCount >= MAX_MEDIA_PER_CATEGORY) {
    return `Bitta xizmatga ${MAX_MEDIA_PER_CATEGORY} tadan koʻp fayl qoʻyilmaydi.`;
  }

  const mime = file.type.toLowerCase().split(';')[0].trim();
  if (mime === 'video/mp4') {
    return file.size > MAX_VIDEO_BYTES ? 'Video 60 MB dan katta boʻlmasin.' : null;
  }
  if (['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
    return file.size > MAX_IMAGE_BYTES ? 'Rasm 5 MB dan katta boʻlmasin.' : null;
  }

  return 'Faqat JPEG, PNG, WebP rasm yoki MP4 video qabul qilinadi.';
}

export const PRICE_KIND_LABELS: Record<PriceKind, string> = {
  FIXED: 'Aniq narx',
  FROM: 'Shundan boshlab',
};

/** Narx yorligʻi: «85 000 soʻm» yoki «85 000 soʻmdan». */
export const priceLabel = (formatted: string, kind: PriceKind): string =>
  kind === 'FROM' ? `${formatted}dan` : formatted;
