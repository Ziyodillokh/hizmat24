import { haversineKm } from '@client/common/utils/geo.util';

/**
 * Xizmat hududi qoidalari — SOF mantiq.
 *
 * Platforma 2026-09-22 dan faqat Namangan shahrida ishlaydi. Qoida bitta
 * joyda turadi: buyurtma yaratish ham, panel ham, ilova ham shu javobga
 * tayanadi.
 */
export interface ServiceAreaView {
  readonly cityName: string;
  readonly centerLat: number;
  readonly centerLng: number;
  readonly radiusKm: number;
}

export interface AddressPoint {
  readonly label: string;
  readonly lat?: number | null;
  readonly lng?: number | null;
}

/**
 * Shahar nomini solishtirish uchun tozalash.
 *
 * Oʻzbek matnida bir xil soʻz bir necha koʻrinishda yoziladi: «Namangan»,
 * «namangan shahri», «NAMANGAN sh.». Apostroflar ham uch xil boʻladi
 * (U+02BB, U+02BC, ASCII). Solishtirishdan oldin hammasi bitta shaklga
 * keltiriladi, aks holda mijozning toʻgʻri manzili rad etilardi.
 */
export function canonicalCity(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ʻʼ‘’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Nuqta hudud doirasi ichidami. */
export const isPointInside = (area: ServiceAreaView, lat: number, lng: number): boolean =>
  haversineKm({ lat: area.centerLat, lng: area.centerLng }, { lat, lng }) <= area.radiusKm;

/**
 * Manzil matnida shahar nomi bormi.
 *
 * Koordinata boʻlmaganda (ilovada xarita hali yoʻq — K1) yagona tayanch
 * shu. Matn boʻyicha tekshiruv aldanishi mumkin, lekin u mijozning
 * xatosini — «Toshkent, Chilonzor» deb yozib yuborishini — ushlaydi.
 */
export function labelMentionsCity(area: ServiceAreaView, label: string): boolean {
  return canonicalCity(label).includes(canonicalCity(area.cityName));
}

/** Hududlar roʻyxatidagi shahar nomlari: «Namangan» yoki «Namangan, Chust». */
export const cityNamesLine = (areas: readonly ServiceAreaView[]): string =>
  areas.map((area) => area.cityName).join(', ');

/**
 * Manzil xizmat hududidamikin. `null` — hammasi joyida, aks holda
 * mijozga aytiladigan sabab.
 *
 * Koordinata BOR boʻlsa — faqat u hisobga olinadi: u matndan aniqroq va
 * «Namangan koʻchasi, Toshkent» degan manzilni ham toʻgʻri rad etadi.
 * Koordinata boʻlmasa — matn boʻyicha.
 */
export function addressCoverageProblem(
  areas: readonly ServiceAreaView[],
  address: AddressPoint,
): string | null {
  // Faol hudud umuman boʻlmasa, buyurtma qabul qilinmaydi: «hamma joyda
  // ishlaymiz» degan maʼnoni chiqarish — bajarilmaydigan vaʼda.
  if (areas.length === 0) {
    return 'Hozircha xizmat koʻrsatiladigan hudud belgilanmagan.';
  }

  const outside = `Hozircha faqat ${cityNamesLine(areas)} shahrida xizmat koʻrsatamiz.`;

  if (typeof address.lat === 'number' && typeof address.lng === 'number') {
    const lat = address.lat;
    const lng = address.lng;
    return areas.some((area) => isPointInside(area, lat, lng)) ? null : outside;
  }

  return areas.some((area) => labelMentionsCity(area, address.label)) ? null : outside;
}
