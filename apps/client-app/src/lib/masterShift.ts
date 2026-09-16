import { formatDuration, formatTime } from './formatters';
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
  /** Smena ochilgan payt; yopiq smenada DOIM `null`. */
  availableSince: Date | null;
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

/**
 * Smena qancha vaqtdan beri ochiq (daqiqa).
 *
 * Yopiq smenada ham, boshlanish vaqti yoʻq yozuvda ham 0. Manfiy qiymat
 * qaytarilmaydi: qurilma soati orqaga surilsa «−7 daqiqa» chizilardi.
 */
export function shiftDurationMinutes(
  profile: Pick<ShiftProfile, 'isAvailable' | 'availableSince'>,
  now: Date,
): number {
  if (!profile.isAvailable || !profile.availableSince) return 0;
  const elapsedMs = now.getTime() - profile.availableSince.getTime();
  return elapsedMs <= 0 ? 0 : Math.floor(elapsedMs / 60_000);
}

/**
 * «09:14 dan beri · 2 soat 11 daqiqa».
 *
 * `null` — smena yopiq yoki boshlanish vaqti saqlanmagan: bunday holatda
 * qator UMUMAN chizilmaydi, taxminiy vaqt yozilmaydi.
 */
export function shiftSinceLine(
  profile: Pick<ShiftProfile, 'isAvailable' | 'availableSince'>,
  now: Date,
): string | null {
  if (!profile.isAvailable || !profile.availableSince) return null;
  const minutes = shiftDurationMinutes(profile, now);
  return `${formatTime(profile.availableSince)} dan beri · ${formatDuration(minutes)}`;
}
