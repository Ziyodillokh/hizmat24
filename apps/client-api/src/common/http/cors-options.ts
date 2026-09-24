/**
 * Brauzer preflight'da soʻraydigan metodlar.
 *
 * `@fastify/cors` sukut bo'yicha faqat `GET,HEAD,POST` qaytaradi (Express'dagi
 * `cors` paketidan FARQLI). Panel esa bloklash, signalni hal qilish va
 * buyurtmani bekor qilishda PATCH/DELETE yuboradi — roʻyxat aniq
 * yozilmasa, brauzer bu soʻrovlarni serverga umuman uzatmaydi.
 */
export const CORS_METHODS = ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE'] as const;

/**
 * Ruxsat etilgan Origin'lar roʻyxatini yigʻadi.
 *
 * Admin paneli alohida manzilda (admin.hizmat24.uz) turadi va API bilan
 * cross-origin gaplashadi, shuning uchun uning manzili ham shu yerga
 * qoʻshiladi — mobil ilova uchun `CORS_ORIGINS` boʻsh qoladi va panel
 * aks holda bu roʻyxatda unutilib ketardi.
 */
export function allowedOrigins(corsOrigins: string, adminWebOrigin: string): string[] {
  return [...corsOrigins.split(','), adminWebOrigin].map((origin) => origin.trim()).filter(Boolean);
}

/**
 * Ruxsat etilgan Origin faqat aniq roʻyxat boʻladi — funksiya (callback)
 * emas. Tip shuni qatʼiy ushlab turadi: Fastify callback'ning boshqa
 * shaklini kutadi va umumiy `CorsOptions` bu yerda mos kelmaydi.
 */
export interface AppCorsOptions {
  origin: string[];
  credentials: true;
  methods: string[];
}

/**
 * CORS sozlamalari. Roʻyxat boʻsh boʻlsa `null` — CORS umuman yoqilmaydi
 * (mobil ilova brauzer emas, unga kerak emas).
 *
 * Har qanday Origin'ni `credentials` bilan qaytarish klassik CORS xatosi,
 * shuning uchun `*` hech qachon ishlatilmaydi.
 */
export function buildCorsOptions(
  corsOrigins: string,
  adminWebOrigin: string,
): AppCorsOptions | null {
  const origin = allowedOrigins(corsOrigins, adminWebOrigin);
  if (origin.length === 0) return null;

  return { origin, credentials: true, methods: [...CORS_METHODS] };
}
