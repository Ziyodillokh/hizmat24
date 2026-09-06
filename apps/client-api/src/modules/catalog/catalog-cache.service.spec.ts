import { CATALOG_CACHE_KEYS, CatalogCacheService } from './catalog-cache.service';

describe('CatalogCacheService', () => {
  let service: CatalogCacheService;
  let get: jest.Mock;
  let set: jest.Mock;
  let del: jest.Mock;

  beforeEach(() => {
    get = jest.fn().mockResolvedValue(null);
    set = jest.fn().mockResolvedValue('OK');
    del = jest.fn().mockResolvedValue(2);

    service = new CatalogCacheService(
      { get: () => undefined } as never,
      {
        get,
        set,
        del,
      } as never,
    );
  });

  it('cache bo’sh bo’lsa loader ni chaqiradi va natijani yozadi', async () => {
    // Arrange
    const loader = jest.fn().mockResolvedValue([{ id: 'x' }]);

    // Act
    const result = await service.readThrough('kalit', loader);

    // Assert
    expect(result).toEqual([{ id: 'x' }]);
    expect(set).toHaveBeenCalledWith('kalit', JSON.stringify([{ id: 'x' }]), 'EX', 300);
  });

  it('cache mavjud bo’lsa loader ni umuman chaqirmaydi', async () => {
    get.mockResolvedValue(JSON.stringify([{ id: 'cached' }]));
    const loader = jest.fn();

    const result = await service.readThrough('kalit', loader);

    expect(result).toEqual([{ id: 'cached' }]);
    expect(loader).not.toHaveBeenCalled();
  });

  it('invalidatsiyada ikkala katalog kalitini birga tozalaydi', async () => {
    await service.invalidateAll();

    expect(del).toHaveBeenCalledWith(CATALOG_CACHE_KEYS.categories, CATALOG_CACHE_KEYS.groups);
  });
});
