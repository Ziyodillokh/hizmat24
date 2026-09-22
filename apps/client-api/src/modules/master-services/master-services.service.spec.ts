import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuditAction, ComplexityLevel } from '@prisma/client';
import type { AuditService } from '@client/modules/audit/audit.service';
import type { PrismaService } from '@client/infra/prisma/prisma.service';
import { MasterServicesService } from './master-services.service';

const CONTEXT = { ipAddress: '10.0.0.1', userAgent: 'jest' };
const CAT = (id: string, name: string) => ({
  id,
  name,
  summary: null,
  basePrice: 100_000,
  complexityLevel: ComplexityLevel.SIMPLE,
  group: { name: 'Santexnika' },
});

describe('MasterServicesService', () => {
  let prisma: {
    master: { findUnique: jest.Mock };
    serviceCategory: { findMany: jest.Mock };
    masterServiceCategory: { findMany: jest.Mock; updateMany: jest.Mock; upsert: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let service: MasterServicesService;

  beforeEach(() => {
    prisma = {
      master: { findUnique: jest.fn().mockResolvedValue({ id: 'master-1', isActive: true }) },
      serviceCategory: {
        findMany: jest.fn().mockResolvedValue([CAT('cat-1', 'Kran'), CAT('cat-2', 'Unitaz')]),
      },
      masterServiceCategory: {
        findMany: jest.fn().mockResolvedValue([
          { masterId: 'master-1', categoryId: 'cat-1', isEnabled: true },
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        upsert: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    service = new MasterServicesService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  describe('findMasterId', () => {
    it('bogʻlangan usta yozuvini topadi', async () => {
      await expect(service.findMasterId('user-1')).resolves.toBe('master-1');
    });

    it('usta bloklangan boʻlsa null — kirish yopiq', async () => {
      prisma.master.findUnique.mockResolvedValue({ id: 'master-1', isActive: false });
      await expect(service.findMasterId('user-1')).resolves.toBeNull();
    });

    it('usta yozuvi yoʻq boʻlsa null (ariza tasdiqlanmagan)', async () => {
      prisma.master.findUnique.mockResolvedValue(null);
      await expect(service.findMasterId('user-1')).resolves.toBeNull();
    });
  });

  describe('list', () => {
    it('roʻyxat KATALOGdan quriladi — yangi xizmat darhol koʻrinadi', async () => {
      const result = await service.list('master-1');

      expect(result).toHaveLength(2);
      expect(result.map((item) => item.categoryId)).toEqual(['cat-1', 'cat-2']);
    });

    it('usta javob bermagan xizmat yoqilmagan va `isNew` deb belgilanadi', async () => {
      const [known, fresh] = await service.list('master-1');

      expect(known).toMatchObject({ isEnabled: true, isNew: false });
      // Hech kim soʻramagan ishni avtomatik yoqib qoʻymaymiz.
      expect(fresh).toMatchObject({ isEnabled: false, isNew: true });
    });

    it('faqat FAOL xizmatlarni soʻraydi', async () => {
      await service.list('master-1');
      expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
    });
  });

  describe('replace', () => {
    beforeEach(() => {
      prisma.serviceCategory.findMany.mockImplementation(
        ({ where }: { where: { id?: { in: string[] } } }) =>
          Promise.resolve(
            where.id ? where.id.in.map((id) => ({ id })) : [CAT('cat-1', 'Kran'), CAT('cat-2', 'Unitaz')],
          ),
      );
    });

    it('boʻsh roʻyxatni rad etadi — usta ishsiz qolmasin', async () => {
      await expect(service.replace('master-1', [], 'user-1', CONTEXT)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('notanish xizmat boʻlsa amal BUTUNLAY rad etiladi', async () => {
      prisma.serviceCategory.findMany.mockResolvedValue([{ id: 'cat-1' }]);

      await expect(
        service.replace('master-1', ['cat-1', 'yoq'], 'user-1', CONTEXT),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('takroriy id larni birlashtiradi', async () => {
      await service.replace('master-1', ['cat-1', 'cat-1'], 'user-1', CONTEXT);

      expect(prisma.masterServiceCategory.upsert).toHaveBeenCalledTimes(1);
    });

    it('avval hammasini oʻchiradi, keyin tanlanganini yoqadi', async () => {
      await service.replace('master-1', ['cat-2'], 'user-1', CONTEXT);

      expect(prisma.masterServiceCategory.updateMany).toHaveBeenCalledWith({
        where: { masterId: 'master-1' },
        data: { isEnabled: false },
      });
      expect(prisma.masterServiceCategory.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: { isEnabled: true } }),
      );
    });

    it('oʻzgarish auditga tushadi', async () => {
      await service.replace('master-1', ['cat-1'], 'user-1', CONTEXT);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.MASTER_SERVICES_CHANGED,
          actorId: 'user-1',
          ipAddress: '10.0.0.1',
        }),
      );
    });
  });
});
