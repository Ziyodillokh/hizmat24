import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  isFavorite as isFavoriteIn,
  resolveFavorites,
  toggleFavorite as toggleIn,
  type FavoriteEntry,
  type ResolvedFavorite,
} from '@/lib/favorites';
import { masterById } from '@/mocks/masters';
import { clearFavorites, loadFavorites, saveFavorites } from './favorites-persistence';
import { useApp } from './store';

/**
 * Sevimli ustalar holati.
 *
 * `favorites` — katalogga ULANGAN roʻyxat: qurilmadagi yozuv eskirgan
 * boʻlsa (usta roʻyxatdan chiqib ketgan) u jimgina tushib qoladi va
 * ekranda buzilgan karta chizilmaydi.
 */
interface FavoritesContextValue {
  /** Eng oxirida qoʻshilgani birinchi; faqat katalogda bor ustalar. */
  favorites: ResolvedFavorite[];
  /** Ekranda koʻrinadigan yozuvlar soni — profil qatoridagi ishora uchun. */
  count: number;
  isFavorite: (masterId: string) => boolean;
  /** Qoʻshadi yoki olib tashlaydi va YANGI holatni qaytaradi. */
  toggleFavorite: (masterId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function useFavorites(): FavoritesContextValue {
  const value = useContext(FavoritesContext);
  if (!value) throw new Error('useFavorites faqat FavoritesProvider ichida ishlatiladi');
  return value;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useApp();
  const [entries, setEntries] = useState<FavoriteEntry[]>(() => loadFavorites() ?? []);

  useEffect(() => {
    if (!isAuthenticated) {
      clearFavorites();
      return;
    }
    saveFavorites(entries);
  }, [entries, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) setEntries([]);
  }, [isAuthenticated]);

  /*
   * Yangi holatni QAYTARADI: ekran toast matnini ("qoʻshildi" yoki
   * "olib tashlandi") shu javobdan oladi. `entries` ni oʻqib turib
   * taxmin qilish `setState` dan keyingi eski qiymatga tushardi.
   */
  const toggleFavorite = useCallback((masterId: string): boolean => {
    const next = !isFavoriteIn(entries, masterId);
    setEntries((prev) => toggleIn(prev, masterId, new Date()));
    return next;
  }, [entries]);

  const value = useMemo<FavoritesContextValue>(() => {
    const resolved = resolveFavorites(entries, masterById);
    return {
      favorites: resolved,
      count: resolved.length,
      isFavorite: (masterId) => isFavoriteIn(entries, masterId),
      toggleFavorite,
    };
  }, [entries, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
