/**
 * Foydalanuvchilar boʻlimining sof qoidalari (A5).
 *
 * Eng muhimi — PII: panelga kirgan odam minglab telefon raqamini
 * koʻchirib ololmasligi kerak. Roʻyxatda raqam MASKALANGAN turadi,
 * toʻliq koʻrish esa alohida amal va u iz qoldiradi.
 */

/**
 * Telefon raqamini maskalash: `+998 90 *** ** 67`.
 *
 * Boshi va oxiri ochiq qoldiriladi — operator qaysi raqam ekanini
 * taniy olishi kerak, lekin uni yozib olisha olmasin. Tanib boʻlmaydigan
 * mask («+998 ** *** ** **») qoʻllab-quvvatlash ishini imkonsiz qilardi.
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return '***';

  const country = digits.slice(0, 3);
  const operator = digits.slice(3, 5);
  const tail = digits.slice(-2);

  return `+${country} ${operator} *** ** ${tail}`;
}

/** Bloklash/blokdan chiqarish sababi — server DTO si bilan bir xil chegara. */
export const BLOCK_REASON_MIN = 10;
export const BLOCK_REASON_MAX = 500;

/**
 * Holat oʻzgarishi maʼnolimi; `null` — mumkin.
 *
 * Bir xil holatga qayta oʻtkazish audit logni maʼnosiz yozuvlar bilan
 * toʻldirardi va «kim qachon blokladi» degan savolni chalkashtirardi.
 */
export function blockProblem(isCurrentlyBlocked: boolean, wantBlocked: boolean): string | null {
  if (isCurrentlyBlocked === wantBlocked) {
    return wantBlocked ? 'Allaqachon bloklangan.' : 'Allaqachon faol.';
  }
  return null;
}

export interface MasterStats {
  readonly completedOrdersCount: number;
  readonly cancelledByMasterCount: number;
}

/**
 * Usta bekor qilgan ishlar ulushi (foiz).
 *
 * Maxraj — usta TEGGAN ishlar soni (bajarilgan + bekor qilgan), umumiy
 * buyurtmalar emas: aks holda koʻp ishlagan usta yaxshiroq koʻrinardi.
 * Ish boʻlmasa `null` — nol foiz «hech qachon bekor qilmagan» degan
 * maʼnoni berardi, holbuki u umuman ishlamagan.
 */
export function cancelRatePercent(stats: MasterStats): number | null {
  const total = stats.completedOrdersCount + stats.cancelledByMasterCount;
  if (total === 0) return null;
  return Math.round((stats.cancelledByMasterCount / total) * 100);
}
