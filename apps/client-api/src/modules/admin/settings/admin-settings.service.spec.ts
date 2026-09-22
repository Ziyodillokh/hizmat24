import { ActorType, AuditAction } from '@prisma/client';
import { AdminSettingsService } from './admin-settings.service';

const ADMIN = { id: 'admin-1' } as never;
const CONTEXT = { ipAddress: '127.0.0.1', userAgent: 'test' };

const AREA = {
  id: 'area-1',
  cityName: 'Namangan',
  centerLat: 40.9983,
  centerLng: 71.6726,
  radiusKm: 12,
  isActive: true,
  sortOrder: 0,
  updatedAt: new Date(),
};

describe('AdminSettingsService', () => {
  let service: AdminSettingsService;
  let findUnique: jest.Mock;
  let update: jest.Mock;
  let record: jest.Mock;

  beforeEach(() => {
    findUnique = jest.fn().mockResolvedValue(AREA);
    update = jest.fn().mockImplementation(({ data }) => ({ ...AREA, ...data }));
    record = jest.fn().mockResolvedValue(undefined);

    const tx = { serviceArea: { update } };
    const prisma = {
      serviceArea: { findUnique, findMany: jest.fn() },
      $transaction: (fn: (client: typeof tx) => unknown) => fn(tx),
    };

    service = new AdminSettingsService(prisma as never, { record } as never);
  });

  const patch = (dto: Record<string, unknown>) =>
    service.updateArea('area-1', dto, ADMIN, CONTEXT);

  /*
   * Panelda radius alohida, shahar nomi alohida oʻzgartiriladi. Yuborilmagan
   * maydon Prismaga UMUMAN ketmasligi kerak — aks holda radiusni yangilash
   * shahar nomini boʻshatib yuborardi.
   */
  it('yuborilmagan maydonga TEGMAYDI', async () => {
    await patch({ radiusKm: 20 });

    expect(update.mock.calls[0][0].data).toEqual({ radiusKm: 20 });
  });

  it('shahar nomidagi ortiqcha boʻshliqni olib tashlaydi', async () => {
    await patch({ cityName: '  Chust  ' });

    expect(update.mock.calls[0][0].data).toEqual({ cityName: 'Chust' });
  });

  it('hududni oʻchirish ham qabul qilinadi', async () => {
    await patch({ isActive: false });

    expect(update.mock.calls[0][0].data).toEqual({ isActive: false });
  });

  it('oʻzgarish auditga oldingi va yangi qiymat bilan yoziladi', async () => {
    await patch({ radiusKm: 20 });

    const entry = record.mock.calls[0][0];
    expect(entry.action).toBe(AuditAction.SERVICE_AREA_UPDATED);
    expect(entry.actorType).toBe(ActorType.ADMIN);
    expect(entry.metadata.before.radiusKm).toBe(12);
    expect(entry.metadata.after.radiusKm).toBe(20);
  });

  it('audit yozuvi oʻzgarish bilan BITTA tranzaksiyada', async () => {
    await patch({ radiusKm: 20 });

    // `record` ga tranzaksiya klienti uzatiladi — aks holda oʻzgarish
    // yozilib, audit yozuvi tushib qolishi mumkin edi.
    expect(record.mock.calls[0][1]).toBeDefined();
  });

  it('mavjud boʻlmagan hudud aniq xato beradi', async () => {
    findUnique.mockResolvedValue(null);

    await expect(patch({ radiusKm: 20 })).rejects.toThrow('Hudud topilmadi');
    expect(update).not.toHaveBeenCalled();
  });
});
