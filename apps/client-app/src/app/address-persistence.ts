import {
  ADDRESS_LIMIT,
  ADDRESS_NAME_MAX,
  type AddressKind,
  type SavedAddress,
} from '@/lib/savedAddress';
import type { OrderAddress } from '@/mocks/types';

/**
 * Saqlangan manzillarni qurilmada saqlash.
 *
 * Sessiya kalitidan ALOHIDA: manzillar buyurtmalar bilan bir sxemada
 * yashamaydi va sxema oʻzgarsa bir-birini buzmaydi.
 *
 * `reviveAddresses` va `serializeAddresses` SOF funksiya sifatida
 * eksport qilinadi — test muhitida `localStorage` yoʻq, manzil esa
 * foydalanuvchi qoʻldan kiritgan maʼlumot va uning tiklanishi test bilan
 * qoplanishi shart.
 */
const STORAGE_KEY = 'hizmat24:addresses:v1';

interface StoredAddress {
  id: string;
  kind: string;
  name: string;
  label: string;
  entrance: string | null;
  floor: string | null;
  apartment: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

const reviveDate = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isKind = (value: unknown): value is AddressKind =>
  value === 'home' || value === 'work' || value === 'other';

/** Boʻsh satr `undefined` boʻladi — `addressDetailsLine` boʻsh satrni "bor" deb hisoblardi. */
const revivePart = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

function reviveAddress(raw: unknown): SavedAddress | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const value = raw as Partial<StoredAddress>;
  const createdAt = reviveDate(value.createdAt);

  if (typeof value.id !== 'string' || value.id.length === 0) return null;
  if (typeof value.label !== 'string' || value.label.trim().length === 0) return null;
  if (!createdAt) return null;

  const address: OrderAddress = {
    label: value.label.trim(),
    entrance: revivePart(value.entrance),
    floor: revivePart(value.floor),
    apartment: revivePart(value.apartment),
  };

  return {
    id: value.id,
    // Notoʻgʻri tur yozuvni TASHLAMAYDI: manzilning oʻzi butun, faqat
    // yorligʻi yoʻqolgan — "Boshqa" har doim toʻgʻri javob.
    kind: isKind(value.kind) ? value.kind : 'other',
    name: typeof value.name === 'string' ? value.name.slice(0, ADDRESS_NAME_MAX) : '',
    address,
    createdAt,
    lastUsedAt: reviveDate(value.lastUsedAt),
  };
}

/** SOF: saqlangan shakldan manzillarni tiklaydi. */
export function reviveAddresses(parsed: unknown): SavedAddress[] | null {
  if (!Array.isArray(parsed)) return null;

  const seen = new Set<string>();
  const records = parsed
    .map(reviveAddress)
    .filter((item): item is SavedAddress => item !== null)
    // Takroriy `id` roʻyxatni React kalitlari darajasida buzardi.
    .filter((item) => (seen.has(item.id) ? false : (seen.add(item.id), true)))
    // Chegara oʻqishda ham qoʻllanadi: qoʻlda tahrirlangan xotira
    // roʻyxatni cheksiz uzun qilib qoʻymaydi.
    .slice(0, ADDRESS_LIMIT);

  return records.length > 0 ? records : null;
}

/** SOF: manzillarni saqlanadigan shaklga oʻtkazadi. */
export function serializeAddresses(records: readonly SavedAddress[]): StoredAddress[] {
  return records.map((record) => ({
    id: record.id,
    kind: record.kind,
    name: record.name,
    label: record.address.label,
    entrance: record.address.entrance ?? null,
    floor: record.address.floor ?? null,
    apartment: record.address.apartment ?? null,
    createdAt: record.createdAt.toISOString(),
    lastUsedAt: record.lastUsedAt ? record.lastUsedAt.toISOString() : null,
  }));
}

export function loadAddresses(): SavedAddress[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return reviveAddresses(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveAddresses(records: readonly SavedAddress[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeAddresses(records)));
  } catch {
    // Xotira toʻlgan boʻlsa ham ilova ishlashda davom etadi: manzil ayni
    // damda qoralamada turibdi va buyurtma berishga xalal bermaydi.
  }
}

/** Chiqishda chaqiriladi: manzil — uy manzili, keyingi foydalanuvchi uni koʻrmasligi kerak. */
export function clearAddresses(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // eʼtiborsiz
  }
}
