import { OrderStatus, SafetyAlertStatus } from '@prisma/client';
import { MAX_ASSIGNMENT_ATTEMPTS } from '@shared/index';

/**
 * Operator paneli qoidalari — SOF mantiq (A3, A4).
 *
 * «Qaysi buyurtma eskalatsiyada», «qaysi amal mumkin» degan savollar
 * bitta joyda turadi va test bilan yopiladi. Servis faqat baza bilan
 * ishlaydi.
 */

/** Qidiruv davom etayotgan holatlar — bu yerda usta hali yoʻq. */
export const SEARCHING_STATUSES: readonly OrderStatus[] = [
  OrderStatus.SEARCHING,
  OrderStatus.SEARCHING_QUEUED,
];

/** Operator aralashuvi mumkin boʻlgan holatlar. */
export const LIVE_STATUSES: readonly OrderStatus[] = [
  ...SEARCHING_STATUSES,
  OrderStatus.ASSIGNED,
  OrderStatus.MASTER_EN_ROUTE,
  OrderStatus.ARRIVED_PENDING_CONFIRMATION,
  OrderStatus.IN_PROGRESS,
];

export interface OrderSnapshot {
  readonly status: OrderStatus;
  readonly assignmentAttempts: number;
}

/**
 * Buyurtma eskalatsiyadami.
 *
 * Alohida ustun YOʻQ va kerak emas: eskalatsiya — hisoblanadigan holat
 * («qidiruv davom etyapti va urinishlar tugagan»). Ustun qoʻshilsa, u
 * haqiqat bilan ajralib qolishi mumkin edi — masalan usta topilib,
 * bayroq oʻchirilmasdan qolsa.
 */
export const isEscalated = (order: OrderSnapshot): boolean =>
  SEARCHING_STATUSES.includes(order.status) && order.assignmentAttempts >= MAX_ASSIGNMENT_ATTEMPTS;

/**
 * Qayta qidiruvga qoʻyish mumkinmi; `null` — mumkin.
 *
 * Faqat qidiruvda qotib qolgan buyurtma qayta yuboriladi. Ustasi bor
 * buyurtmani qidiruvga qaytarish — ustani ishdan ayirish va mijozni
 * chalgʻitish demakdir; buning uchun alohida qaror kerak.
 */
export function requeueProblem(order: OrderSnapshot): string | null {
  if (!SEARCHING_STATUSES.includes(order.status)) {
    return 'Qayta qidiruv faqat usta topilmagan buyurtmada mumkin.';
  }
  return null;
}

/**
 * Operator bekor qila oladimi; `null` — mumkin.
 *
 * Xavfsizlik bayrogʻi alohida aytiladi: «allaqachon yopilgan» degan
 * umumiy jumla bu yerda notoʻgʻri boʻlardi — buyurtma yopilmagan,
 * unga ATAYLAB tegilmaydi.
 */
export function adminCancelProblem(order: OrderSnapshot): string | null {
  if (order.status === OrderStatus.SAFETY_FLAGGED) {
    return 'Xavfsizlik signali qoʻyilgan buyurtma oʻzgartirilmaydi — hodisa tarixda oʻz holicha qoladi.';
  }
  if (!LIVE_STATUSES.includes(order.status)) {
    return 'Bu buyurtma allaqachon yopilgan — bekor qilinmaydi.';
  }
  return null;
}

/** Signalni yopish mumkinmi; `null` — mumkin. */
export function resolveProblem(status: SafetyAlertStatus): string | null {
  return status === SafetyAlertStatus.RESOLVED ? 'Bu signal allaqachon yopilgan.' : null;
}

/**
 * Qaror ustani bloklashni talab qiladimi.
 *
 * Bloklash AVTOMATIK emas: operator tugmani alohida bosadi. Bu funksiya
 * faqat panelga «bloklash taklif qilinadi» deb aytadi — qaror odamniki.
 */
export const suggestsBlock = (resolution: string): boolean => resolution === 'CONFIRMED';
