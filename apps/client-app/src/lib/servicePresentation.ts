import type { ServiceCategory, ServiceMedia } from '@/mocks/types';

/**
 * Xizmat kartasini ekranga tayyorlash — SOF funksiyalar.
 *
 * Bu yerdagi har bir qoida bitta savolga javob beradi: «maʼlumot
 * boʻlmasa nima koʻrsatamiz?». Javob har doim bir xil — HECH NARSA
 * koʻrsatmaymiz yoki yoʻqligini ochiq aytamiz, taxmin qilmaymiz.
 */

/** Serverdagi rasm yoʻlini toʻliq manzilga aylantiradi. */
export const mediaSrc = (baseUrl: string | null, url: string): string => `${baseUrl ?? ''}${url}`;

/**
 * Narx yorligʻi. `FROM` — «shundan boshlab»: ish hajmi joyida maʼlum
 * boʻladigan xizmatlarda aniq son yozish yolgʻon vaʼda boʻlardi.
 */
export const priceLabel = (formatted: string, kind: ServiceCategory['priceKind']): string =>
  kind === 'FROM' ? `${formatted}dan` : formatted;

/**
 * Davomiylikni odam tilida: «40 daqiqa», «1 soat», «1 soat 30 daqiqa».
 * `null` — vaqt aytilmagan, `null` qaytadi va ekran qatorni umuman
 * chizmaydi.
 */
export function durationLabel(minutes: number | null | undefined): string | null {
  if (minutes === null || minutes === undefined || minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} daqiqa`;
  if (rest === 0) return `${hours} soat`;
  return `${hours} soat ${rest} daqiqa`;
}

export interface ServiceGallery {
  cover: string | null;
  items: ReadonlyArray<{ kind: 'IMAGE' | 'VIDEO'; url: string }>;
}

/**
 * Galereya: muqova birinchi oʻrinda turadi.
 *
 * Server muqovani alohida maydonda beradi, lekin u `media` ichida ham
 * bor — ikki marta chizilmasligi uchun roʻyxat muqovadan boshlanadi va
 * qolganlari oʻz tartibida ergashadi.
 */
/**
 * Galereyada FAQAT umumiy rasmlar koʻrinadi.
 *
 * «Oldin/keyin» juftligi va uskuna rasmlari sahifada oʻz boʻlimida,
 * yorligʻi bilan chiziladi. Galereyaga ham tushsa, foydalanuvchi ularni
 * kontekstsiz koʻrardi: ifloslangan kran rasmi xizmatning oʻzi kabi
 * koʻrinib, chalgʻitardi.
 *
 * Roli yoʻq rasm — galereya: eski server bu maydonni yubormaydi.
 */
const isGallery = (item: ServiceMedia): boolean => (item.role ?? 'GALLERY') === 'GALLERY';

export function buildGallery(category: ServiceCategory): ServiceGallery {
  const media = (category.media ?? []).filter(isGallery);
  const cover = category.coverUrl ?? null;

  // Muqova boshqa rolda boʻlishi mumkin emas (u roʻyxat kartasining
  // rasmi), lekin u galereyadan filtrlanib ketgan boʻlsa, uni qaytarib
  // qoʻshmaymiz — aks holda boʻlim rasmi galereyada takrorlanardi.
  const hasCover = cover !== null && (category.media ?? []).some(
    (item) => item.url === cover && isGallery(item),
  );

  if (!hasCover) return { cover, items: media };

  return {
    cover,
    items: [
      { kind: 'IMAGE' as const, url: cover },
      ...media.filter((item) => item.url !== cover),
    ],
  };
}

/** Xizmatda koʻrsatishga arzigulik batafsil maʼlumot bormi. */
export const hasRichDetails = (category: ServiceCategory): boolean =>
  Boolean(category.details?.trim()) ||
  (category.includes?.length ?? 0) > 0 ||
  (category.excludes?.length ?? 0) > 0 ||
  (category.media?.length ?? 0) > 0;
