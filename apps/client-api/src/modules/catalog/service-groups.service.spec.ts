import { ServiceGroupsService } from './service-groups.service';
import { CATALOG_CACHE_KEYS } from './catalog-cache.service';

const GROUP = {
  id: 'group-1',
  name: 'Elektrik xizmatlari',
  iconKey: 'electrician',
  sortOrder: 0,
  isActive: true,
  categories: [
    {
      id: 'category-1',
      name: "Rozetka o'rnatish",
      description: null,
      basePrice: 80_000,
      complexityLevel: 'SIMPLE',
      isActive: true,
      sortOrder: 0,
    },
  ],
};

describe('ServiceGroupsService', () => {
  let service: ServiceGroupsService;
  let findMany: jest.Mock;
  let readThrough: jest.Mock;

  beforeEach(() => {
    findMany = jest.fn().mockResolvedValue([GROUP]);
    // Cache qatlamini chetlab o'tamiz — loader mantiqini tekshiramiz
    readThrough = jest.fn().mockImplementation((_key: string, loader: () => unknown) => loader());

    service = new ServiceGroupsService(
      { serviceGroup: { findMany } } as never,
      { readThrough } as never,
    );
  });

  it('guruhlarni ichidagi xizmatlar bilan qaytaradi', async () => {
    const result = await service.listActive();

    expect(result).toEqual([
      {
        id: 'group-1',
        name: 'Elektrik xizmatlari',
        iconKey: 'electrician',
        categories: [
          {
            id: 'category-1',
            name: "Rozetka o'rnatish",
            description: null,
            basePrice: 80_000,
            currency: 'UZS',
          },
        ],
      },
    ]);
  });

  it('complexity_level ni mijozga oshkor qilmaydi (TZ 2.2)', async () => {
    const [group] = await service.listActive();

    expect(Object.keys(group.categories[0])).not.toContain('complexityLevel');
  });

  it("bo'sh guruhlarni qaytarmaydi", async () => {
    await service.listActive();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, categories: { some: { isActive: true } } },
      }),
    );
  });

  it('faqat faol xizmatlarni ichiga qo’shadi', async () => {
    await service.listActive();

    const query = findMany.mock.calls[0][0] as { include: { categories: { where: unknown } } };
    expect(query.include.categories.where).toEqual({ isActive: true });
  });

  it('guruhlar va xizmatlarni sortOrder bo’yicha tartiblaydi', async () => {
    await service.listActive();

    const query = findMany.mock.calls[0][0] as {
      orderBy: unknown;
      include: { categories: { orderBy: unknown } };
    };
    expect(query.orderBy).toEqual([{ sortOrder: 'asc' }, { name: 'asc' }]);
    expect(query.include.categories.orderBy).toEqual([{ sortOrder: 'asc' }, { name: 'asc' }]);
  });

  it('alohida cache kalitidan foydalanadi', async () => {
    await service.listActive();

    expect(readThrough).toHaveBeenCalledWith(CATALOG_CACHE_KEYS.groups, expect.any(Function));
  });
});
