import { Injectable } from '@nestjs/common';
import { CURRENCY, type Currency } from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { CATALOG_CACHE_KEYS, CatalogCacheService } from './catalog-cache.service';

export interface GroupedCategoryView {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  currency: Currency;
}

export interface ServiceGroupView {
  id: string;
  name: string;
  /** Ilova ikonani shu kalit bo'yicha tanlaydi — URL emas, vektor kalit. */
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
   * Bo'sh guruhlar qaytarilmaydi: mijoz ochganda hech narsa yo'q ekranga
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
        })),
      }));
    });
  }
}
