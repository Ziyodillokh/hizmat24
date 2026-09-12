import type { FavoriteEntry } from '@/lib/favorites';

/**
 * Sevimli ustalarni qurilmada saqlash.
 *
 * Saqlanadigan narsa faqat `masterId` va qoʻshilgan payt: usta maʼlumoti
 * katalogdan oʻqiladi. Reyting yoki ism nusxasini saqlash eskirgan
 * maʼlumotni haqiqat sifatida koʻrsatishga olib kelardi.
 *
 * `reviveFavorites` va `serializeFavorites` SOF funksiya sifatida
 * eksport qilinadi — test muhitida `localStorage` yoʻq.
 */
const STORAGE_KEY = 'hizmat24:favorites:v1';

interface StoredFavorite {
  masterId: string;
  addedAt: string;
}

const reviveDate = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/** SOF: saqlangan shakldan yozuvlarni tiklaydi. */
export function reviveFavorites(parsed: unknown): FavoriteEntry[] | null {
  if (!Array.isArray(parsed)) return null;

  const seen = new Set<string>();
  const records = parsed
    .map((raw): FavoriteEntry | null => {
      if (typeof raw !== 'object' || raw === null) return null;
      const value = raw as Partial<StoredFavorite>;
      const addedAt = reviveDate(value.addedAt);
      if (typeof value.masterId !== 'string' || value.masterId.length === 0) return null;
      if (!addedAt) return null;
      return { masterId: value.masterId, addedAt };
    })
    .filter((item): item is FavoriteEntry => item !== null)
    // Bitta usta ikki marta turishi mumkin emas — `toggleFavorite` buni
    // taʼminlaydi, lekin qurilmadagi yozuv qoʻlda tahrirlangan boʻlishi
    // mumkin va u holda roʻyxatda takroriy karta chizilardi.
    .filter((item) => (seen.has(item.masterId) ? false : (seen.add(item.masterId), true)));

  return records.length > 0 ? records : null;
}

/** SOF: yozuvlarni saqlanadigan shaklga oʻtkazadi. */
export function serializeFavorites(records: readonly FavoriteEntry[]): StoredFavorite[] {
  return records.map((record) => ({
    masterId: record.masterId,
    addedAt: record.addedAt.toISOString(),
  }));
}

export function loadFavorites(): FavoriteEntry[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return reviveFavorites(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveFavorites(records: readonly FavoriteEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeFavorites(records)));
  } catch {
    // eʼtiborsiz: sevimli roʻyxat yoʻqolsa ham ilova ishlaydi.
  }
}

/** Chiqishda chaqiriladi. */
export function clearFavorites(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // eʼtiborsiz
  }
}
