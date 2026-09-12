import type { DisputeChannel, DisputeChannelEvent, DisputeGoal, DisputeRecord } from '@/lib/dispute';

/**
 * Murojaatlarni qurilmada saqlash.
 *
 * Sessiya va chat kalitlaridan ALOHIDA: bu foydalanuvchining oʻz yozuvi va
 * boshqa sxemalar bilan aralashtirilmaydi.
 *
 * `reviveDisputes` va `serializeDisputes` SOF funksiya sifatida eksport
 * qilinadi: test muhitida `localStorage` yoʻq, murojaat esa foydalanuvchi
 * himoyasi yozuvi — uning tiklanishi test bilan qoplanishi shart.
 */
const STORAGE_KEY = 'hizmat24:disputes:v1';

interface StoredChannelEvent {
  channel: string;
  openedAt: string;
}

export interface StoredDispute {
  id: string;
  orderId: string;
  orderShortId: string;
  categoryName: string;
  reason: string;
  goal: string;
  note: string;
  message: string;
  createdAt: string;
  openedChannels: StoredChannelEvent[];
  resolvedAt: string | null;
}

const reviveDate = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isGoal = (value: unknown): value is DisputeGoal =>
  value === 'fix' || value === 'refund' || value === 'report';

const isChannel = (value: unknown): value is DisputeChannel =>
  value === 'telegram' || value === 'phone';

function reviveChannels(raw: unknown): DisputeChannelEvent[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item): DisputeChannelEvent | null => {
      if (typeof item !== 'object' || item === null) return null;
      const event = item as Partial<StoredChannelEvent>;
      const openedAt = reviveDate(event.openedAt);
      // Buzuq hodisa YOZUVNI tashlamaydi — faqat oʻzi tushib qoladi.
      return isChannel(event.channel) && openedAt
        ? { channel: event.channel, openedAt }
        : null;
    })
    .filter((item): item is DisputeChannelEvent => item !== null);
}

function reviveDispute(raw: unknown): DisputeRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const value = raw as Partial<StoredDispute>;
  const createdAt = reviveDate(value.createdAt);

  const strings = [
    value.id,
    value.orderId,
    value.orderShortId,
    value.categoryName,
    value.reason,
    value.note,
    value.message,
  ];
  if (strings.some((item) => typeof item !== 'string')) return null;
  if (!createdAt || !isGoal(value.goal)) return null;

  return {
    id: value.id as string,
    orderId: value.orderId as string,
    orderShortId: value.orderShortId as string,
    categoryName: value.categoryName as string,
    reason: value.reason as string,
    goal: value.goal,
    note: value.note as string,
    message: value.message as string,
    createdAt,
    openedChannels: reviveChannels(value.openedChannels),
    // Buzuq sana "hal boʻlmagan" deb qabul qilinadi — xavfsiz tomonga.
    resolvedAt: reviveDate(value.resolvedAt),
  };
}

/** SOF: saqlangan shakldan yozuvlarni tiklaydi. */
export function reviveDisputes(parsed: unknown): DisputeRecord[] | null {
  if (!Array.isArray(parsed)) return null;

  const records = parsed
    .map(reviveDispute)
    .filter((item): item is DisputeRecord => item !== null);

  return records.length > 0 ? records : null;
}

/** SOF: yozuvlarni saqlanadigan shaklga oʻtkazadi. */
export function serializeDisputes(records: readonly DisputeRecord[]): StoredDispute[] {
  return records.map((record) => ({
    id: record.id,
    orderId: record.orderId,
    orderShortId: record.orderShortId,
    categoryName: record.categoryName,
    reason: record.reason,
    goal: record.goal,
    note: record.note,
    message: record.message,
    createdAt: record.createdAt.toISOString(),
    openedChannels: record.openedChannels.map((event) => ({
      channel: event.channel,
      openedAt: event.openedAt.toISOString(),
    })),
    resolvedAt: record.resolvedAt ? record.resolvedAt.toISOString() : null,
  }));
}

export function loadDisputes(): DisputeRecord[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return reviveDisputes(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveDisputes(records: readonly DisputeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeDisputes(records)));
  } catch {
    // Xotira toʻlgan boʻlsa ham ilova ishlashda davom etadi: matn ayni damda
    // ekranda turibdi va uni darhol nusxalash mumkin.
  }
}

/** Chiqishda chaqiriladi: keyingi foydalanuvchi oldingisining shikoyatini koʻrmasligi kerak. */
export function clearDisputes(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // eʼtiborsiz
  }
}
