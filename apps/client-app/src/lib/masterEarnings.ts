/**
 * Ustaning puli — sof funksiyalar. React YOʻQ, `new Date()` YOʻQ.
 *
 * Bu yerdagi HAR BIR raqam shu qurilmadagi yopilgan ishlarning muzlatilgan
 * `invoice.total` idan chiqadi. `MASTERS` mockidan bironta qiymat
 * oʻqilmaydi va narx `basePrice` dan qayta hisoblanmaydi: chekda turgan
 * summa bilan Daromaddagi summa bir-biriga mos boʻlishi shart.
 *
 * KOMISSIYA FOIZI YOʻQ (TZ 0.3). Egasi foizni aytmagan, demak sof daromad
 * hisoblanmaydi va ekranda «balans», «qarz», «pul yechish» degan soʻz
 * boʻlmaydi. Foiz belgilangan kunda faqat shu fayldagi konstanta oʻzgaradi.
 */
import type { LiveOrder } from '@/app/types';
import { isMasterOwned } from './masterJobs';
import { ORDER_STATUS } from './orderStateMachine';
import { percentOf } from './wallet';

/** `null` — foiz hali belgilanmagan. Raqam qoʻyilgach ekranlar oʻzi toʻldiradi. */
export const MASTER_COMMISSION_PERCENT: number | null = null;

export const COLLECTED_OVERLINE = 'Naqd qoʻlga olingan';

export const COLLECTED_BANNER =
  'Bu — mijozlar sizga naqd bergan summa. Ilova pulni saqlamaydi va oʻtkazmaydi. Platforma komissiyasi foizi hali belgilanmagan, shuning uchun sof daromad hisoblanmaydi.';

export const COMMISSION_ROW_HINT = 'Hali belgilanmagan';

/**
 * Roʻyxat NIMANI oʻz ichiga olishini aytadi.
 *
 * Server oxirgi ishlarni beradi — eski tarix hali sahifalanmaydi, va
 * buni yashirmaslik kerak: usta oʻz daromadini toʻliq deb oʻylab,
 * kamaygan summadan hayron boʻlardi.
 */
export const HISTORY_SOURCE_CAPTION =
  'Roʻyxatda faqat siz qabul qilgan ishlar bor. Hozircha oxirgi ishlar koʻrsatiladi — eski tarix keyingi yangilanishda qoʻshiladi.';

export type EarningsOrder = Pick<
  LiveOrder,
  'id' | 'status' | 'handledByMaster' | 'masterBucket' | 'invoice' | 'completedAt' | 'createdAt' | 'rating'
>;

/**
 * Daromadga kiradigan ish: usta oʻzi olgan VA mijoz baho berib yopgan.
 *
 * `COMPLETED_BY_MASTER` sanalmaydi — mijoz hali baho bermagan va buyurtma
 * yopilmagan; uni qoʻshsak raqam bir kunda ikki marta oʻzgarardi.
 */
export const isEarningOrder = (
  order: Pick<EarningsOrder, 'id' | 'status' | 'handledByMaster' | 'masterBucket'>,
): boolean => isMasterOwned(order) && order.status === ORDER_STATUS.CLOSED;

/** Toʻlov sanasi: yakunlangan vaqt, boʻlmasa yaratilgan vaqt. */
const paidAtOf = (order: EarningsOrder): Date => order.completedAt ?? order.createdAt;

export interface MasterMonthBar {
  monthStart: Date;
  amount: number;
  count: number;
  /** Eng katta oyga nisbatan ulush, 0…100. */
  percent: number;
}

const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/** Oxirgi bir necha oy — ESKIDAN YANGIGA (hamyondagi `monthlySeries` qoidasi). */
export function masterMonthlySeries(
  orders: readonly EarningsOrder[],
  now: Date,
  months = 6,
): MasterMonthBar[] {
  const earned = orders.filter(isEarningOrder);
  const rows: MasterMonthBar[] = [];

  for (let back = months - 1; back >= 0; back -= 1) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const bucket = earned.filter((order) => isSameMonth(paidAtOf(order), monthStart));
    rows.push({
      monthStart,
      amount: bucket.reduce((sum, order) => sum + order.invoice.total, 0),
      count: bucket.length,
      percent: 0,
    });
  }

  const max = Math.max(...rows.map((row) => row.amount), 0);
  return rows.map((row) => ({ ...row, percent: percentOf(row.amount, max) }));
}

export interface MasterEarningsView {
  /** Naqd qoʻlga olingan jami summa. */
  totalEarned: number;
  completedCount: number;
  /** Baho qoʻyilmagan boʻlsa `null` — 0 EMAS. */
  ratingAvg: number | null;
  ratedCount: number;
  thisMonthEarned: number;
  thisMonthCount: number;
  months: MasterMonthBar[];
  /** Kamida ikkita oyda pul boʻlsa ustunlar maʼnoli. */
  hasTrend: boolean;
}

export function buildMasterEarnings(
  orders: readonly EarningsOrder[],
  now: Date,
  months = 6,
): MasterEarningsView {
  const earned = orders.filter(isEarningOrder);
  const stars = earned
    .map((order) => order.rating?.stars)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  const thisMonth = earned.filter((order) => isSameMonth(paidAtOf(order), now));
  const series = masterMonthlySeries(orders, now, months);

  return {
    totalEarned: earned.reduce((sum, order) => sum + order.invoice.total, 0),
    completedCount: earned.length,
    ratingAvg: stars.length === 0 ? null : stars.reduce((sum, value) => sum + value, 0) / stars.length,
    ratedCount: stars.length,
    thisMonthEarned: thisMonth.reduce((sum, order) => sum + order.invoice.total, 0),
    thisMonthCount: thisMonth.length,
    months: series,
    hasTrend: series.filter((row) => row.amount > 0).length >= 2,
  };
}

/** Hero ostidagi qator; ish yoʻq boʻlsa `null` — «0 ta ishdan» yozilmaydi. */
export function collectedCaption(view: Pick<MasterEarningsView, 'completedCount'>): string | null {
  return view.completedCount === 0
    ? null
    : `Shu qurilmada siz yakunlagan ${view.completedCount} ta ishdan.`;
}

/** Baho plitkasining izohi. */
export function ratingHint(view: Pick<MasterEarningsView, 'ratedCount'>): string {
  return view.ratedCount === 0 ? 'Hali baho yoʻq' : `${view.ratedCount} ta bahodan`;
}
