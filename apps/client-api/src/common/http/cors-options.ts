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
 * Android ilovasining Origin'i.
 *
 * Capacitor sahifani WebView ichida `https://localhost` dan ochadi
 * (`capacitor.config.ts` da `server` bloki yoʻq, demak sukut qiymatlar:
 * androidScheme `https`, hostname `localhost`). Ya'ni ilovadan API ga
 * har bir soʻrov CROSS-ORIGIN boʻladi va brauzerdagi kabi CORS talab
 * qiladi — «mobil ilova brauzer emas, unga CORS kerak emas» degan
 * taxmin NOTOʻGʻRI edi va ilova serverga umuman ulana olmasdi.
 *
 * Roʻyxat kodda turadi, server `.env` ida emas: `.env` repoda
 * koʻrinmaydi, shuning uchun ilovaning ulana olishi qayta joylashda
 * jimgina yoʻqolib ketardi.
 */
export const WEBVIEW_ORIGINS = ['https://localhost'] as const;

/**
 * Ruxsat etilgan Origin'lar roʻyxatini yigʻadi.
 *
 * Admin paneli alohida manzilda (admin.hizmat24.uz) turadi, shuning uchun
 * uning manzili alohida `ADMIN_WEB_ORIGIN` dan qoʻshiladi — aks holda u
 * `CORS_ORIGINS` da unutilib ketardi.
 *
 * Takrorlar olib tashlanadi: bir manzil ikki sozlamada ham yozilgan
 * boʻlishi mumkin.
 */
export function allowedOrigins(corsOrigins: string, adminWebOrigin: string): string[] {
  const configured = [...corsOrigins.split(','), adminWebOrigin]
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...WEBVIEW_ORIGINS, ...configured])];
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
 * CORS sozlamalari.
 *
 * Roʻyxat hech qachon boʻsh boʻlmaydi — ichida kamida ilovaning WebView
 * Origin'i turadi. `null` faqat nazariy holat uchun qoldirilgan.
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
