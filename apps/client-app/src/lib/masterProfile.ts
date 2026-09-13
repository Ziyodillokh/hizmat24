import type { ExperienceLevel } from '@/mocks/types';
import { formatPhone, formatTime } from './formatters';
import type { SupportChannelEvent } from './support';

/**
 * Usta profili — foydalanuvchining OʻZI haqidagi maʼlumot.
 *
 * Bu mijoz koʻradigan `Master` EMAS. `Master` katalogdan keladi va uning
 * reytingi, bajarilgan ishlar soni va sertifikat belgisi platforma tomonidan
 * tasdiqlangan deb koʻrsatiladi. Bu yerdagi hamma narsa esa OʻZI AYTGAN:
 * sertifikat ham, tajriba ham. Shuning uchun bu profil mijoz katalogiga
 * QOʻSHILMAYDI — u faqat tekshiruvga yuboriladigan ariza materiali.
 *
 * Tekshiruvni platforma bajaradi va u yoʻq. Ilova arizani TAYYORLAYDI,
 * foydalanuvchi uni haqiqiy kanal orqali yuboradi — murojaat bilan bir xil
 * naqsh (`dispute.ts`).
 */
export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface MasterProfile {
  profession: string | null;
  experienceLevel: ExperienceLevel | null;
  /**
   * Foydalanuvchi "sertifikatim bor" dedi. Bu TASDIQ emas — ekranlar buni
   * har doim "tasdiqlanmagan" deb yozadi.
   */
  claimsCertificate: boolean;
  about: string;
  districts: string[];
  /** Ish vaqti — soat (0–23). */
  workFrom: number;
  workTo: number;
  /**
   * "Ishga tayyorman" — faqat shu qurilmada saqlanadi. Backend yoʻq,
   * shuning uchun bu kalit hozircha hech kimga hech narsa yubormaydi va
   * ekran buni aytadi.
   */
  isAvailable: boolean;
  updatedAt: Date | null;
}

export interface ApplicationRecord {
  message: string;
  createdAt: Date;
  /** Foydalanuvchi ochgan kanallar, eng eskisi birinchi. */
  openedChannels: SupportChannelEvent[];
}

export const EMPTY_MASTER_PROFILE: MasterProfile = {
  profession: null,
  experienceLevel: null,
  claimsCertificate: false,
  about: '',
  districts: [],
  workFrom: 9,
  workTo: 18,
  isAvailable: false,
  updatedAt: null,
};

/**
 * Sohalar — mijoz katalogidagi ustalar bilan BIR XIL lugʻat.
 *
 * Test buni tekshiradi: katalogda bu roʻyxatda yoʻq soha paydo boʻlsa,
 * ikki tomon bir-birini tushunmay qoladi.
 */
export const MASTER_PROFESSIONS: readonly string[] = [
  'Santexnik',
  'Elektrik',
  'Gaz ustasi',
  'Duradgor',
  'Boʻyoqchi',
  'Texnika ustasi',
  'Tozalash ustasi',
];

/** Toshkent shahrining 12 tumani. */
export const TASHKENT_DISTRICTS: readonly string[] = [
  'Bektemir',
  'Chilonzor',
  'Mirobod',
  'Mirzo Ulugʻbek',
  'Olmazor',
  'Sergeli',
  'Shayxontohur',
  'Uchtepa',
  'Yakkasaroy',
  'Yangihayot',
  'Yashnobod',
  'Yunusobod',
];

export const EXPERIENCE_LEVELS: readonly ExperienceLevel[] = ['NEW', 'EXPERIENCED'];

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  NEW: 'Yangi boshlayapman',
  EXPERIENCED: 'Tajribam bor',
};

export const EXPERIENCE_HINTS: Record<ExperienceLevel, string> = {
  NEW: '2 yildan kam yoki birinchi ish',
  EXPERIENCED: '2 yil va undan koʻp',
};

/** Ish boshlanishi uchun tanlanadigan soatlar. */
export const WORK_FROM_HOURS: readonly number[] = [6, 7, 8, 9, 10, 11];
/** Ish tugashi uchun tanlanadigan soatlar. */
export const WORK_TO_HOURS: readonly number[] = [16, 17, 18, 19, 20, 21, 22];

export const ABOUT_MIN = 20;
export const ABOUT_MAX = 500;
export const DISTRICTS_MAX = 5;

/** Soatni "09:00" shaklida beradi — `formatTime` bilan bir xil koʻrinish. */
export const formatHour = (hour: number): string => formatTime(new Date(2000, 0, 1, hour, 0));

export const formatWorkHours = (profile: Pick<MasterProfile, 'workFrom' | 'workTo'>): string =>
  `${formatHour(profile.workFrom)} — ${formatHour(profile.workTo)}`;

/*
 * Sozlash oqimi — BESH qadam. Har qadamning oʻz tekshiruvi bor va u
 * ekranda emas, shu yerda: settings ekrani ham, sozlash ham bir xil
 * qoidaga tayanadi.
 */
export const SETUP_STEPS = ['profession', 'experience', 'about', 'area', 'review'] as const;
export type SetupStep = (typeof SETUP_STEPS)[number];

export const SETUP_STEP_LABELS: Record<SetupStep, string> = {
  profession: 'Soha',
  experience: 'Tajriba',
  about: 'Oʻzingiz haqingizda',
  area: 'Hudud va vaqt',
  review: 'Tekshirish',
};

export const setupStepIndex = (step: SetupStep): number => SETUP_STEPS.indexOf(step);

/** Marshrutdan kelgan satrni qadamga aylantiradi; notoʻgʻri boʻlsa birinchisi. */
export function parseSetupStep(raw: string | null): SetupStep {
  return (SETUP_STEPS as readonly string[]).includes(raw ?? '') ? (raw as SetupStep) : 'profession';
}

/** Qadam nega oʻtib boʻlmasligi. `null` — hammasi joyida. */
export function setupStepHint(step: SetupStep, profile: MasterProfile): string | null {
  switch (step) {
    case 'profession':
      return profile.profession ? null : 'Sohani tanlang';
    case 'experience':
      return profile.experienceLevel ? null : 'Tajriba darajasini tanlang';
    case 'about': {
      const length = profile.about.trim().length;
      if (length === 0) return 'Oʻzingiz haqingizda yozing';
      if (length < ABOUT_MIN) return `Kamida ${ABOUT_MIN} belgi`;
      return null;
    }
    case 'area':
      if (profile.districts.length === 0) return 'Kamida bitta tumanni tanlang';
      if (profile.workTo <= profile.workFrom) return 'Ish tugashi boshlanishidan keyin boʻlishi kerak';
      return null;
    case 'review':
      return isMasterProfileComplete(profile) ? null : 'Avvalgi qadamlar toʻldirilmagan';
  }
}

export const canContinueSetupStep = (step: SetupStep, profile: MasterProfile): boolean =>
  setupStepHint(step, profile) === null;

/** Barcha majburiy qadamlar toʻldirilganmi. */
export function isMasterProfileComplete(profile: MasterProfile): boolean {
  return SETUP_STEPS.filter((step) => step !== 'review').every(
    (step) => setupStepHint(step, profile) === null,
  );
}

/** Birinchi toʻldirilmagan qadam — hub shu yerga yoʻnaltiradi. */
export function firstIncompleteStep(profile: MasterProfile): SetupStep {
  return SETUP_STEPS.find((step) => step !== 'review' && setupStepHint(step, profile) !== null) ?? 'review';
}

/** Toʻldirilgan majburiy qadamlar soni — hub koʻrsatkichi. */
export function completedStepCount(profile: MasterProfile): number {
  return SETUP_STEPS.filter((step) => step !== 'review' && setupStepHint(step, profile) === null)
    .length;
}

export const REQUIRED_STEP_COUNT = SETUP_STEPS.length - 1;

/** Tumanni qoʻshadi yoki olib tashlaydi; chegaraga yetganda qoʻshmaydi. YANGI massiv. */
export function toggleDistrict(districts: readonly string[], district: string): string[] {
  if (districts.includes(district)) return districts.filter((item) => item !== district);
  if (districts.length >= DISTRICTS_MAX) return [...districts];
  return [...districts, district];
}

export interface ApplicationInput {
  profile: MasterProfile;
  fullName: string | null;
  phoneNumber: string;
}

/**
 * Tekshiruvga yuboriladigan ariza matni.
 *
 * Faqat foydalanuvchi kiritgan maʼlumot. Ariza raqami, holat, muddat yoʻq —
 * ular boʻlmagan jarayonni bor qilib koʻrsatardi. Sertifikat "bor" deb
 * yozilsa ham, u OʻZI AYTGAN deb belgilanadi.
 *
 * Funksiya determinik: `Date.now()` ham, tasodif ham ishlatilmaydi.
 */
export function buildApplicationMessage(input: ApplicationInput): string {
  const { profile, fullName, phoneNumber } = input;

  const lines = ['Hizmat24 — usta boʻlish uchun ariza', ''];

  if (fullName?.trim()) lines.push(`Ism: ${fullName.trim()}`);
  if (phoneNumber.trim()) lines.push(`Telefon: ${formatPhone(phoneNumber)}`);

  lines.push(
    `Soha: ${profile.profession ?? '—'}`,
    `Tajriba: ${profile.experienceLevel ? EXPERIENCE_LABELS[profile.experienceLevel] : '—'}`,
    `Davlat sertifikati: ${profile.claimsCertificate ? 'bor (oʻzim aytdim, hali tekshirilmagan)' : 'yoʻq'}`,
    `Tumanlar: ${profile.districts.length > 0 ? profile.districts.join(', ') : '—'}`,
    `Ish vaqti: ${formatWorkHours(profile)}`,
    '',
    'Oʻzim haqimda:',
    profile.about.trim(),
  );

  return lines.join('\n');
}
