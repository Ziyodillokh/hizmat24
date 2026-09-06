import type { GeoPoint } from '@shared/index';

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Ikki nuqta orasidagi masofa (km), haversine formulasi bo'yicha. */
export function haversineKm(from: GeoPoint, to: GeoPoint): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2;

  return EARTH_RADIUS_KM * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Masofa asosidagi taxminiy yetib borish vaqti (daqiqa). */
export function estimateEtaMinutes(distanceKm: number, averageSpeedKmh: number): number {
  if (averageSpeedKmh <= 0) {
    throw new Error("averageSpeedKmh musbat bo'lishi kerak");
  }
  return Math.max(1, Math.round((distanceKm / averageSpeedKmh) * 60));
}
