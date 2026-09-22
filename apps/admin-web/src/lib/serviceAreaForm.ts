import type { ServiceArea, ServiceAreaInput } from '@/api/admin';

/**
 * Xizmat hududi shaklining sof mantiqi — React yoʻq, tarmoq yoʻq.
 *
 * Chegaralar server DTO si bilan BIR XIL (`service-area-limits.ts`):
 * panelda qabul qilingan qiymat serverda rad etilmasligi kerak.
 */
export const CITY_MIN = 2;
export const CITY_MAX = 80;
export const RADIUS_MIN = 1;
export const RADIUS_MAX = 100;
export const LAT_MIN = -90;
export const LAT_MAX = 90;
export const LNG_MIN = -180;
export const LNG_MAX = 180;

export interface AreaFormState {
  cityName: string;
  /** Sonlar MATN sifatida: yozilayotganda «40.» holati ham boʻladi. */
  centerLat: string;
  centerLng: string;
  radiusKm: string;
}

export const toFormState = (area: ServiceArea): AreaFormState => ({
  cityName: area.cityName,
  centerLat: String(area.centerLat),
  centerLng: String(area.centerLng),
  radiusKm: String(area.radiusKm),
});

/**
 * Oʻnli sonni oʻqiydi; `null` — son emas.
 *
 * Vergul ham nuqta deb qabul qilinadi: oʻzbek klaviaturasida oʻnli
 * ajratgich vergul va «40,9983» deb yozgan odam xato qilmagan.
 * Boʻshliqlar (oddiy va uzilmas) tashlab yuboriladi — nusxa koʻchirilgan
 * koordinatada ular uchraydi.
 */
export function parseDecimal(raw: string): number | null {
  const cleaned = raw.replace(/[\s\u00A0\u202F]/g, '').replace(',', '.');
  if (cleaned.length === 0) return null;
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;

  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

const inRange = (value: number, min: number, max: number): boolean =>
  value >= min && value <= max;

/** Maydondagi xato; `null` — muammo yoʻq. */
export function cityProblem(value: string): string | null {
  const length = value.trim().length;
  if (length < CITY_MIN) return `Shahar nomi kamida ${CITY_MIN} belgi boʻlsin`;
  if (length > CITY_MAX) return `Koʻpi bilan ${CITY_MAX} belgi`;
  return null;
}

export function latProblem(value: string): string | null {
  const parsed = parseDecimal(value);
  if (parsed === null) return 'Kenglik son boʻlsin, masalan 40.9983';
  return inRange(parsed, LAT_MIN, LAT_MAX) ? null : `Kenglik ${LAT_MIN} dan ${LAT_MAX} gacha`;
}

export function lngProblem(value: string): string | null {
  const parsed = parseDecimal(value);
  if (parsed === null) return 'Uzunlik son boʻlsin, masalan 71.6726';
  return inRange(parsed, LNG_MIN, LNG_MAX) ? null : `Uzunlik ${LNG_MIN} dan ${LNG_MAX} gacha`;
}

export function radiusProblem(value: string): string | null {
  const parsed = parseDecimal(value);
  if (parsed === null) return 'Radius son boʻlsin, masalan 12';
  return inRange(parsed, RADIUS_MIN, RADIUS_MAX)
    ? null
    : `Radius ${RADIUS_MIN} dan ${RADIUS_MAX} km gacha`;
}

/** Saqlash tugmasi nega yopiq; `null` — saqlash mumkin. */
export function saveBlocker(form: AreaFormState): string | null {
  return (
    cityProblem(form.cityName) ??
    latProblem(form.centerLat) ??
    lngProblem(form.centerLng) ??
    radiusProblem(form.radiusKm)
  );
}

/**
 * Faqat OʻZGARGAN maydonlar. Server qisman yangilaydi, shuning uchun
 * tegilmagan maydonni yuborish shart emas — va yuborilsa, ikki admin bir
 * vaqtda ishlaganda biri ikkinchisining oʻzgarishini bekor qilardi.
 */
export function toInput(form: AreaFormState, original: ServiceArea): ServiceAreaInput {
  const cityName = form.cityName.trim();
  const centerLat = parseDecimal(form.centerLat);
  const centerLng = parseDecimal(form.centerLng);
  const radiusKm = parseDecimal(form.radiusKm);

  return {
    ...(cityName !== original.cityName ? { cityName } : {}),
    ...(centerLat !== null && centerLat !== original.centerLat ? { centerLat } : {}),
    ...(centerLng !== null && centerLng !== original.centerLng ? { centerLng } : {}),
    ...(radiusKm !== null && radiusKm !== original.radiusKm ? { radiusKm } : {}),
  };
}

export const hasChanges = (form: AreaFormState, original: ServiceArea): boolean =>
  Object.keys(toInput(form, original)).length > 0;

/** «40.9983, 71.6726 · 12 km» — roʻyxatdagi bir qatorli xulosa. */
export const areaSummaryLine = (area: ServiceArea): string =>
  `${area.centerLat}, ${area.centerLng} · ${area.radiusKm} km`;
