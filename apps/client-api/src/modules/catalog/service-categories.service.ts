import { Injectable } from '@nestjs/common';
import { CURRENCY, type Currency } from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { CATALOG_CACHE_KEYS, CatalogCacheService } from './catalog-cache.service';

export interface ServiceCategoryView {
  id: string;
  name: string;
  description: string | null;
  /** Guruhga biriktirilmagan bo'lsa null. */
  groupId: string | null;
  /** So'mda, butun son. Admin panel orqali boshqariladi — kodda hardcode yo'q. */
  basePrice: number;
  currency: Currency;
}

@Injectable()
export class ServiceCategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CatalogCacheService,
  ) {}

  /** Tekis ro'yxat — qidiruv va "Barchasi" ekrani uchun. */
  listActive(): Promise<ServiceCategoryView[]> {
    return this.cache.readThrough(CATALOG_CACHE_KEYS.categories, async () => {
      const categories = await this.prisma.serviceCategory.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });

      // Diqqat: `complexity_level` mijozga qaytarilmaydi (TZ 2.2 izohi).
      return categories.map((category): ServiceCategoryView => ({
        id: category.id,
        name: category.name,
        description: category.description,
        groupId: category.groupId,
        basePrice: category.basePrice,
        currency: CURRENCY,
      }));
    });
  }
}
