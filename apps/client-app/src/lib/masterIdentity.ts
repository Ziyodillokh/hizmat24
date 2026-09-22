/**
 * Usta oʻzini mijozga qanday koʻrsatishi — sof funksiyalar.
 *
 * MOCK `MASTERS` DAN BIRONTA RAQAM OʻQILMAYDI (TZ 6-boʻlim, 15-qoida).
 * Katalogdagi usta obyekti platforma tasdiqlagan maʼlumotni koʻrsatadi:
 * reyting, bajarilgan ishlar soni, sertifikat belgisi. Bu yerdagi usta esa —
 * qurilma egasi: uning hamma raqami SHU telefondagi yopilgan ishlardan
 * chiqadi va nol boʻlishi normal holat.
 *
 * `new Date()` chaqirilmaydi, `localStorage` ga tegilmaydi.
 */
import type { LiveOrder } from '@/app/types';
import type { Master } from '@/mocks/types';
import { formatPhone, formatRating } from './formatters';
import { ORDER_STATUS } from './orderStateMachine';

/** Qurilma egasining usta identifikatori — katalogdagi hech bir id bilan kesishmaydi. */
export const SELF_MASTER_ID = 'm-self';

export const isSelfMaster = (master: Pick<Master, 'id'>): boolean =>
  master.id === SELF_MASTER_ID;

/** Baho hali yoʻqligining YAGONA koʻrinishi — «0,0» hech qachon chizilmaydi. */
export const NO_RATING_LABEL = 'Hali baho yoʻq';

export interface MasterJobStats {
  /** Faqat `handledByMaster && CLOSED` ishlar. */
  completedCount: number;
  /** Baho qoʻyilmagan boʻlsa `null` — 0 EMAS. */
  ratingAvg: number | null;
  ratedCount: number;
}

export const EMPTY_MASTER_STATS: MasterJobStats = {
  completedCount: 0,
  ratingAvg: null,
  ratedCount: 0,
};

export type StatsOrder = Pick<LiveOrder, 'status' | 'handledByMaster' | 'rating'>;

/**
 * Shu qurilmadagi ishlardan hisoblangan statistika.
 *
 * `COMPLETED_BY_MASTER` SANALMAYDI: mijoz baho bermaguncha buyurtma yopilmaydi
 * va ish «bajarilgan» deb koʻrsatilsa, raqam bir kunda ikki marta oʻzgarardi.
 */
export function masterJobStats(orders: readonly StatsOrder[]): MasterJobStats {
  const closed = orders.filter(
    (order) => order.handledByMaster && order.status === ORDER_STATUS.CLOSED,
  );
  const stars = closed
    .map((order) => order.rating?.stars)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  return {
    completedCount: closed.length,
    ratingAvg:
      stars.length === 0 ? null : stars.reduce((sum, value) => sum + value, 0) / stars.length,
    ratedCount: stars.length,
  };
}

export interface SelfMasterInput {
  fullName: string | null;
  phoneNumber: string;
  profession: string;
  stats: MasterJobStats;
}

/**
 * Mijoz buyurtmasiga yoziladigan usta yozuvi.
 *
 * `hasGovCertificate` DOIM `false`: foydalanuvchi «sertifikatim bor» degan
 * boʻlsa ham, uni hech kim tekshirmagan — oʻzi aytgan gap yashil belgiga
 * aylanmaydi (16-qoida). `isPremium` ham `false`, `photoUrl` ham yoʻq: ikkalasi
 * ham platforma beradigan narsa, ilova esa ularni sotmaydi va saqlamaydi.
 */
export function buildSelfMaster(input: SelfMasterInput): Master {
  const name = input.fullName?.trim();

  return {
    id: SELF_MASTER_ID,
    // Ism kiritilmagan boʻlsa raqam koʻrsatiladi — toʻqilgan ism yozilmaydi.
    fullName: name && name.length > 0 ? name : formatPhone(input.phoneNumber),
    profession: input.profession,
    // Tajriba darajasi ustadan soʻralmaydi — hech kim tekshirmasdi.
    // `Master` tipi maydonni talab qiladi, shuning uchun eng past daraja.
    experienceLevel: 'NEW',
    hasGovCertificate: false,
    // `Master.ratingAvg` tipi `number`, shuning uchun bu yerda 0 turadi;
    // ekranda esa `masterRatingLabel` qorovuli yulduz oʻrniga matn chizadi.
    ratingAvg: input.stats.ratingAvg ?? 0,
    completedOrdersCount: input.stats.completedCount,
    isPremium: false,
    phoneNumber: input.phoneNumber.trim().length > 0 ? input.phoneNumber : null,
  };
}

/**
 * Yulduz oʻrniga chiziladigan matn yoki bahoning oʻzi.
 *
 * Qurilma egasi uchun raqam `stats` dan oʻqiladi (mock maydonlar emas);
 * katalogdagi usta uchun esa bajarilgan ish soni nol boʻlsa baho koʻrsatilmaydi.
 */
export function masterRatingLabel(
  master: Pick<Master, 'id' | 'ratingAvg' | 'completedOrdersCount'>,
  stats: MasterJobStats | null,
): string {
  if (isSelfMaster(master)) {
    return stats && stats.ratingAvg !== null ? formatRating(stats.ratingAvg) : NO_RATING_LABEL;
  }
  return master.completedOrdersCount === 0 ? NO_RATING_LABEL : formatRating(master.ratingAvg);
}
