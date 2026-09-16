import { formatWorkHours, type MasterProfile } from './masterProfile';

/**
 * Smena — ustaning «hozir ish qabul qilaman» holati.
 *
 * Matnlar shu yerda, ekranda emas (11-qoida): smena bloki ikki joyda
 * (Ishlar ekrani va kelgusida bildirishnoma) bir xil gapirishi kerak.
 *
 * Smena FAQAT shu qurilmada saqlanadi — server yoʻq. Shuning uchun hech bir
 * matn «sizni qidiruvda koʻrsatamiz» yoki «xabar yuboramiz» demaydi.
 */
export interface ShiftProfile {
  isAvailable: boolean;
  workFrom: number;
  workTo: number;
  profession: MasterProfile['profession'];
}

/** Holat sarlavhasi — ochiq/yopiq. */
export const shiftStateLine = (profile: Pick<ShiftProfile, 'isAvailable'>): string =>
  profile.isAvailable ? 'Smenadasiz' : 'Smena yopiq';

/** Tugma yorligʻi — amalni aytadi, natijani emas. */
export const shiftActionLabel = (profile: Pick<ShiftProfile, 'isAvailable'>): string =>
  profile.isAvailable ? 'Smenani yakunlash' : 'Smenani boshlash';

/** Ish vaqti qatori — profil qadamida kiritilgan soatlar. */
export const shiftHoursLine = (profile: Pick<ShiftProfile, 'workFrom' | 'workTo'>): string =>
  `Ish vaqtingiz: ${formatWorkHours(profile)}`;

/**
 * Ish vaqti oynasi. `workFrom === workTo` — sutkalik ish deb qaraladi.
 * Yarim tunni kesib oʻtgan oyna (22 — 06) ham toʻgʻri hisoblanadi.
 */
export function isWithinWorkHours(
  profile: Pick<ShiftProfile, 'workFrom' | 'workTo'>,
  now: Date,
): boolean {
  const hour = now.getHours();
  const { workFrom, workTo } = profile;
  if (workFrom === workTo) return true;
  return workFrom < workTo ? hour >= workFrom && hour < workTo : hour >= workFrom || hour < workTo;
}

/**
 * Qoʻshimcha izoh qatori. Ochiq smena ish vaqtidan tashqarida boʻlsa — buni
 * aytadi; yopiq smenada nima boʻlishini tushuntiradi.
 */
export function shiftHintLine(
  profile: Pick<ShiftProfile, 'isAvailable' | 'workFrom' | 'workTo'>,
  now: Date,
): string | null {
  if (!profile.isAvailable) return null;
  return isWithinWorkHours(profile, now)
    ? null
    : 'Hozir ish vaqtingizdan tashqarisiz — smena baribir ochiq.';
}

/** Toʻliq boʻlmagan profil bilan smena ochilmaydi. */
export const canOpenShift = (isProfileComplete: boolean): boolean => isProfileComplete;
