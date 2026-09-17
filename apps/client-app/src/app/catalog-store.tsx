import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchServiceGroups, toFlatCategories } from '@/api/catalog';
import { isApiEnabled } from '@/api/client';
import { ALL_CATEGORIES, SERVICE_GROUPS, type FlatServiceCategory } from '@/mocks/serviceGroups';
import type { ServiceGroup } from '@/mocks/types';
import { loadCatalog, saveCatalog } from './catalog-persistence';

/**
 * Xizmatlar katalogi — ilovadagi YAGONA manba.
 *
 * Ekranlar `useCatalog()` ga qaraydi va katalog qayerdan kelganini bilmaydi:
 * `VITE_API_URL` boʻsh boʻlsa `src/mocks/serviceGroups.ts`, toʻldirilgan
 * boʻlsa server. Shu sababli ulanishni yoqish/oʻchirish ekranlarga tegmaydi.
 *
 * Server javobi qurilmada keshlanadi: ilova ochilishi bilan katalog
 * koʻrinadi, yangisi kelgach jimgina almashadi. Kesh YOʻQ boʻlsa va server
 * javob bermasa — mock katalog ishlatiladi: ilova ishlayveradi, lekin
 * ekranda hech qanday yolgʻon paydo boʻlmaydi (nomlar va narxlar oʻsha).
 */
export interface CatalogValue {
  groups: readonly ServiceGroup[];
  categories: readonly FlatServiceCategory[];
  findGroup: (groupId: string) => ServiceGroup | undefined;
  findCategory: (categoryId: string | null) => FlatServiceCategory | undefined;
  /** Serverdan yangilanish ketayotgani — ekran buni koʻrsatishi shart emas. */
  isRefreshing: boolean;
}

const CatalogContext = createContext<CatalogValue | null>(null);

export function useCatalog(): CatalogValue {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('useCatalog faqat CatalogProvider ichida ishlatiladi');
  return value;
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<readonly ServiceGroup[]>(
    () => (isApiEnabled() ? loadCatalog() : null) ?? SERVICE_GROUPS,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isApiEnabled()) return;

    let alive = true;
    setIsRefreshing(true);
    void fetchServiceGroups()
      .then((fresh) => {
        if (!alive || fresh.length === 0) return;
        setGroups(fresh);
        saveCatalog(fresh);
      })
      .catch(() => {
        // Keshdagi (yoki mock) katalog ekranda qoladi — boʻsh roʻyxat
        // koʻrsatish xizmat yoʻqdek taassurot berardi.
      })
      .finally(() => {
        if (alive) setIsRefreshing(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<CatalogValue>(() => {
    const categories = groups === SERVICE_GROUPS ? ALL_CATEGORIES : toFlatCategories(groups);

    return {
      groups,
      categories,
      findGroup: (groupId) => groups.find((group) => group.id === groupId),
      findCategory: (categoryId) =>
        categoryId ? categories.find((category) => category.id === categoryId) : undefined,
      isRefreshing,
    };
  }, [groups, isRefreshing]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
