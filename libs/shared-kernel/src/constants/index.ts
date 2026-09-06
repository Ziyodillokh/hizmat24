/** Mijozga qaytariladigan vaqt zonasi. Saqlash — har doim UTC. */
export const CLIENT_TIMEZONE = 'Asia/Tashkent';

/**
 * Yagona valyuta. Biznes-qoida 5.1: konvertatsiya yoki boshqa valyuta TAQIQLANADI.
 * API kontraktida `currency` maydoni faqat shu literal bilan cheklangan.
 */
export const CURRENCY = 'UZS' as const;
export type Currency = typeof CURRENCY;

/** Usta "Qabul qilaman" bosishi uchun berilgan vaqt (3.4). */
export const MASTER_ACK_TIMEOUT_MS = 3 * 60 * 1000;

/** Cheksiz tsikldan himoya: shuncha urinishdan keyin admin panelga eskalatsiya (3.4). */
export const MAX_ASSIGNMENT_ATTEMPTS = 5;

/** Navbatdan avtomatik tayinlash background job intervali (nofunksional talab 7.2). */
export const QUEUE_SWEEP_INTERVAL_MS = 10 * 1000;

/** Usta qidiruv radiusi (km). */
export const MATCHING_RADIUS_KM = 15;

/** Bitta qidiruvda ko'rib chiqiladigan nomzodlar soni. */
export const MATCHING_CANDIDATE_LIMIT = 20;

/** Buyurtma tavsifi uchun chegaralar. */
export const ORDER_DESCRIPTION_MIN_LENGTH = 10;
export const ORDER_DESCRIPTION_MAX_LENGTH = 2000;
export const ORDER_MAX_ATTACHMENTS = 10;

/** OTP sozlamalari. */
export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_VERIFY_ATTEMPTS = 5;
/** Rate limit: 1 daqiqada 1 marta (xavfsizlik talabi 6.3). */
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

/** BullMQ navbat nomlari. */
export const QUEUE_MATCHING = 'matching';
export const QUEUE_RATINGS = 'ratings';
export const QUEUE_NOTIFICATIONS = 'notifications';

/** BullMQ job nomlari. */
export const JOB_MATCH_ORDER = 'match-order';
export const JOB_MASTER_ACK_TIMEOUT = 'master-ack-timeout';
export const JOB_SWEEP_QUEUE = 'sweep-queue';
export const JOB_RECALCULATE_MASTER_RATING = 'recalculate-master-rating';

/** Redis Sorted Set — navbat pozitsiyasini tez hisoblash uchun. */
export const REDIS_QUEUE_KEY = 'orders:queue';

/** O'rtacha shahar ichidagi tezlik (km/soat) — ETA taxminiy hisobi uchun. */
export const AVERAGE_CITY_SPEED_KMH = 20;

/** Bitta buyurtmaning o'rtacha bajarilish vaqti (daqiqa) — navbat kutish taxminini hisoblash uchun. */
export const AVERAGE_ORDER_DURATION_MINUTES = 45;

/**
 * Shoshilinch buyurtmalarni navbat boshiga chiqarish uchun score'dan ayiriladigan qiymat.
 * TZ 3.4: avval `is_urgent=true`, keyin yaratilgan vaqt bo'yicha. Katta konstanta
 * shoshilinch buyurtmalarni oldinga chiqaradi, lekin ular ichida FIFO tartibini saqlaydi.
 */
export const URGENT_SCORE_BOOST_MS = 10 * 365 * 24 * 60 * 60 * 1000;
