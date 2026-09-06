import { ComplexityLevel } from '@prisma/client';
import { MATCHING_RADIUS_KM } from '@shared/index';
import { MasterFinderService } from './master-finder.service';

describe('MasterFinderService.findCandidates (biznes-qoida 5.3)', () => {
  let service: MasterFinderService;
  let queryRawUnsafe: jest.Mock;
  let tx: { $queryRawUnsafe: jest.Mock };

  beforeEach(() => {
    queryRawUnsafe = jest.fn().mockResolvedValue([]);
    tx = { $queryRawUnsafe: queryRawUnsafe };
    service = new MasterFinderService({} as never);
  });

  const paramsOf = () => queryRawUnsafe.mock.calls[0];

  it('murakkab ish uchun "faqat tajribali usta" filtrini yoqadi', async () => {
    // Act
    await service.findCandidates(tx as never, {
      categoryId: 'category-1',
      complexityLevel: ComplexityLevel.COMPLEX,
      lat: 41.3,
      lng: 69.2,
    });

    // Assert: $4 — requireExperienced
    expect(paramsOf()[4]).toBe(true);
  });

  it("oddiy ish uchun tajriba filtri qo'llanmaydi", async () => {
    await service.findCandidates(tx as never, {
      categoryId: 'category-1',
      complexityLevel: ComplexityLevel.SIMPLE,
      lat: 41.3,
      lng: 69.2,
    });

    expect(paramsOf()[4]).toBe(false);
  });

  it('tajriba filtri SQL darajasida bajariladi (frontendga ishonilmaydi)', async () => {
    await service.findCandidates(tx as never, {
      categoryId: 'category-1',
      complexityLevel: ComplexityLevel.COMPLEX,
      lat: 41.3,
      lng: 69.2,
    });

    const sql = paramsOf()[0] as string;
    expect(sql).toContain("m.experience_level = 'EXPERIENCED'");
    expect(sql).toContain("m.status = 'AVAILABLE'");
    expect(sql).toContain('m.is_active = true');
  });

  it('ikkita buyurtma bitta ustaga tushmasligi uchun qatorlarni bloklaydi', async () => {
    await service.findCandidates(tx as never, {
      categoryId: 'category-1',
      complexityLevel: ComplexityLevel.SIMPLE,
      lat: 41.3,
      lng: 69.2,
    });

    expect(paramsOf()[0] as string).toContain('FOR UPDATE OF m SKIP LOCKED');
  });

  it("standart radius va kategoriya bo'yicha qidiradi", async () => {
    await service.findCandidates(tx as never, {
      categoryId: 'category-1',
      complexityLevel: ComplexityLevel.SIMPLE,
      lat: 41.3,
      lng: 69.2,
    });

    expect(paramsOf()[1]).toBe('category-1');
    expect(paramsOf()[5]).toBe(MATCHING_RADIUS_KM);
  });

  it("chetlatilgan ustalar bo'lmasa NULL uzatadi (SQL sharti o'chadi)", async () => {
    await service.findCandidates(tx as never, {
      categoryId: 'category-1',
      complexityLevel: ComplexityLevel.SIMPLE,
      lat: 41.3,
      lng: 69.2,
    });

    expect(paramsOf()[6]).toBeNull();
  });

  it("javob bermagan ustani keyingi urinishda chetlab o'tadi", async () => {
    await service.findCandidates(tx as never, {
      categoryId: 'category-1',
      complexityLevel: ComplexityLevel.SIMPLE,
      lat: 41.3,
      lng: 69.2,
      excludeMasterIds: ['master-1'],
    });

    expect(paramsOf()[6]).toEqual(['master-1']);
  });
});
