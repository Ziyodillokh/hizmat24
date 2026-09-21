import { z } from 'zod';

/**
 * Boot vaqtida barcha muhit oʻzgaruvchilari tekshiriladi (9.7).
 * Noto'g'ri/yetishmayotgan env boʻlsa — ilova umuman ko'tarilmaydi.
 */
/**
 * Muhit o'zgaruvchilari — har doim matn. `z.coerce.boolean()` bu yerda YARAMAYDI:
 * u `Boolean("false")` ni hisoblaydi va natija `true` bo'lib chiqadi, yaʼni
 * `FCM_ENABLED=false` yoki `OTP_DEBUG_RETURN_CODE=false` teskari ishlab ketardi.
 */
const booleanFromEnv = (defaultValue: boolean) =>
  z
    .enum(['true', 'false', '1', '0', ''])
    .default(defaultValue ? 'true' : 'false')
    .transform((value) => value === 'true' || value === '1');

const envSchema = z.object({
  /**
   * `staging` — sinov serveri: production imijda ishlaydi (pino-pretty va
   * boshqa dev-asboblar yoʻq), lekin SMS shlyuzsiz kirish uchun `console`
   * provayder va OTP kodini javobda qaytarish RUXSAT etiladi. Ilgari buning
   * uchun serverga `development` yozilar edi — u esa `pino-pretty` ni talab
   * qilib, production imijda umuman koʻtarilmasdi.
   */
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_URL: z.string().url(),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().int().min(0).default(0),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET kamida 32 belgidan iborat boʻlsin"),
  JWT_ACCESS_TTL: z.string().default('15m'),
  /** Refresh tokenlar JWT emas — tasodifiy, SHA-256 bilan hashlanadi. */
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),

  /** OTP hashi uchun JWT siridan alohida kalit. */
  OTP_HASH_SECRET: z.string().min(32, "OTP_HASH_SECRET kamida 32 belgidan iborat boʻlsin"),

  /**
   * Vergul bilan ajratilgan ruxsat etilgan Origin'lar. Boʻsh bo'lsa — CORS o'chirilgan
   * (mobil ilova uchun kerak emas). `*` bilan credentials birga ishlatilmaydi.
   */
  CORS_ORIGINS: z.string().default(''),

  /** Prometheus `/metrics` endpointini himoyalovchi token. Boʻsh bo'lsa — endpoint yopiq. */
  METRICS_TOKEN: z.string().optional(),

  SMS_PROVIDER: z.enum(['console', 'eskiz', 'playmobile']).default('console'),
  SMS_API_URL: z.string().url().optional(),
  SMS_API_TOKEN: z.string().optional(),
  SMS_SENDER: z.string().default('4546'),

  FCM_ENABLED: booleanFromEnv(false),
  FCM_PROJECT_ID: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),

  /** Faqat development/test uchun: OTP kodi javobda qaytariladi. */
  OTP_DEBUG_RETURN_CODE: booleanFromEnv(false),

  THROTTLE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(120),

  /**
   * Admin sessiya tokenini hashlash kaliti. Mijoz sirlaridan ALOHIDA:
   * mijoz kaliti sizib chiqsa, admin paneli u bilan ochilmasligi kerak.
   */
  ADMIN_TOKEN_SECRET: z.string().min(32, 'ADMIN_TOKEN_SECRET kamida 32 belgidan iborat boʻlsin'),
  /** Faolsizlik boʻyicha avtomatik chiqish (daqiqa). */
  ADMIN_SESSION_IDLE_MINUTES: z.coerce.number().int().positive().default(30),
  /** Autentifikator ilovasida koʻrinadigan nom. */
  ADMIN_TOTP_ISSUER: z.string().default('Hizmat24'),
  /** Admin paneli manzili — CORS shu yerdan ochiladi. Boʻsh boʻlsa panel ulanmaydi. */
  ADMIN_WEB_ORIGIN: z.string().default(''),
});

export type AppEnv = z.infer<typeof envSchema>;

/**
 * Boʻsh satr = berilmagan.
 *
 * docker-compose ixtiyoriy oʻzgaruvchilarni `${SMS_API_URL:-}` shaklida
 * uzatadi, yaʼni qiymat yoʻq boʻlsa ham konteynerga BOʻSH SATR yetib
 * boradi. Zod uchun `""` — `undefined` emas: `url().optional()` uni
 * «notoʻgʻri URL» deb rad etar va ilova serverda koʻtarilmasdi.
 */
const emptyToUndefined = (config: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value === '' ? undefined : value]),
  );

export function validateEnv(rawConfig: Record<string, unknown>): AppEnv {
  const parsed = envSchema.safeParse(emptyToUndefined(rawConfig));

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Muhit oʻzgaruvchilari validatsiyadan oʻtmadi:\n${issues}`);
  }

  if (parsed.data.NODE_ENV === 'production' && parsed.data.OTP_DEBUG_RETURN_CODE) {
    throw new Error('OTP_DEBUG_RETURN_CODE production muhitida yoqilishi mumkin emas');
  }

  // "console" provayderi OTP kodini logga ochiq yozadi — production'da taqiqlanadi.
  if (parsed.data.NODE_ENV === 'production' && parsed.data.SMS_PROVIDER === 'console') {
    throw new Error(
      'SMS_PROVIDER=console production muhitida ishlatilmaydi: kod loglarga ochiq tushadi',
    );
  }

  if (
    parsed.data.NODE_ENV === 'production' &&
    parsed.data.JWT_ACCESS_SECRET === parsed.data.OTP_HASH_SECRET
  ) {
    throw new Error('OTP_HASH_SECRET JWT_ACCESS_SECRET dan farq qilishi kerak');
  }

  /*
   * Uchala sir bir-biridan farq qilishi SHART. Bitta sir uchala joyda
   * ishlatilsa, mijoz tokenini hashlash kalitini bilgan odam admin
   * sessiyasini ham yasay olardi — "bir kalit, butun tizim" holati.
   */
  if (parsed.data.NODE_ENV === 'production') {
    const secrets = [
      parsed.data.JWT_ACCESS_SECRET,
      parsed.data.OTP_HASH_SECRET,
      parsed.data.ADMIN_TOKEN_SECRET,
    ];
    if (new Set(secrets).size !== secrets.length) {
      throw new Error(
        'ADMIN_TOKEN_SECRET, JWT_ACCESS_SECRET va OTP_HASH_SECRET uchalasi ham farq qilishi kerak',
      );
    }
  }

  if (parsed.data.FCM_ENABLED) {
    const missing = (['FCM_PROJECT_ID', 'FCM_CLIENT_EMAIL', 'FCM_PRIVATE_KEY'] as const).filter(
      (key) => !parsed.data[key],
    );
    if (missing.length > 0) {
      throw new Error(`FCM yoqilgan, lekin quyidagilar yoʻq: ${missing.join(', ')}`);
    }
  }

  return parsed.data;
}
