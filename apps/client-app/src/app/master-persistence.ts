import {
  ABOUT_MAX,
  EMPTY_MASTER_PROFILE,
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
  /**
   * Usta rad etgan buyurtmalar.
   *
   * Yangi `localStorage` kaliti YOʻQ: alohida slice qoʻshimcha revive va test
   * yuki berardi, roʻyxat esa aynan usta holatiga tegishli.
   */
  declinedOrderIds: string[];
}

/** Rad etilganlar cheksiz oʻsmasin — eng yangisi saqlanadi. */
export const DECLINED_IDS_MAX = 200;

/*
 * Saqlangan shakl. Eski qurilmalarda bu yerda kasb, tajriba, tumanlar va
 * ish vaqti ham bor — ular oʻqilmaydi va jimgina tushib qoladi. Kalit
 * oʻzgartirilmadi: shu bilan smena holati va rad etilganlar roʻyxati
 * yangilanishdan keyin ham joyida qoladi.
 */
interface StoredProfile {
  about: string;
  isAvailable: boolean;
  availableSince: string | null;
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
  declinedOrderIds: string[];
}

const reviveDate = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isChannel = (value: unknown): value is 'telegram' | 'phone' =>
  value === 'telegram' || value === 'phone';

/**
 * Profil MAYDONMA-MAYDON tiklanadi: bitta buzuq maydon butun profilni
 * tashlamaydi.
 */
function reviveProfile(raw: unknown): MasterProfile {
  if (typeof raw !== 'object' || raw === null) return EMPTY_MASTER_PROFILE;
  const value = raw as Partial<StoredProfile>;

  const isAvailable = value.isAvailable === true;

  return {
    about: typeof value.about === 'string' ? value.about.slice(0, ABOUT_MAX) : '',
    isAvailable,
    // Yopiq smenada boshlanish vaqti MAʼNOSIZ: buzuq yozuvda u qolib ketsa,
    // ekran «0 daqiqadan beri smenadasiz» deb yolgʻon gapirardi.
    availableSince: isAvailable ? reviveDate(value.availableSince) : null,
    updatedAt: reviveDate(value.updatedAt),
  };
}

/**
 * SOF: rad etilganlar roʻyxati.
 *
 * Satr boʻlmagan element tashlanadi, dublikat olib tashlanadi, uzunlik
 * chegaralanadi — bitta buzuq element butun roʻyxatni oʻldirmaydi.
 */
function reviveDeclinedIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const unique = new Set(raw.filter((item): item is string => typeof item === 'string'));
  return [...unique].slice(0, DECLINED_IDS_MAX);
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
    declinedOrderIds: reviveDeclinedIds(value.declinedOrderIds),
  };
}

/** SOF: holatni saqlanadigan shaklga oʻtkazadi. */
export function serializeMasterState(state: MasterState): StoredMasterState {
  return {
    profile: {
      about: state.profile.about,
      isAvailable: state.profile.isAvailable,
      availableSince: state.profile.availableSince
        ? state.profile.availableSince.toISOString()
        : null,
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
    declinedOrderIds: [...state.declinedOrderIds].slice(0, DECLINED_IDS_MAX),
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
