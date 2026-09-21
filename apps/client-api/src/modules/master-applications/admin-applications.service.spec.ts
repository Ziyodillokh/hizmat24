import {
  AdminRole,
  ActorType,
  AuditAction,
  MasterApplicationStatus,
  MasterExperienceLevel,
} from '@prisma/client';
import type { AuditService } from '@client/modules/audit/audit.service';
import type { PrismaService } from '@client/infra/prisma/prisma.service';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import { AdminApplicationsService } from './admin-applications.service';
import {
  ApplicationNotFoundException,
  InvalidApplicationTransitionException,
  MasterLinkConflictException,
  UnknownServiceCategoryException,
} from './application.exceptions';

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const CONTEXT = { ipAddress: '10.0.0.7', userAgent: 'jest' };

const ADMIN: AdminIdentity = {
  id: 'admin-1',
  email: 'moderator@hizmat24.uz',
  fullName: 'Moderator',
  role: AdminRole.MODERATOR,
  sections: ['dashboard', 'applications'],
  idleTimeoutSeconds: 1800,
};

const application = (overrides: Record<string, unknown> = {}) => ({
  id: 'app-1',
  userId: 'user-1',
  fullName: 'Alisher Karimov',
  phoneNumber: '+998901112233',
  profession: 'Santexnik',
  experienceLevel: MasterExperienceLevel.EXPERIENCED,
  claimsCertificate: true,
  about: 'Sakkiz yildan beri santexnika bilan shugʻullanaman va quvur almashtiraman.',
  districts: ['Chilonzor'],
  workFrom: 9,
  workTo: 18,
  requestedCategoryIds: [CATEGORY_ID],
  status: MasterApplicationStatus.PENDING,
  rejectionReason: null,
  reviewedByAdminId: null,
  reviewedAt: null,
  masterId: null,
  createdAt: new Date('2026-09-23T08:00:00.000Z'),
  updatedAt: new Date('2026-09-23T08:00:00.000Z'),
  ...overrides,
});

describe('AdminApplicationsService', () => {
  let prisma: {
    masterApplication: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      update: jest.Mock;
    };
    serviceCategory: { findMany: jest.Mock };
    master: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    masterServiceCategory: { createMany: jest.Mock };
    masterProfile: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let service: AdminApplicationsService;

  beforeEach(() => {
    prisma = {
      masterApplication: {
        findUnique: jest.fn().mockResolvedValue(application()),
        findMany: jest.fn().mockResolvedValue([application()]),
        count: jest.fn().mockResolvedValue(1),
        update: jest
          .fn()
          .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve(application(data)),
          ),
      },
      serviceCategory: { findMany: jest.fn().mockResolvedValue([{ id: CATEGORY_ID }]) },
      master: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'master-1' }),
        update: jest.fn().mockResolvedValue({ id: 'master-9' }),
      },
      masterServiceCategory: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      masterProfile: { upsert: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn((arg: unknown) =>
        Array.isArray(arg) ? Promise.all(arg) : (arg as (tx: unknown) => unknown)(prisma),
      ),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    service = new AdminApplicationsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  describe('listAssignableCategories', () => {
    it('faqat FAOL xizmatlarni soʻraydi — oʻchirilganini yangi ustaga biriktirib boʻlmaydi', async () => {
      prisma.serviceCategory.findMany.mockResolvedValue([
        { id: CATEGORY_ID, name: 'Kran taʼmiri', complexityLevel: 'SIMPLE', group: { name: 'Santexnika' } },
        { id: 'cat-2', name: 'Guruhsiz', complexityLevel: 'COMPLEX', group: null },
      ]);

      const result = await service.listAssignableCategories();

      expect(prisma.serviceCategory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isActive: true } }),
      );
      expect(result).toEqual([
        { id: CATEGORY_ID, name: 'Kran taʼmiri', groupName: 'Santexnika', complexityLevel: 'SIMPLE' },
        { id: 'cat-2', name: 'Guruhsiz', groupName: null, complexityLevel: 'COMPLEX' },
      ]);
    });
  });

  describe('list', () => {
    it('yangisidan eskisiga saralaydi va sahifa maʼlumotini qaytaradi', async () => {
      const result = await service.list({ page: 1, limit: 20 });

      expect(prisma.masterApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' }, skip: 0, take: 20 }),
      );
      expect(result.meta).toEqual({ total: 1, page: 1, limit: 20, totalPages: 1 });
    });

    it('holat filtri va qidiruv soʻrovga tushadi', async () => {
      await service.list({
        page: 1,
        limit: 20,
        status: MasterApplicationStatus.PENDING,
        search: 'Ali',
      });

      const [call] = prisma.masterApplication.findMany.mock.calls as [
        [{ where: { status: unknown; OR: unknown[] } }],
      ];

      expect(call[0].where.status).toBe(MasterApplicationStatus.PENDING);
      expect(call[0].where.OR).toHaveLength(2);
    });

    it('arizalar boʻlmasa ham sahifa soni kamida 1 — boʻsh «0/0» koʻrsatilmaydi', async () => {
      prisma.masterApplication.findMany.mockResolvedValue([]);
      prisma.masterApplication.count.mockResolvedValue(0);

      const result = await service.list({ page: 1, limit: 20 });

      expect(result.meta.totalPages).toBe(1);
      expect(result.items).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('ariza topilmasa 404', async () => {
      prisma.masterApplication.findUnique.mockResolvedValue(null);

      await expect(service.findOne('app-1')).rejects.toThrow(ApplicationNotFoundException);
    });

    it('kartada sertifikat DAʼVOSI alohida maydon sifatida qaytadi', async () => {
      const detail = await service.findOne('app-1');

      expect(detail.claimsCertificate).toBe(true);
    });
  });

  describe('approve', () => {
    it('usta yaratadi, xizmat biriktiradi va profil yozadi', async () => {
      const detail = await service.approve('app-1', { categoryIds: [CATEGORY_ID] }, ADMIN, CONTEXT);

      expect(prisma.master.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', phoneNumber: '+998901112233' }),
        }),
      );
      expect(prisma.masterServiceCategory.createMany).toHaveBeenCalledWith({
        data: [{ masterId: 'master-1', categoryId: CATEGORY_ID }],
        skipDuplicates: true,
      });
      expect(prisma.masterProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { masterId: 'master-1' } }),
      );
      expect(detail.status).toBe(MasterApplicationStatus.APPROVED);
      expect(detail.masterId).toBe('master-1');
    });

    it('sertifikat DAʼVOSI tasdiqqa aylanmaydi — hasGovCertificate doim false', async () => {
      await service.approve('app-1', { categoryIds: [CATEGORY_ID] }, ADMIN, CONTEXT);

      const [call] = prisma.master.create.mock.calls as [
        [{ data: { hasGovCertificate: boolean } }],
      ];

      expect(call[0].data.hasGovCertificate).toBe(false);
    });

    it('hammasi BITTA tranzaksiyada va audit ham oʻsha yerda', async () => {
      await service.approve('app-1', { categoryIds: [CATEGORY_ID] }, ADMIN, CONTEXT);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.MASTER_APPLICATION_APPROVED,
          actorType: ActorType.ADMIN,
          actorId: 'admin-1',
          ipAddress: '10.0.0.7',
        }),
        prisma,
      );
    });

    it('eski, qoʻlda kiritilgan ustani ilova hisobiga bogʻlaydi', async () => {
      prisma.master.findUnique.mockImplementation(
        ({ where }: { where: { phoneNumber?: string } }) =>
          Promise.resolve(where.phoneNumber ? { id: 'master-9', userId: null } : null),
      );

      await service.approve('app-1', { categoryIds: [CATEGORY_ID] }, ADMIN, CONTEXT);

      expect(prisma.master.create).not.toHaveBeenCalled();
      expect(prisma.master.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'master-9' } }),
      );
    });

    it('telefon boshqa usta hisobida boʻlsa 409', async () => {
      prisma.master.findUnique.mockImplementation(
        ({ where }: { where: { phoneNumber?: string } }) =>
          Promise.resolve(where.phoneNumber ? { id: 'master-9', userId: 'user-2' } : null),
      );

      await expect(
        service.approve('app-1', { categoryIds: [CATEGORY_ID] }, ADMIN, CONTEXT),
      ).rejects.toThrow(MasterLinkConflictException);
    });

    it('koʻrib chiqilgan arizani qayta tasdiqlab boʻlmaydi', async () => {
      prisma.masterApplication.findUnique.mockResolvedValue(
        application({ status: MasterApplicationStatus.REJECTED }),
      );

      await expect(
        service.approve('app-1', { categoryIds: [CATEGORY_ID] }, ADMIN, CONTEXT),
      ).rejects.toThrow(InvalidApplicationTransitionException);
      expect(prisma.master.create).not.toHaveBeenCalled();
    });

    it('oʻchirilgan xizmat biriktirilmaydi', async () => {
      prisma.serviceCategory.findMany.mockResolvedValue([]);

      await expect(
        service.approve('app-1', { categoryIds: [CATEGORY_ID] }, ADMIN, CONTEXT),
      ).rejects.toThrow(UnknownServiceCategoryException);
    });
  });

  describe('reject', () => {
    it('sababni saqlaydi va uni kartada qaytaradi', async () => {
      const detail = await service.reject(
        'app-1',
        { reason: '  Sertifikat nusxasi oʻqilmadi  ' },
        ADMIN,
        CONTEXT,
      );

      expect(detail.status).toBe(MasterApplicationStatus.REJECTED);
      expect(detail.rejectionReason).toBe('Sertifikat nusxasi oʻqilmadi');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: AuditAction.MASTER_APPLICATION_REJECTED }),
        prisma,
      );
    });

    it('koʻrib chiqilgan arizani qayta rad etib boʻlmaydi', async () => {
      prisma.masterApplication.findUnique.mockResolvedValue(
        application({ status: MasterApplicationStatus.APPROVED }),
      );

      await expect(
        service.reject('app-1', { reason: 'Notoʻgʻri maʼlumot' }, ADMIN, CONTEXT),
      ).rejects.toThrow(InvalidApplicationTransitionException);
    });

    it('ariza topilmasa 404', async () => {
      prisma.masterApplication.findUnique.mockResolvedValue(null);

      await expect(
        service.reject('app-1', { reason: 'Notoʻgʻri maʼlumot' }, ADMIN, CONTEXT),
      ).rejects.toThrow(ApplicationNotFoundException);
    });
  });
});
