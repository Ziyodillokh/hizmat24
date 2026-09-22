import { ComplexityLevel, ServiceMediaKind, ServicePriceKind } from '@prisma/client';
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
  iconKey: null,
  summary: 'Yangi plitani xavfsiz ulaymiz',
  details: 'Gaz quvuriga ulash, germetiklik tekshiruvi.',
  includes: ['Ulash', 'Tekshiruv'],
  excludes: ['Yangi shlang narxi'],
  durationMinutes: 90,
  priceKind: ServicePriceKind.FROM,
  media: [
    { id: 'm1', kind: ServiceMediaKind.IMAGE, url: '/media/m1.webp', isCover: true, sortOrder: 0 },
    { id: 'm2', kind: ServiceMediaKind.VIDEO, url: '/media/m2.mp4', isCover: false, sortOrder: 1 },
  ],
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
        iconKey: null,
        summary: 'Yangi plitani xavfsiz ulaymiz',
        details: 'Gaz quvuriga ulash, germetiklik tekshiruvi.',
        includes: ['Ulash', 'Tekshiruv'],
        excludes: ['Yangi shlang narxi'],
        durationMinutes: 90,
        priceKind: ServicePriceKind.FROM,
        coverUrl: '/media/m1.webp',
        media: [
          { kind: ServiceMediaKind.IMAGE, url: '/media/m1.webp' },
          { kind: ServiceMediaKind.VIDEO, url: '/media/m2.mp4' },
        ],
      },
    ]);
  });

  it('complexity_level ni mijozga oshkor qilmaydi (TZ 2.2)', async () => {
    const [category] = await service.listActive();

    expect(Object.keys(category)).not.toContain('complexityLevel');
    expect(Object.keys(category)).not.toContain('complexity_level');
  });

  it("faqat is_active=true kategoriyalarni soʻraydi", async () => {
    await service.listActive();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
    );
  });

  it('kategoriyalar cache kalitidan foydalanadi', async () => {
    await service.listActive();

    expect(readThrough).toHaveBeenCalledWith(CATALOG_CACHE_KEYS.categories, expect.any(Function));
  });

  it('muqova rasmi boʻlmasa `coverUrl` null — ilova ikonka chizadi', async () => {
    findMany.mockResolvedValue([{ ...CATEGORY, media: [] }]);

    const [category] = await service.listActive();

    expect(category.coverUrl).toBeNull();
    expect(category.media).toEqual([]);
  });

  it('media tartib boʻyicha soʻraladi', async () => {
    await service.listActive();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ include: { media: { orderBy: { sortOrder: 'asc' } } } }),
    );
  });
});
