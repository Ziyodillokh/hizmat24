import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceGroupsController } from './service-groups.controller';

describe('Katalog controllerlari', () => {
  it("kategoriyalarning tekis ro'yxatini qaytaradi", async () => {
    const listActive = jest.fn().mockResolvedValue([{ id: 'category-1' }]);
    const controller = new ServiceCategoriesController({ listActive } as never);

    await expect(controller.list()).resolves.toEqual([{ id: 'category-1' }]);
  });

  it('guruhlarni ichidagi xizmatlar bilan qaytaradi', async () => {
    const listActive = jest.fn().mockResolvedValue([{ id: 'group-1', categories: [] }]);
    const controller = new ServiceGroupsController({ listActive } as never);

    await expect(controller.list()).resolves.toEqual([{ id: 'group-1', categories: [] }]);
  });
});
