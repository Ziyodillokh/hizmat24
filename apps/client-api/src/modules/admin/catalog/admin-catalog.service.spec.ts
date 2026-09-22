import { ComplexityLevel, ServicePriceKind } from '@prisma/client';
import type { AuditService } from '@client/modules/audit/audit.service';
import type { CatalogCacheService } from '@client/modules/catalog/catalog-cache.service';
import type { PrismaService } from '@client/infra/prisma/prisma.service';
import { AdminCatalogService } from './admin-catalog.service';
import type { MediaStorageService } from './media-storage.service';
import type { UpsertCategoryDto } from './dto/catalog.dto';

const ADMIN = { id: 'admin-1' } as never;
const CONTEXT = { ipAddress: '10.0.0.1', userAgent: 'jest' };

const existing = {
  id: 'cat-1',
  name: 'Kran taʼmirlash',
  basePrice: 120_000,
  groupId: 'group-1',
  media: [],
  group: { name: 'Santexnika' },
  _count: { masters: 0 },
  summary: null,
  details: null,
  includes: [],
  excludes: [],
  description: null,
  priceKind: ServicePriceKind.FIXED,
  durationMinutes: null,
  complexityLevel: ComplexityLevel.SIMPLE,
  iconKey: null,
  isActive: true,
  sortOrder: 0,
};

describe('AdminCatalogService — qisman yangilash', () => {
  let prisma: {
    serviceCategory: { findUnique: jest.Mock; update: jest.Mock; create: jest.Mock };
    serviceMedia: { findMany: jest.Mock };
  };
  let service: AdminCatalogService;

  beforeEach(() => {
    prisma = {
      serviceCategory: {
        findUnique: jest.fn().mockResolvedValue(existing),
        update: jest.fn().mockResolvedValue({ ...existing, basePrice: 150_000 }),
        create: jest.fn().mockResolvedValue(existing),
      },
      serviceMedia: { findMany: jest.fn().mockResolvedValue([]) },
    };

    service = new AdminCatalogService(
      prisma as unknown as PrismaService,
      { invalidateAll: jest.fn().mockResolvedValue(undefined) } as unknown as CatalogCacheService,
      { record: jest.fn().mockResolvedValue(undefined) } as unknown as AuditService,
      {} as MediaStorageService,
    );
  });

  const patch = (dto: Partial<UpsertCategoryDto>) =>
    service.updateCategory(
      'cat-1',
      { name: 'Kran taʼmirlash', basePrice: 150_000, ...dto },
      ADMIN,
      CONTEXT,
    );

  it('yuborilmagan guruhga TEGMAYDI', async () => {
    // Jonli serverda aynan shu xato xizmatni guruhdan chiqarib yuborgandi
    // va u mijoz katalogidan butunlay yoʻqolgandi.
    await patch({});

    const data = prisma.serviceCategory.update.mock.calls[0][0].data as Record<string, unknown>;
    expect(data).not.toHaveProperty('groupId');
  });

  it('yuborilmagan roʻyxatlarni tozalamaydi', async () => {
    await patch({});

    const data = prisma.serviceCategory.update.mock.calls[0][0].data as Record<string, unknown>;
    expect(data).not.toHaveProperty('includes');
    expect(data).not.toHaveProperty('excludes');
  });

  it('yuborilgan maydonni yangilaydi', async () => {
    await patch({ groupId: 'group-2', includes: ['Usta chiqishi'] });

    const data = prisma.serviceCategory.update.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.groupId).toBe('group-2');
    expect(data.includes).toEqual(['Usta chiqishi']);
  });

  it('boʻsh satr yuborilsa qiymat TOZALANADI — bu ataylab qilingan amal', async () => {
    await patch({ summary: '' });

    const data = prisma.serviceCategory.update.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.summary).toBeNull();
  });

  it('nom va narx har doim yoziladi', async () => {
    await patch({});

    const data = prisma.serviceCategory.update.mock.calls[0][0].data as Record<string, unknown>;
    expect(data).toMatchObject({ name: 'Kran taʼmirlash', basePrice: 150_000 });
  });
});
