import { Injectable } from '@nestjs/common';
import type { ServiceMediaKind, ServiceMediaRole, ServicePriceKind } from '@prisma/client';
import { CURRENCY, type Currency } from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { CATALOG_CACHE_KEYS, CatalogCacheService } from './catalog-cache.service';

export interface GroupedCategoryView {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  currency: Currency;
  /**
   * Kategoriyaning OʻZ ikona kaliti; boʻsh boʻlsa ilova guruhnikiga tushadi.
   * Ilova xizmat fotosini ham shu kalit boʻyicha topadi.
   */
  iconKey: string | null;
  /** Roʻyxatdagi bir qatorli izoh (yangi maydon; `description` ning oʻrnini bosadi). */
  summary: string | null;
  /** Xizmat sahifasidagi batafsil tavsif. */
  details: string | null;
  includes: string[];
  excludes: string[];
  durationMinutes: number | null;
  priceKind: ServicePriceKind;
  /** Roʻyxatdagi karta rasmi; `null` boʻlsa ilova ikonka chizadi. */
  coverUrl: string | null;
  media: Array<{ kind: ServiceMediaKind; url: string; role: ServiceMediaRole }>;
}

export interface ServiceGroupView {
  id: string;
  name: string;
  /** Ilova ikonani shu kalit boʻyicha tanlaydi — URL emas, vektor kalit. */
  iconKey: string;
  categories: GroupedCategoryView[];
}

@Injectable()
export class ServiceGroupsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CatalogCacheService,
  ) {}

  /**
   * Guruhlar va ular ichidagi xizmatlar — bosh sahifa plitkalari va
   * kategoriya ekrani uchun bitta so'rovda.
   *
   * Bo'sh guruhlar qaytarilmaydi: mijoz ochganda hech narsa yoʻq ekranga
   * tushmasin.
   */
  listActive(): Promise<ServiceGroupView[]> {
    return this.cache.readThrough(CATALOG_CACHE_KEYS.groups, async () => {
      const groups = await this.prisma.serviceGroup.findMany({
        where: { isActive: true, categories: { some: { isActive: true } } },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          categories: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: { media: { orderBy: { sortOrder: 'asc' } } },
          },
        },
      });

      return groups.map((group): ServiceGroupView => ({
        id: group.id,
        name: group.name,
        iconKey: group.iconKey,
        categories: group.categories.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description,
          basePrice: category.basePrice,
          currency: CURRENCY,
          iconKey: category.iconKey,
          summary: category.summary,
          details: category.details,
          includes: category.includes,
          excludes: category.excludes,
          durationMinutes: category.durationMinutes,
          priceKind: category.priceKind,
          coverUrl: category.media.find((item) => item.isCover)?.url ?? null,
          media: category.media.map((item) => ({ kind: item.kind, url: item.url, role: item.role })),
        })),
      }));
    });
  }
}
