import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ActorType,
  AuditAction,
  ComplexityLevel,
  Prisma,
  ServiceMediaKind,
  ServicePriceKind,
} from '@prisma/client';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { AuditService } from '@client/modules/audit/audit.service';
import { CatalogCacheService } from '@client/modules/catalog/catalog-cache.service';
import type { RequestContext } from '@client/common/http/request-context';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import { MAX_MEDIA_PER_CATEGORY, type MediaKind } from './domain/media-rules';
import { MediaStorageService } from './media-storage.service';
import type { UpsertCategoryDto, UpsertGroupDto } from './dto/catalog.dto';

export interface AdminMediaView {
  id: string;
  kind: ServiceMediaKind;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface AdminCategoryView {
  id: string;
  name: string;
  summary: string | null;
  details: string | null;
  includes: string[];
  excludes: string[];
  description: string | null;
  groupId: string | null;
  groupName: string | null;
  basePrice: number;
  priceKind: ServicePriceKind;
  durationMinutes: number | null;
  complexityLevel: ComplexityLevel;
  iconKey: string | null;
  isActive: boolean;
  sortOrder: number;
  media: AdminMediaView[];
  /** Shu xizmatni YOQIB qoʻygan ustalar soni — narx qoʻyishda muhim. */
  masterCount: number;
}

export interface AdminGroupView {
  id: string;
  name: string;
  iconKey: string;
  sortOrder: number;
  isActive: boolean;
  categoryCount: number;
}

const CATEGORY_INCLUDE = {
  group: { select: { name: true } },
  media: { orderBy: { sortOrder: 'asc' } },
  _count: { select: { masters: { where: { isEnabled: true } } } },
} satisfies Prisma.ServiceCategoryInclude;

type CategoryRow = Prisma.ServiceCategoryGetPayload<{ include: typeof CATEGORY_INCLUDE }>;

const toView = (category: CategoryRow): AdminCategoryView => ({
  id: category.id,
  name: category.name,
  summary: category.summary,
  details: category.details,
  includes: category.includes,
  excludes: category.excludes,
  description: category.description,
  groupId: category.groupId,
  groupName: category.group?.name ?? null,
  basePrice: category.basePrice,
  priceKind: category.priceKind,
  durationMinutes: category.durationMinutes,
  complexityLevel: category.complexityLevel,
  iconKey: category.iconKey,
  isActive: category.isActive,
  sortOrder: category.sortOrder,
  media: category.media.map((item) => ({
    id: item.id,
    kind: item.kind,
    url: item.url,
    sortOrder: item.sortOrder,
    isCover: item.isCover,
  })),
  masterCount: category._count.masters,
});

/**
 * Katalogning ADMIN koʻrinishi va boshqaruvi.
 *
 * Mijoznikidan uch farqi bor: oʻchirilgan xizmatlar ham koʻrinadi (ularni
 * qayta yoqish kerak), kesh ishlatilmaydi (admin oʻz oʻzgarishini darhol
 * koʻrsin) va `complexityLevel` qaytariladi (mijozdan yashiriladi).
 *
 * Har bir yozuvdan keyin mijoz keshi tozalanadi — aks holda ilovada eski
 * narx bir necha daqiqa koʻrinib turardi.
 */
@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CatalogCacheService,
    private readonly audit: AuditService,
    private readonly storage: MediaStorageService,
  ) {}

  async listCategories(): Promise<AdminCategoryView[]> {
    const categories = await this.prisma.serviceCategory.findMany({
      orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: CATEGORY_INCLUDE,
    });

    return categories.map(toView);
  }

  async findCategory(id: string): Promise<AdminCategoryView> {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
      include: CATEGORY_INCLUDE,
    });
    if (!category) throw new NotFoundException('Xizmat topilmadi');

    return toView(category);
  }

  async listGroups(): Promise<AdminGroupView[]> {
    const groups = await this.prisma.serviceGroup.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { categories: true } } },
    });

    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      iconKey: group.iconKey,
      sortOrder: group.sortOrder,
      isActive: group.isActive,
      categoryCount: group._count.categories,
    }));
  }

  async createGroup(dto: UpsertGroupDto): Promise<AdminGroupView> {
    await this.prisma.serviceGroup.create({ data: { ...dto } });
    await this.cache.invalidateAll();
    return (await this.listGroups()).find((group) => group.name === dto.name) as AdminGroupView;
  }

  async updateGroup(id: string, dto: UpsertGroupDto): Promise<AdminGroupView> {
    await this.prisma.serviceGroup.update({ where: { id }, data: { ...dto } });
    await this.cache.invalidateAll();
    return (await this.listGroups()).find((group) => group.id === id) as AdminGroupView;
  }

  async createCategory(
    dto: UpsertCategoryDto,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<AdminCategoryView> {
    const created = await this.prisma.serviceCategory.create({ data: toData(dto) });
    await this.afterWrite({
      action: AuditAction.CATALOG_CATEGORY_CREATED,
      admin,
      context,
      metadata: { categoryId: created.id, name: created.name, basePrice: created.basePrice },
    });

    return this.findCategory(created.id);
  }

  /**
   * Narx oʻzgarsa audit yozuviga ESKI va YANGI qiymat tushadi.
   *
   * Narx — pul bilan bogʻliq yagona sozlama; «kim koʻtardi, qachon, qancha
   * edi» degan savol keyin albatta chiqadi va javobi bazada boʻlishi kerak.
   */
  async updateCategory(
    id: string,
    dto: UpsertCategoryDto,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<AdminCategoryView> {
    const before = await this.prisma.serviceCategory.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Xizmat topilmadi');

    const updated = await this.prisma.serviceCategory.update({ where: { id }, data: toData(dto) });

    await this.afterWrite({
      action:
        before.basePrice === updated.basePrice
          ? AuditAction.CATALOG_CATEGORY_UPDATED
          : AuditAction.CATALOG_PRICE_CHANGED,
      admin,
      context,
      metadata: {
        categoryId: id,
        name: updated.name,
        ...(before.basePrice === updated.basePrice
          ? {}
          : { priceFrom: before.basePrice, priceTo: updated.basePrice }),
      },
    });

    return this.findCategory(id);
  }

  async setCategoryActive(
    id: string,
    isActive: boolean,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<AdminCategoryView> {
    await this.prisma.serviceCategory.update({ where: { id }, data: { isActive } });
    await this.afterWrite({
      action: AuditAction.CATALOG_CATEGORY_UPDATED,
      admin,
      context,
      metadata: { categoryId: id, isActive },
    });

    return this.findCategory(id);
  }

  /**
   * Yuklangan faylni saqlaydi va kartaga biriktiradi.
   *
   * Birinchi RASM avtomatik muqova boʻladi: kartada rasmsiz joy qolishi —
   * eng koʻp uchraydigan unutish. Video muqova boʻlolmaydi (roʻyxatda
   * statik rasm kerak).
   */
  async addMedia(
    categoryId: string,
    buffer: Buffer,
    kind: MediaKind,
    admin: AdminIdentity,
    context: RequestContext,
  ): Promise<AdminCategoryView> {
    const existing = await this.prisma.serviceMedia.findMany({
      where: { categoryId },
      select: { id: true, kind: true, isCover: true, sortOrder: true },
    });

    if (existing.length >= MAX_MEDIA_PER_CATEGORY) {
      throw new NotFoundException(
        `Bitta xizmatga ${MAX_MEDIA_PER_CATEGORY} tadan koʻp fayl qoʻyilmaydi.`,
      );
    }

    const stored = await this.storage.save(buffer, kind);
    const hasCover = existing.some((item) => item.isCover);
    const nextOrder = existing.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;

    await this.prisma.serviceMedia.create({
      data: {
        id: stored.id,
        categoryId,
        kind: kind === 'IMAGE' ? ServiceMediaKind.IMAGE : ServiceMediaKind.VIDEO,
        url: stored.url,
        sortOrder: nextOrder,
        isCover: kind === 'IMAGE' && !hasCover,
      },
    });

    await this.afterWrite({
      action: AuditAction.CATALOG_CATEGORY_UPDATED,
      admin,
      context,
      metadata: { categoryId, mediaId: stored.id, kind },
    });

    return this.findCategory(categoryId);
  }

  async setCover(mediaId: string): Promise<AdminCategoryView> {
    const media = await this.prisma.serviceMedia.findUnique({ where: { id: mediaId } });
    if (!media) throw new NotFoundException('Fayl topilmadi');
    if (media.kind === ServiceMediaKind.VIDEO) {
      throw new NotFoundException('Muqova faqat rasm boʻlishi mumkin.');
    }

    // Eski muqova AVVAL olib tashlanadi: bazada kategoriyaga bitta muqova
    // ruxsat etilgan (qisman unique indeks), aks holda yozuv rad etilardi.
    await this.prisma.$transaction([
      this.prisma.serviceMedia.updateMany({
        where: { categoryId: media.categoryId, isCover: true },
        data: { isCover: false },
      }),
      this.prisma.serviceMedia.update({ where: { id: mediaId }, data: { isCover: true } }),
    ]);

    await this.cache.invalidateAll();
    return this.findCategory(media.categoryId);
  }

  async removeMedia(mediaId: string): Promise<AdminCategoryView> {
    const media = await this.prisma.serviceMedia.findUnique({ where: { id: mediaId } });
    if (!media) throw new NotFoundException('Fayl topilmadi');

    await this.prisma.serviceMedia.delete({ where: { id: mediaId } });
    await this.storage.remove(media.url);
    await this.cache.invalidateAll();

    return this.findCategory(media.categoryId);
  }

  async reorderMedia(categoryId: string, mediaIds: string[]): Promise<AdminCategoryView> {
    await this.prisma.$transaction(
      mediaIds.map((id, index) =>
        this.prisma.serviceMedia.updateMany({
          where: { id, categoryId },
          data: { sortOrder: index },
        }),
      ),
    );

    await this.cache.invalidateAll();
    return this.findCategory(categoryId);
  }

  private async afterWrite(entry: {
    action: AuditAction;
    admin: AdminIdentity;
    context: RequestContext;
    metadata: Prisma.InputJsonValue;
  }): Promise<void> {
    await this.cache.invalidateAll();
    await this.audit.record({
      action: entry.action,
      actorType: ActorType.ADMIN,
      actorId: entry.admin.id,
      metadata: entry.metadata,
      ...entry.context,
    });
  }
}

/** Boʻsh satr — «qiymat yoʻq», boʻsh matn emas. */
const orNull = (value: string | undefined): string | null => value?.trim() || null;

/**
 * `description` `summary` dan nusxalanadi.
 *
 * Eski maydon ilovaning hozirgi versiyalarida ishlatiladi; yangi
 * `summary` uning oʻrnini bosadi. Ikkovini bir vaqtda yozib turamiz —
 * eski APK oʻrnatilgan telefonlarda karta boʻsh qolmasin.
 */
function toData(dto: UpsertCategoryDto): Prisma.ServiceCategoryUncheckedCreateInput {
  const summary = orNull(dto.summary);

  return {
    name: dto.name,
    summary,
    description: summary,
    details: orNull(dto.details),
    includes: dto.includes ?? [],
    excludes: dto.excludes ?? [],
    basePrice: dto.basePrice,
    priceKind: dto.priceKind ?? ServicePriceKind.FIXED,
    durationMinutes: dto.durationMinutes ?? null,
    complexityLevel: dto.complexityLevel ?? ComplexityLevel.SIMPLE,
    groupId: dto.groupId ?? null,
    iconKey: orNull(dto.iconKey),
    sortOrder: dto.sortOrder ?? 0,
    isActive: dto.isActive ?? true,
  };
}
