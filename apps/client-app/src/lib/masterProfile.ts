import { formatPhone } from './formatters';
import type { SupportChannelEvent } from './support';

/**
 * Usta profili — foydalanuvchining OʻZI haqidagi maʼlumot.
 *
 * Bu mijoz koʻradigan `Master` EMAS. `Master` katalogdan keladi va uning
 * reytingi, bajarilgan ishlar soni va sertifikat belgisi platforma tomonidan
 * tasdiqlangan deb koʻrsatiladi. Bu yerdagi hamma narsa esa OʻZI AYTGAN.
 *
 * 2026-09-22 dan profil QISQARDI. Platforma faqat santexnikaga xizmat
 * qiladi, shuning uchun:
 *   — kasb soʻralmaydi: hamma usta santexnik;
 *   — tajriba darajasi va sertifikat soʻralmaydi: ularni hech kim
 *     tekshirmaydi, yaʼni soʻrash odamni behuda ushlab turish edi;
 *   — tuman soʻralmaydi: ish hozircha faqat Namangan shahrida;
 *   — ish vaqti soʻralmaydi: uning oʻrnini smena tugmasi bosadi —
 *     u yolgʻon gapirmaydi, chunki ustaning oʻzi bosadi.
 * Usta NIMA QILA OLISHINI xizmatlar roʻyxatida yoqadi/oʻchiradi
 * (`masterServices.ts`), profil esa faqat ixtiyoriy tanishtiruvdan iborat.
 */
export interface MasterProfile {
  /** Ixtiyoriy tanishtiruv. Boʻsh boʻlishi — normal holat. */
  about: string;
  /**
   * "Ishga tayyorman" — faqat shu qurilmada saqlanadi.
   */
  isAvailable: boolean;
  /**
   * Smena qachon ochilgani. `isAvailable === false` boʻlsa DOIM `null` —
   * yopiq smenaning davomiyligi degan narsa yoʻq.
   */
  availableSince: Date | null;
  updatedAt: Date | null;
}

export interface ApplicationRecord {
  message: string;
  createdAt: Date;
  /** Foydalanuvchi ochgan kanallar, eng eskisi birinchi. */
  openedChannels: SupportChannelEvent[];
}

export const EMPTY_MASTER_PROFILE: MasterProfile = {
  about: '',
  isAvailable: false,
  availableSince: null,
  updatedAt: null,
};

/**
 * Platformadagi yagona soha. Mijozga koʻrsatiladigan yozuvda ham shu turadi —
 * ustadan soʻralmaydi, chunki javobi bitta.
 */
export const MASTER_PROFESSION = 'Santexnik';

export const ABOUT_MIN = 20;
export const ABOUT_MAX = 500;

/**
 * «Oʻzim haqimda» dagi xato; `null` — muammo yoʻq.
 *
 * Boʻsh matn XATO EMAS: maydon ixtiyoriy. Lekin yarim yozilgani xato —
 * «shu» degan tanishtiruv mijozga hech narsa bermaydi.
 */
export function aboutHint(about: string): string | null {
  const length = about.trim().length;
  if (length === 0) return null;
  if (length < ABOUT_MIN) return `Kamida ${ABOUT_MIN} belgi — hozir ${length} ta`;
  if (length > ABOUT_MAX) return `Koʻpi bilan ${ABOUT_MAX} belgi`;
  return null;
}

/** Profilda tuzatilishi kerak joy bormi. Boʻsh profil ham toʻgʻri profil. */
export const isMasterProfileValid = (profile: MasterProfile): boolean =>
  aboutHint(profile.about) === null;

export interface ApplicationInput {
  profile: MasterProfile;
  fullName: string | null;
  phoneNumber: string;
}

/**
 * Tekshiruvga yuboriladigan ariza matni — server ulanmagan holatdagi
 * zaxira yoʻl (foydalanuvchi matnni oʻzi yuboradi).
 *
 * Faqat foydalanuvchi kiritgan maʼlumot. Ariza raqami, holat, muddat yoʻq —
 * ular boʻlmagan jarayonni bor qilib koʻrsatardi.
 *
 * Funksiya determinik: `Date.now()` ham, tasodif ham ishlatilmaydi.
 */
export function buildApplicationMessage(input: ApplicationInput): string {
  const { profile, fullName, phoneNumber } = input;

  const lines = ['Hizmat24 — usta boʻlish uchun ariza', ''];

  if (fullName?.trim()) lines.push(`Ism: ${fullName.trim()}`);
  if (phoneNumber.trim()) lines.push(`Telefon: ${formatPhone(phoneNumber)}`);
  lines.push(`Soha: ${MASTER_PROFESSION}`);

  const about = profile.about.trim();
  if (about) lines.push('', 'Oʻzim haqimda:', about);

  return lines.join('\n');
}
