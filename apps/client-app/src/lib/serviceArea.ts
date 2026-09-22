/**
 * Platforma ishlaydigan shahar — SOF mantiq.
 *
 * Ish hozircha faqat Namangan shahrida. Shahar nomi ilovada KODGA
 * yozilmaydi: u serverdan keladi (`GET /api/v1/service-area`), chunki
 * chegara paneldan oʻzgaradi. Bu yerdagi qiymat — server javob bermagan
 * paytdagi zaxira, toʻqilgan maʼlumot emas: hozir platforma haqiqatan
 * faqat shu shaharda ishlaydi.
 */
export const FALLBACK_CITY = 'Namangan';

/** «Namangan shahri» — bosh sahifadagi va manzil qadamidagi belgi. */
export const cityBadge = (city: string): string => `${city} shahri`;

/**
 * Solishtirish uchun tozalash: registr, apostrof va tinish belgilari.
 * Server tomonidagi `canonicalCity` bilan bir xil qoida — ikki tomon
 * bitta manzilni ikki xil baholamasligi kerak.
 */
export const canonicalCity = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[ʻʼ‘’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

export const mentionsCity = (label: string, city: string): boolean =>
  canonicalCity(label).includes(canonicalCity(city));

/**
 * Manzil matniga shahar nomini qoʻshadi.
 *
 * Foydalanuvchi faqat koʻcha va uyni yozadi — shahar ekranda qulflangan
 * holda turadi. Serverga esa TOʻLIQ matn ketishi kerak: usta aynan shuni
 * oʻqiydi va server hududni shu matn boʻyicha tekshiradi.
 *
 * Odam shaharni oʻzi yozib qoʻygan boʻlsa, ikki marta qoʻshilmaydi.
 */
export function withCity(rest: string, city: string): string {
  const cleaned = rest.trim().replace(/^[,\s]+/, '');
  if (cleaned.length === 0) return city;
  return mentionsCity(cleaned, city) ? cleaned : `${city}, ${cleaned}`;
}

/**
 * Toʻliq manzildan shahar nomini ajratib tashlaydi — tahrirlash uchun.
 *
 * Faqat BOSHIDAGI shahar nomi olib tashlanadi: «Namangan koʻchasi» degan
 * koʻcha nomi matn oʻrtasida uchrasa, unga tegilmaydi.
 */
export function withoutCity(label: string, city: string): string {
  const trimmed = label.trim();
  const canonicalPrefix = canonicalCity(city);
  if (!canonicalCity(trimmed).startsWith(canonicalPrefix)) return trimmed;

  // Shahar nomi qancha belgi egallaganini asl matnda topamiz: tozalangan
  // matndagi uzunlik asl matndagiga toʻgʻri kelmaydi (tinish belgilari).
  const match = new RegExp(`^${city.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`, 'iu').exec(
    trimmed,
  );
  if (!match) return trimmed;

  return trimmed.slice(match[0].length).replace(/^[,\s]+/, '');
}

/**
 * Shahardan keyingi qismning eng kam uzunligi.
 *
 * Shahar nomi ekranda qulflangan holda turgani uchun umumiy uzunlik
 * tekshiruvi aldardi: «Namangan, A» ham 11 belgi. Usta oʻqiydigan qism —
 * koʻcha va uy — alohida tekshiriladi.
 */
export const STREET_MIN = 5;

/** Koʻcha maydonidagi xato; `null` — muammo yoʻq. */
export function streetProblem(rest: string): string | null {
  const length = rest.trim().length;
  if (length === 0) return 'Koʻcha va uy raqamini yozing';
  if (length < STREET_MIN) return `Kamida ${STREET_MIN} belgi`;
  return null;
}
