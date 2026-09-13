import {
  ABOUT_MAX,
  DISTRICTS_MAX,
  EMPTY_MASTER_PROFILE,
  MASTER_PROFESSIONS,
  TASHKENT_DISTRICTS,
  type ApplicationRecord,
  type MasterProfile,
} from '@/lib/masterProfile';

/**
 * Usta profili va arizasini qurilmada saqlash.
 *
 * `reviveMasterState` va `serializeMasterState` SOF funksiya sifatida
 * eksport qilinadi — test muhitida `localStorage` yoʻq, ariza esa
 * foydalanuvchi qoʻldan yozgan matn va uning tiklanishi test bilan
 * qoplanishi shart.
 */
const STORAGE_KEY = 'hizmat24:master:v1';

export interface MasterState {
  profile: MasterProfile;
  application: ApplicationRecord | null;
}

interface StoredProfile {
  profession: string | null;
  experienceLevel: string | null;
  claimsCertificate: boolean;
  about: string;
  districts: string[];
  workFrom: number;
  workTo: number;
  isAvailable: boolean;
  updatedAt: string | null;
}

interface StoredApplication {
  message: string;
  createdAt: string;
  openedChannels: { channel: string; openedAt: string }[];
}

interface StoredMasterState {
  profile: StoredProfile;
  application: StoredApplication | null;
}

const reviveDate = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isHour = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23;

const isChannel = (value: unknown): value is 'telegram' | 'phone' =>
  value === 'telegram' || value === 'phone';

/**
 * Profil MAYDONMA-MAYDON tiklanadi: bitta buzuq maydon butun profilni
 * tashlamaydi — foydalanuvchi besh qadamni qayta toʻldirmasligi kerak.
 */
function reviveProfile(raw: unknown): MasterProfile {
  if (typeof raw !== 'object' || raw === null) return EMPTY_MASTER_PROFILE;
  const value = raw as Partial<StoredProfile>;

  // Lugʻatdan chiqib ketgan qiymat `null` ga tushadi — foydalanuvchi shu
  // qadamni qayta tanlaydi, boshqasini emas.
  const profession =
    typeof value.profession === 'string' && MASTER_PROFESSIONS.includes(value.profession)
      ? value.profession
      : null;
  const experienceLevel =
    value.experienceLevel === 'NEW' || value.experienceLevel === 'EXPERIENCED'
      ? value.experienceLevel
      : null;
  const districts = Array.isArray(value.districts)
    ? value.districts
        .filter((item): item is string => typeof item === 'string')
        .filter((item) => TASHKENT_DISTRICTS.includes(item))
        .slice(0, DISTRICTS_MAX)
    : [];

  return {
    profession,
    experienceLevel,
    claimsCertificate: value.claimsCertificate === true,
    about: typeof value.about === 'string' ? value.about.slice(0, ABOUT_MAX) : '',
    districts,
    workFrom: isHour(value.workFrom) ? value.workFrom : EMPTY_MASTER_PROFILE.workFrom,
    workTo: isHour(value.workTo) ? value.workTo : EMPTY_MASTER_PROFILE.workTo,
    isAvailable: value.isAvailable === true,
    updatedAt: reviveDate(value.updatedAt),
  };
}

function reviveApplication(raw: unknown): ApplicationRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const value = raw as Partial<StoredApplication>;
  const createdAt = reviveDate(value.createdAt);
  if (typeof value.message !== 'string' || value.message.length === 0 || !createdAt) return null;

  const openedChannels = Array.isArray(value.openedChannels)
    ? value.openedChannels.flatMap((item) => {
        if (typeof item !== 'object' || item === null) return [];
        const event = item as { channel?: unknown; openedAt?: unknown };
        const openedAt = reviveDate(event.openedAt);
        // Buzuq hodisa YOZUVNI tashlamaydi — faqat oʻzi tushib qoladi.
        return isChannel(event.channel) && openedAt ? [{ channel: event.channel, openedAt }] : [];
      })
    : [];

  return { message: value.message, createdAt, openedChannels };
}

/** SOF: saqlangan shakldan holatni tiklaydi. */
export function reviveMasterState(parsed: unknown): MasterState | null {
  if (typeof parsed !== 'object' || parsed === null) return null;
  const value = parsed as Partial<StoredMasterState>;
  return {
    profile: reviveProfile(value.profile),
    application: reviveApplication(value.application),
  };
}

/** SOF: holatni saqlanadigan shaklga oʻtkazadi. */
export function serializeMasterState(state: MasterState): StoredMasterState {
  return {
    profile: {
      ...state.profile,
      updatedAt: state.profile.updatedAt ? state.profile.updatedAt.toISOString() : null,
    },
    application: state.application
      ? {
          message: state.application.message,
          createdAt: state.application.createdAt.toISOString(),
          openedChannels: state.application.openedChannels.map((event) => ({
            channel: event.channel,
            openedAt: event.openedAt.toISOString(),
          })),
        }
      : null,
  };
}

export function loadMasterState(): MasterState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return reviveMasterState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveMasterState(state: MasterState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeMasterState(state)));
  } catch {
    // Xotira toʻlgan boʻlsa ham ilova ishlashda davom etadi.
  }
}

/** Chiqishda chaqiriladi: ariza — shaxsiy maʼlumot. */
export function clearMasterState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // eʼtiborsiz
  }
}
