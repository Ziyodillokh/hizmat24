import { Injectable } from '@nestjs/common';
import { CURRENCY, type Currency } from '@shared/index';
import type { ServiceMediaKind, ServiceMediaRole, ServicePriceKind } from '@prisma/client';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { CATALOG_CACHE_KEYS, CatalogCacheService } from './catalog-cache.service';

export interface ServiceCategoryView {
  id: string;
  name: string;
  description: string | null;
  /** Guruhga biriktirilmagan boʻlsa null. */
  groupId: string | null;
  /** So'mda, butun son. Admin panel orqali boshqariladi — kodda hardcode yo'q. */
  basePrice: number;
  currency: Currency;
  /** Ikona va xizmat fotosi kaliti; boʻsh boʻlsa ilova guruhnikiga tushadi. */
  iconKey: string | null;
  /** Roʻyxatdagi bir qatorli izoh. */
  summary: string | null;
  /** Xizmat sahifasidagi batafsil tavsif. */
  details: string | null;
  /** «Narx ichiga kiradi» bandlari. */
  includes: string[];
  /** «Narx ichiga kirmaydi» — kutilmagan toʻlovning oldini oladi. */
  excludes: string[];
  /** Taxminiy davomiylik (daqiqa); `null` — vaqt aytilmaydi. */
  durationMinutes: number | null;
  /** `FIXED` — aniq summa, `FROM` — «shundan boshlab». */
  priceKind: ServicePriceKind;
  /** Roʻyxatdagi kartaning rasmi; `null` boʻlsa ilova ikonka chizadi. */
  coverUrl: string | null;
  media: ServiceMediaView[];
}

export interface ServiceMediaView {
  kind: ServiceMediaKind;
  url: string;
  /**
   * Rasm sahifaning qaysi blokida chiziladi.
   *
   * Ilovaga SHU YERDA yuboriladi: «oldin/keyin» va uskuna rasmlari
   * asosiy galereyaga tushmasligi kerak — ularning oʻz boʻlimi bor va
   * galereyada ular kontekstsiz, tushunarsiz koʻrinardi.
   */
  role: ServiceMediaRole;
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
        include: { media: { orderBy: { sortOrder: 'asc' } } },
      });

      // Diqqat: `complexity_level` mijozga qaytarilmaydi (TZ 2.2 izohi).
      return categories.map((category): ServiceCategoryView => ({
        id: category.id,
        name: category.name,
        description: category.description,
        groupId: category.groupId,
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
      }));
    });
  }
}
