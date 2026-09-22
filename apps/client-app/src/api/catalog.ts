import { apiRequest } from './client';
import type { FlatServiceCategory } from '@/mocks/serviceGroups';
import type { ServiceGroup, ServiceMedia, ServicePriceKind } from '@/mocks/types';

/**
 * Katalog — serverdan.
 *
 * Ilovadagi `src/mocks/serviceGroups.ts` bilan AYNI shakl qaytariladi:
 * ekranlar katalog qayerdan kelganini bilmaydi. Yagona farq — `id`:
 * mockʼda `c-tap`, serverda UUID. Shuning uchun rasm va ikona `iconKey`
 * boʻyicha topiladi (`serviceImages.ts`).
 */
interface RawCategory {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  currency: string;
  iconKey: string | null;
  summary?: string | null;
  details?: string | null;
  includes?: string[];
  excludes?: string[];
  durationMinutes?: number | null;
  priceKind?: ServicePriceKind;
  coverUrl?: string | null;
  media?: ServiceMedia[];
}

interface RawGroup {
  id: string;
  name: string;
  iconKey: string;
  categories: RawCategory[];
}

/** SOF: server guruhini ilova shakliga oʻgiradi. */
export function toServiceGroup(raw: RawGroup): ServiceGroup {
  return {
    id: raw.id,
    name: raw.name,
    iconKey: raw.iconKey,
    categories: raw.categories.map((category) => ({
      id: category.id,
      // Kategoriyaning oʻz kaliti boʻlmasa guruhnikiga tushadi — ekranda
      // ikonasiz katak qolmaydi.
      iconKey: category.iconKey ?? raw.iconKey,
      name: category.name,
      // Server yangi `summary` ni ham, eski `description` ni ham yuboradi;
      // eskirgan ilova ishlab tursin deb ikkalasi ham toʻldiriladi.
      description: category.summary ?? category.description,
      groupId: raw.id,
      basePrice: category.basePrice,
      details: category.details ?? null,
      includes: category.includes ?? [],
      excludes: category.excludes ?? [],
      durationMinutes: category.durationMinutes ?? null,
      priceKind: category.priceKind ?? 'FIXED',
      coverUrl: category.coverUrl ?? null,
      media: category.media ?? [],
    })),
  };
}

/** SOF: guruhlardan tekis roʻyxat — «Barcha xizmatlar» ekrani uchun. */
export function toFlatCategories(groups: readonly ServiceGroup[]): FlatServiceCategory[] {
  return groups.flatMap((group) =>
    group.categories.map((category) => ({
      ...category,
      iconKey: category.iconKey ?? group.iconKey,
      groupName: group.name,
    })),
  );
}

export const fetchServiceGroups = async (): Promise<ServiceGroup[]> =>
  (await apiRequest<RawGroup[]>('/api/v1/service-groups')).map(toServiceGroup);
