import { ALL_CATEGORIES, findGroup } from '@/mocks/serviceGroups';
import { ORDER_STATUS } from './orderStateMachine';
import { MONEY_STEP } from './pricing';
import type { LiveOrder, PaymentMethod, WalletTransaction } from '@/app/types';

/**
 * "Karta" boʻlimining hisob-kitoblari.
 *
 * Bu yerda REACT YOʻQ va `new Date()` CHAQIRILMAYDI: joriy vaqt har doim
 * parametr sifatida keladi. Shu tufayli har bir formula testda barqaror
 * tekshiriladi — `formatters.ts` dagi `orderDateGroup(date, now)` bilan
 * bir xil qoida.
 */

/** Daraja — YAKUNLANGAN buyurtma soniga bogʻliq, sarflangan pulga emas. */
export type LevelKey = 'bronze' | 'silver' | 'gold';

export interface Level {
  key: LevelKey;
  /** Interfeysda inglizcha soʻz yozilmaydi (14.6-band, 39-punkt). */
  label: string;
  /** Shu darajaga kirish uchun kerak boʻlgan eng kam buyurtma soni. */
  minOrders: number;
  /** Platforma komissiyasidan beriladigan chegirma. */
  discountPercent: number;
}

/**
 * Chegaralar demodan: 1-9 · 10-29 · 30+.
 *
 * Birinchi darajaning chegarasi 0: buyurtmasi yoʻq foydalanuvchi ham
 * darajasiz qolmaydi, roʻyxatda esa u "1-9 ta buyurtma" deb koʻrsatiladi.
 */
export const LEVELS: readonly Level[] = [
  { key: 'bronze', label: 'Bronza', minOrders: 0, discountPercent: 2 },
  { key: 'silver', label: 'Kumush', minOrders: 10, discountPercent: 4 },
  { key: 'gold', label: 'Oltin', minOrders: 30, discountPercent: 6 },
];

/** Bitta cashback blokidagi buyurtmalar soni. */
export const CASHBACK_BLOCK = 10;

/** Blok toʻlganda qaytariladigan ulush. */
export const CASHBACK_PERCENT = 1;

/**
 * Toʻlov usuli nomlari.
 *
 * `escrow` — "Kafolatli toʻlov": ilova boshqa hamma joyda aynan shu soʻzni
 * ishlatadi (kirish ekrani, tanishtiruv, AI yordamchi). Ikkinchi atama
 * kiritilsa foydalanuvchi ularni ikki xil xizmat deb oʻylardi.
 */
export const METHOD_LABELS: Record<PaymentMethod, string> = {
  escrow: 'Kafolatli toʻlov',
  cash: 'Naqd',
  card: 'Bank kartasi',
};

/** Filtr va chip uchun qisqa shakl — 360px ekranda sigʻishi shart. */
export const METHOD_SHORT_LABELS: Record<PaymentMethod, string> = {
  escrow: 'Kafolatli',
  cash: 'Naqd',
  card: 'Karta',
};

/** Nolga boʻlish HAMMA joyda shu yerda toʻxtaydi. */
export const percentOf = (part: number, total: number): number =>
  total > 0 ? (part * 100) / total : 0;

const sumOf = (transactions: readonly WalletTransaction[]): number =>
  transactions.reduce((total, item) => total + item.amount, 0);

const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

/**
 * Yakunlangan buyurtmani tranzaksiyaga aylantiradi.
 *
 * Faqat `CLOSED`: `COMPLETED_BY_MASTER` da mijoz hali baholamagan va escrow
 * ochilmagan, `CANCELLED`/`SAFETY_FLAGGED` da esa pul umuman toʻlanmagan.
 *
 * Summa — buyurtma yaratilganda MUZLATILGAN hisob-fakturadan olinadi.
 * Daraja keyin koʻtarilsa ham oʻtmishdagi chek, oylik statistika va
 * yigʻilgan keshbek oʻzgarmaydi.
 */
export function orderToTransaction(order: LiveOrder): WalletTransaction | null {
  if (order.status !== ORDER_STATUS.CLOSED) return null;

  const category = ALL_CATEGORIES.find((item) => item.id === order.categoryId);

  return {
    id: order.id,
    orderId: order.id,
    shortId: order.shortId,
    categoryName: order.categoryName,
    categoryIconKey: order.categoryIconKey,
    // Nomaʼlum kategoriya tashlab yuborilmaydi: pulni jamidan yoʻqotish
    // notoʻgʻri guruhga qoʻyishdan yomonroq.
    groupId: category?.groupId ?? 'g-other',
    groupName: category?.groupName ?? 'Boshqa',
    masterName: order.master?.fullName ?? null,
    amount: Math.max(0, Math.round(order.invoice.total)),
    method: order.paymentMethod,
    paidAt: order.completedAt ?? order.createdAt,
  };
}

/**
 * Mock va haqiqiy tranzaksiyalarni birlashtiradi.
 *
 * Haqiqiy yozuv ustuvor: bir xil buyurtma ikkala roʻyxatda boʻlsa, mock
 * nusxasi tashlab yuboriladi. Tartib — yangisi tepada; teng vaqtda `id`
 * boʻyicha, aks holda React kalitlari sakraydi.
 */
export function mergeTransactions(
  mock: readonly WalletTransaction[],
  live: readonly WalletTransaction[],
): WalletTransaction[] {
  const liveKeys = new Set(live.map((item) => item.orderId ?? item.id));
  const kept = mock.filter((item) => !liveKeys.has(item.orderId ?? item.id));

  return [...live, ...kept].sort(
    (a, b) => b.paidAt.getTime() - a.paidAt.getTime() || a.id.localeCompare(b.id),
  );
}

export interface Breakdown {
  key: string;
  label: string;
  /** Soha uchun ikona kaliti; toʻlov usulida boʻsh. */
  iconKey: string;
  amount: number;
  count: number;
  /** Butun foiz; yigʻindisi aynan 100 boʻladi. */
  percent: number;
}

/**
 * Foizlarni ENG KATTA QOLDIQ usuli bilan yaxlitlaydi.
 *
 * Har qatorni alohida yaxlitlasak, uchta 33,3% ekranda 33+33+33=99% boʻlib
 * chiqadi va foydalanuvchi buni xato deb oʻqiydi.
 */
export function largestRemainder(values: readonly number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return values.map(() => 0);

  const raw = values.map((value) => (value * 100) / total);
  const floors = raw.map((value) => Math.floor(value));
  let rest = 100 - floors.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  const result = [...floors];
  for (const item of order) {
    if (rest <= 0) break;
    result[item.index] += 1;
    rest -= 1;
  }

  return result;
}

function breakdown(
  transactions: readonly WalletTransaction[],
  keyOf: (item: WalletTransaction) => string,
  labelOf: (item: WalletTransaction) => string,
  iconOf: (item: WalletTransaction) => string,
): Breakdown[] {
  const buckets = new Map<string, Breakdown>();

  for (const item of transactions) {
    const key = keyOf(item);
    const existing = buckets.get(key);

    if (existing) {
      buckets.set(key, {
        ...existing,
        amount: existing.amount + item.amount,
        count: existing.count + 1,
      });
      continue;
    }

    buckets.set(key, {
      key,
      label: labelOf(item),
      iconKey: iconOf(item),
      amount: item.amount,
      count: 1,
      percent: 0,
    });
  }

  // Summasi 0 boʻlgan qator chizilmaydi: u hech narsa aytmaydi, lekin
  // balandlikni yeydi va roʻyxat oxirida uzun nol dumini yasaydi.
  const rows = [...buckets.values()]
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount || a.label.localeCompare(b.label));

  const percents = largestRemainder(rows.map((row) => row.amount));

  return rows.map((row, index) => ({ ...row, percent: percents[index] }));
}

export const byGroup = (transactions: readonly WalletTransaction[]): Breakdown[] =>
  breakdown(
    transactions,
    (item) => item.groupId,
    (item) => item.groupName,
    // Qator GURUHni ifodalaydi, xizmatni emas: "Santexnika" qatori kran
    // ikonasi bilan chizilsa, u guruh emas, bitta xizmat kabi oʻqilardi.
    (item) => findGroup(item.groupId)?.iconKey ?? item.categoryIconKey,
  );

export const byMethod = (transactions: readonly WalletTransaction[]): Breakdown[] =>
  breakdown(
    transactions,
    (item) => item.method,
    (item) => METHOD_LABELS[item.method],
    () => '',
  );

/** Buyurtma soniga mos daraja — shartni qanoatlantiruvchi ENG YUQORISI. */
export function levelFor(orderCount: number): Level {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (orderCount >= level.minOrders) current = level;
  }
  return current;
}

/** Keyingi daraja; eng yuqorisida `null`. */
export const nextLevelFor = (orderCount: number): Level | null =>
  LEVELS.find((level) => level.minOrders > orderCount) ?? null;

export interface CashbackProgress {
  /** Joriy blokda toʻlgan katakchalar: 0…10. */
  filled: number;
  /** Blok toʻlishiga qolgan buyurtmalar. */
  remaining: number;
  /** Joriy blokda toʻlangan summa. */
  blockPaid: number;
  /** Joriy blok toʻlganda qaytariladigan summa. */
  pending: number;
  /** Toʻlgan bloklardan yigʻilgan summa. */
  earned: number;
}

/**
 * Cashback — demodagi "shtamp kartasi" mexanikasi.
 *
 * Har 10 buyurtma bitta blok; blok toʻlganda shu blokda toʻlangan summaning
 * 1% i qaytariladi. Stavka oʻsmaydi — demo aynan shunday ishlaydi va
 * oʻsuvchi stavka oʻtmishdagi summalarni ham qayta hisoblab, hisobni
 * "sakragan" qilib koʻrsatardi.
 */
export function cashbackFor(transactions: readonly WalletTransaction[]): CashbackProgress {
  const chronological = [...transactions].sort(
    (a, b) => a.paidAt.getTime() - b.paidAt.getTime(),
  );

  const count = chronological.length;
  const completedBlocks = Math.floor(count / CASHBACK_BLOCK);

  let earned = 0;
  for (let block = 0; block < completedBlocks; block += 1) {
    const slice = chronological.slice(block * CASHBACK_BLOCK, (block + 1) * CASHBACK_BLOCK);
    earned += roundCashback(sumOf(slice));
  }

  const filled = count === 0 ? 0 : ((count - 1) % CASHBACK_BLOCK) + 1;
  const blockPaid = sumOf(chronological.slice(count - filled));

  // Blok TOʻLGAN boʻlsa uning cashbacki allaqachon `earned` ichida. Bu yerda
  // yana `pending` berilsa, aynan 10- va 20-buyurtmada bitta summa ekranda
  // ikki marta koʻrinardi.
  const isBlockComplete = count > 0 && count % CASHBACK_BLOCK === 0;

  return {
    filled,
    remaining: CASHBACK_BLOCK - filled,
    blockPaid,
    pending: isBlockComplete ? 0 : roundCashback(blockPaid),
    earned,
  };
}

const roundCashback = (amount: number): number =>
  Math.round((amount * CASHBACK_PERCENT) / 100 / MONEY_STEP) * MONEY_STEP;

export interface MonthBar {
  /** Oyning 1-sanasi — sarlavha va aria-label shu sanadan yasaladi. */
  monthStart: Date;
  amount: number;
  count: number;
  /** Eng katta oyga nisbatan ulush, 0…100. */
  percent: number;
}

/** Oxirgi bir necha oy — ESKIDAN YANGIGA. */
export function monthlySeries(
  transactions: readonly WalletTransaction[],
  now: Date,
  months = 6,
): MonthBar[] {
  const rows: MonthBar[] = [];

  for (let back = months - 1; back >= 0; back -= 1) {
    // `new Date(y, m - back, 1)` yil chegarasini oʻzi normallashtiradi:
    // yanvarda back=2 → oʻtgan yilning noyabri.
    const monthStart = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const bucket = transactions.filter((item) => isSameMonth(item.paidAt, monthStart));
    rows.push({ monthStart, amount: sumOf(bucket), count: bucket.length, percent: 0 });
  }

  const max = Math.max(...rows.map((row) => row.amount), 0);
  return rows.map((row) => ({ ...row, percent: percentOf(row.amount, max) }));
}

export interface WalletView {
  /** Butun tarix — tarix sahifasi shundan oziqlanadi. */
  transactions: WalletTransaction[];
  /** Shu oydagi toʻlovlar — taqsimotlar aynan shundan hisoblanadi. */
  monthTransactions: WalletTransaction[];
  /** Roʻyxat boʻsh boʻlsa ekran nollar panjarasini emas, boʻsh holat chizadi. */
  hasHistory: boolean;
  spentThisMonth: number;
  ordersThisMonth: number;
  spentTotal: number;
  ordersTotal: number;
  groups: Breakdown[];
  methods: Breakdown[];
  months: MonthBar[];
  /** Kamida ikkita oyda toʻlov boʻlsa dinamika bloki maʼnoli. */
  hasTrend: boolean;
  level: Level;
  nextLevel: Level | null;
  /** Keyingi darajagacha qolgan buyurtmalar; eng yuqorisida 0. */
  ordersToNextLevel: number;
  /** Joriy daraja ichidagi progress, 0…100. */
  levelPercent: number;
  cashback: CashbackProgress;
}

/** Uchala ekran shu bitta koʻrinish modelidan oziqlanadi. */
export function buildWalletView(
  mock: readonly WalletTransaction[],
  orders: readonly LiveOrder[],
  now: Date,
): WalletView {
  const live = orders
    .map(orderToTransaction)
    .filter((item): item is WalletTransaction => item !== null);

  const transactions = mergeTransactions(mock, live);
  const monthTransactions = transactions.filter((item) => isSameMonth(item.paidAt, now));

  const ordersTotal = transactions.length;
  const level = levelFor(ordersTotal);
  const nextLevel = nextLevelFor(ordersTotal);
  const months = monthlySeries(transactions, now);

  return {
    transactions,
    monthTransactions,
    hasHistory: ordersTotal > 0,
    spentThisMonth: sumOf(monthTransactions),
    ordersThisMonth: monthTransactions.length,
    spentTotal: sumOf(transactions),
    ordersTotal,
    // Taqsimot SHU OY boʻyicha: tepadagi katta raqam ham shu oydan keladi va
    // ikkovi bir-biriga mos tushishi shart. Butun tarix — "Oxirgi 6 oy"
    // blokida va tarix sahifasida.
    groups: byGroup(monthTransactions),
    methods: byMethod(monthTransactions),
    months,
    hasTrend: months.filter((row) => row.amount > 0).length >= 2,
    level,
    nextLevel,
    ordersToNextLevel: nextLevel ? nextLevel.minOrders - ordersTotal : 0,
    levelPercent: nextLevel
      ? percentOf(ordersTotal - level.minOrders, nextLevel.minOrders - level.minOrders)
      : 100,
    cashback: cashbackFor(transactions),
  };
}
