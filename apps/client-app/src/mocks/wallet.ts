import { masterById } from './masters';
import { ALL_CATEGORIES } from './serviceGroups';
import type { PaymentMethod, WalletTransaction } from '@/app/types';

/**
 * Mock toʻlovlar — "Karta" boʻlimi uchun.
 *
 * MUTLAQ SANA YOZILMAYDI (`src/mocks/chats.ts` bilan bir xil qoida): qatʼiy
 * sana yozilsa, demo bir oydan keyin "tarix oʻlik" boʻlib koʻrinardi.
 *
 * Lekin bitta nisbiy oʻlchov yetmaydi — hamyon OYLAR boʻyicha guruhlanadi.
 * Hammasi kun boʻyicha berilsa, oy taqsimoti demo qachon ochilishiga qarab
 * shaklini oʻzgartiradi; hammasi oy boʻyicha berilsa, roʻyxat tepasida
 * hech qachon "Bugun" chiqmaydi. Shuning uchun ikki qatlam.
 */
/** Bir daqiqa — kelajakka tushgan urugʻlarni ajratish qadami. */
const MINUTE_MS = 60_000;

interface SeedBase {
  shortId: string;
  categoryId: string;
  masterId: string;
  amount: number;
  method: PaymentMethod;
  hour: number;
  minute: number;
}

/** Shu oy ichidagi toʻlovlar. */
interface RecentSeed extends SeedBase {
  daysAgo: number;
}

/** Oʻtgan oylardagi toʻlovlar. */
interface OlderSeed extends SeedBase {
  monthsAgo: number;
  /** 1-28: fevral ham sigʻsin. */
  dayOfMonth: number;
}

const RECENT: RecentSeed[] = [
  { shortId: 'HZ-104488', categoryId: 'c-tap', masterId: 'm-akmal', amount: 100_000, method: 'escrow', daysAgo: 0, hour: 11, minute: 20 },
  { shortId: 'HZ-104471', categoryId: 'c-socket', masterId: 'm-dilshod', amount: 80_000, method: 'cash', daysAgo: 1, hour: 16, minute: 45 },
  { shortId: 'HZ-104450', categoryId: 'c-ac', masterId: 'm-jahongir', amount: 420_000, method: 'escrow', daysAgo: 3, hour: 9, minute: 40 },
  { shortId: 'HZ-104432', categoryId: 'c-general', masterId: 'm-feruza', amount: 350_000, method: 'escrow', daysAgo: 5, hour: 14, minute: 20 },
  { shortId: 'HZ-104419', categoryId: 'c-drain', masterId: 'm-akmal', amount: 200_000, method: 'card', daysAgo: 6, hour: 17, minute: 5 },
];

const OLDER: OlderSeed[] = [
  { shortId: 'HZ-104390', categoryId: 'c-stove', masterId: 'm-sardor', amount: 350_000, method: 'escrow', monthsAgo: 1, dayOfMonth: 26, hour: 10, minute: 15 },
  { shortId: 'HZ-104371', categoryId: 'c-lamp', masterId: 'm-dilshod', amount: 130_000, method: 'cash', monthsAgo: 1, dayOfMonth: 22, hour: 13, minute: 0 },
  { shortId: 'HZ-104352', categoryId: 'c-washer', masterId: 'm-jahongir', amount: 150_000, method: 'escrow', monthsAgo: 1, dayOfMonth: 17, hour: 15, minute: 30 },
  { shortId: 'HZ-104337', categoryId: 'c-tap', masterId: 'm-akmal', amount: 110_000, method: 'escrow', monthsAgo: 1, dayOfMonth: 11, hour: 9, minute: 0 },
  { shortId: 'HZ-104318', categoryId: 'c-general', masterId: 'm-feruza', amount: 350_000, method: 'cash', monthsAgo: 1, dayOfMonth: 4, hour: 18, minute: 10 },
  { shortId: 'HZ-104296', categoryId: 'c-breaker', masterId: 'm-dilshod', amount: 150_000, method: 'escrow', monthsAgo: 2, dayOfMonth: 27, hour: 12, minute: 40 },
  { shortId: 'HZ-104274', categoryId: 'c-toilet', masterId: 'm-akmal', amount: 250_000, method: 'escrow', monthsAgo: 2, dayOfMonth: 19, hour: 16, minute: 0 },
  { shortId: 'HZ-104251', categoryId: 'c-boiler', masterId: 'm-sardor', amount: 500_000, method: 'card', monthsAgo: 2, dayOfMonth: 12, hour: 10, minute: 30 },
  { shortId: 'HZ-104233', categoryId: 'c-socket', masterId: 'm-dilshod', amount: 80_000, method: 'cash', monthsAgo: 2, dayOfMonth: 5, hour: 14, minute: 50 },
  { shortId: 'HZ-104186', categoryId: 'c-heating', masterId: 'm-akmal', amount: 900_000, method: 'escrow', monthsAgo: 3, dayOfMonth: 21, hour: 11, minute: 0 },
  { shortId: 'HZ-104142', categoryId: 'c-ac', masterId: 'm-jahongir', amount: 400_000, method: 'escrow', monthsAgo: 3, dayOfMonth: 9, hour: 15, minute: 20 },
];

/**
 * Urugʻni toʻliq yozuvga aylantiradi.
 *
 * Kategoriya nomi va ikonasi katalogdan olinadi — mock oʻzi nom toʻqimaydi,
 * aks holda soha taqsimoti katalogda mavjud boʻlmagan xizmatni koʻrsatib
 * qoʻyardi.
 */
function toTransaction(seed: SeedBase, paidAt: Date): WalletTransaction | null {
  const category = ALL_CATEGORIES.find((item) => item.id === seed.categoryId);
  if (!category) return null;

  return {
    id: seed.shortId,
    // Mock yozuv hech qanday jonli buyurtmaga bogʻlanmagan.
    orderId: null,
    shortId: seed.shortId,
    categoryName: category.name,
    categoryIconKey: category.iconKey,
    groupId: category.groupId,
    groupName: category.groupName,
    masterName: masterById(seed.masterId)?.fullName ?? null,
    amount: seed.amount,
    method: seed.method,
    paidAt,
  };
}

/**
 * Nisbiy urugʻlarni aniq sanaga aylantiradi.
 *
 * Ikki invariant:
 *  1. Yaqin toʻlovlar hech qachon oʻtgan oyga tushmaydi
 *     (`Math.min(daysAgo, bugungi sana − 1)`). Usiz oyning 1-sanasida
 *     "shu oyda sarflangan" boʻsh boʻlib qolar va sahifa buzuqdek
 *     koʻrinardi.
 *  2. Kelajakdagi toʻlov boʻlmaydi (`Math.min(sana, anchor)`). Usiz
 *     "shu haftada" summasi "shu oyda" dan katta chiqib qolishi mumkin.
 */
export function materializeTransactions(anchor: number): WalletTransaction[] {
  const at = new Date(anchor);
  const year = at.getFullYear();
  const month = at.getMonth();

  /*
   * Kelajakdagi toʻlov boʻlmaydi. `index` bilan bir daqiqalik siljish:
   * oyning 1-sanasida bir necha urugʻ bitta kunga tushadi va soatlari
   * kelajakda boʻlsa, hammasi AYNAN bir vaqtga yopishib qolardi — tarixda
   * bu buzilgan maʼlumotdek koʻrinadi.
   */
  const clamp = (date: Date, index: number): Date =>
    new Date(Math.min(date.getTime(), anchor - index * MINUTE_MS));

  const recent = RECENT.map((seed, index) => {
    const days = Math.min(seed.daysAgo, at.getDate() - 1);
    return toTransaction(
      seed,
      clamp(new Date(year, month, at.getDate() - days, seed.hour, seed.minute), index),
    );
  });

  const older = OLDER.map((seed, index) =>
    toTransaction(
      seed,
      clamp(
        new Date(year, month - seed.monthsAgo, Math.min(seed.dayOfMonth, 28), seed.hour, seed.minute),
        RECENT.length + index,
      ),
    ),
  );

  return [...recent, ...older].filter(
    (item): item is WalletTransaction => item !== null,
  );
}

/**
 * Ilova yuklanganda BIR MARTA hisoblanadi.
 *
 * Har renderda qayta yaratilsa, roʻyxat qayta saralanib qatorlar sekin
 * siljib turardi.
 */
export const MOCK_TRANSACTIONS = materializeTransactions(Date.now());
