import { ComplexityLevel } from '@prisma/client';
import { ServiceCategoriesService } from './service-categories.service';
import { CATALOG_CACHE_KEYS } from './catalog-cache.service';

const CATEGORY = {
  id: 'category-1',
  name: 'Gaz plitasi ulash',
  description: null,
  groupId: 'group-1',
  basePrice: 350_000,
  complexityLevel: ComplexityLevel.COMPLEX,
  sortOrder: 0,
  isActive: true,
};

describe('ServiceCategoriesService (TZ 3.2)', () => {
  let service: ServiceCategoriesService;
  let findMany: jest.Mock;
  let readThrough: jest.Mock;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([CATEGORY]);
    readThrough = jest.fn().mockImplementation((_key: string, loader: () => unknown) => loader());

    service = new ServiceCategoriesService(
      { serviceCategory: { findMany } } as never,
      { readThrough } as never,
    );
  });

  it('faol kategoriyalarni narxi va guruh havolasi bilan qaytaradi', async () => {
    const result = await service.listActive();

    expect(result).toEqual([
      {
        id: 'category-1',
        name: 'Gaz plitasi ulash',
        description: null,
        groupId: 'group-1',
        basePrice: 350_000,
        currency: 'UZS',
      },
    ]);
  });

  it('complexity_level ni mijozga oshkor qilmaydi (TZ 2.2)', async () => {
    const [category] = await service.listActive();

    expect(Object.keys(category)).not.toContain('complexityLevel');
    expect(Object.keys(category)).not.toContain('complexity_level');
  });

  it("faqat is_active=true kategoriyalarni so'raydi", async () => {
    await service.listActive();

    expect(findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  });

  it('kategoriyalar cache kalitidan foydalanadi', async () => {
    await service.listActive();

    expect(readThrough).toHaveBeenCalledWith(CATALOG_CACHE_KEYS.categories, expect.any(Function));
  });
});
