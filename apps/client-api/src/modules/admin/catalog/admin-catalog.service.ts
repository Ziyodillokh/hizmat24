import { Injectable } from '@nestjs/common';
import type { ComplexityLevel } from '@prisma/client';
import { PrismaService } from '@client/infra/prisma/prisma.service';

export interface AdminCategoryView {
  id: string;
  name: string;
  description: string | null;
  groupName: string | null;
  basePrice: number;
  complexityLevel: ComplexityLevel;
  iconKey: string | null;
  isActive: boolean;
  sortOrder: number;
  /** Shu xizmatni bajara oladigan ustalar soni — narx qoʻyishda muhim. */
  masterCount: number;
}

/**
 * Katalogning ADMIN koʻrinishi — mijoznikidan ataylab boshqa.
 *
 * Uch farq bor va uchalasi ham maqsadli:
 *  1. oʻchirilgan xizmatlar ham koʻrinadi — ularni qayta yoqish kerak;
 *  2. kesh ishlatilmaydi — admin oʻzi kiritgan oʻzgarishni darhol koʻrsin;
 *  3. `complexityLevel` qaytariladi — mijozdan yashiriladi (TZ 2.2), admin
 *     esa aynan shu bilan ishlaydi.
 */
@Injectable()
export class AdminCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories(): Promise<AdminCategoryView[]> {
    const categories = await this.prisma.serviceCategory.findMany({
      orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        group: { select: { name: true } },
        _count: { select: { masters: true } },
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      groupName: category.group?.name ?? null,
      basePrice: category.basePrice,
      complexityLevel: category.complexityLevel,
      iconKey: category.iconKey,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      masterCount: category._count.masters,
    }));
  }
}
