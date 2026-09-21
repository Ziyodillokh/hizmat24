import { MasterApplicationStatus, MasterExperienceLevel, Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '@shared/index';
import type { AuditService } from '@client/modules/audit/audit.service';
import type { PrismaService } from '@client/infra/prisma/prisma.service';
import { MasterApplicationsService } from './master-applications.service';
import type { SubmitApplicationDto } from './dto/submit-application.dto';
import {
  DuplicatePendingApplicationException,
  InvalidApplicationException,
  MasterLinkConflictException,
  UnknownServiceCategoryException,
} from './application.exceptions';

const CATEGORY_ID = '11111111-1111-4111-8111-111111111111';
const USER: AuthenticatedUser = { id: 'user-1', phoneNumber: '+998901112233' };
const CONTEXT = { ipAddress: '10.0.0.5', userAgent: 'jest' };

const dto = (overrides: Partial<SubmitApplicationDto> = {}): SubmitApplicationDto => ({
  fullName: 'Alisher Karimov',
  profession: 'Santexnik',
  experienceLevel: MasterExperienceLevel.EXPERIENCED,
  claimsCertificate: true,
  about: 'Sakkiz yildan beri santexnika bilan shugʻullanaman, quvur va smesitel almashtiraman.',
  districts: ['Chilonzor'],
  workFrom: 9,
  workTo: 18,
  requestedCategoryIds: [CATEGORY_ID],
  ...overrides,
});

const storedApplication = (overrides: Record<string, unknown> = {}) => ({
  id: 'app-1',
  status: MasterApplicationStatus.PENDING,
  rejectionReason: null,
  createdAt: new Date('2026-09-23T08:00:00.000Z'),
  reviewedAt: null,
  ...overrides,
});

describe('MasterApplicationsService', () => {
  let prisma: {
    masterApplication: { create: jest.Mock; findFirst: jest.Mock };
    master: { findUnique: jest.Mock };
    serviceCategory: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { record: jest.Mock };
  let service: MasterApplicationsService;

  beforeEach(() => {
    prisma = {
      masterApplication: {
        create: jest.fn().mockResolvedValue(storedApplication()),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      master: { findUnique: jest.fn().mockResolvedValue(null) },
      serviceCategory: { findMany: jest.fn().mockResolvedValue([{ id: CATEGORY_ID }]) },
      $transaction: jest.fn((run: (tx: unknown) => unknown) => run(prisma)),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };

    service = new MasterApplicationsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  describe('submit', () => {
    it('arizani saqlaydi va telefonni TOKENDAN oladi', async () => {
      const view = await service.submit(USER, dto(), CONTEXT);

      expect(view).toEqual({
        id: 'app-1',
        status: MasterApplicationStatus.PENDING,
        rejectionReason: null,
        createdAt: new Date('2026-09-23T08:00:00.000Z'),
        reviewedAt: null,
      });
      expect(prisma.masterApplication.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', phoneNumber: '+998901112233' }),
        }),
      );
    });

    it('audit yozuvini TRANZAKSIYA ichida qoʻyadi', async () => {
      await service.submit(USER, dto(), CONTEXT);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ ipAddress: '10.0.0.5', userAgent: 'jest' }),
        prisma,
      );
    });

    it('sof mantiq qoidasi buzilsa 400 beradi va bazaga tegmaydi', async () => {
      await expect(service.submit(USER, dto({ workFrom: 9, workTo: 9 }), CONTEXT)).rejects.toThrow(
        InvalidApplicationException,
      );
      expect(prisma.masterApplication.create).not.toHaveBeenCalled();
    });

    it('usta boʻlib boʻlgan odamga ariza berishga ruxsat bermaydi', async () => {
      prisma.master.findUnique.mockResolvedValue({ id: 'master-1' });

      await expect(service.submit(USER, dto(), CONTEXT)).rejects.toThrow(
        MasterLinkConflictException,
      );
    });

    it('katalogda yoʻq xizmat soʻralsa rad etadi', async () => {
      prisma.serviceCategory.findMany.mockResolvedValue([]);

      await expect(service.submit(USER, dto(), CONTEXT)).rejects.toThrow(
        UnknownServiceCategoryException,
      );
    });

    it('takroriy kutayotgan ariza 409 bilan qaytariladi (baza indeksi)', async () => {
      prisma.masterApplication.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.submit(USER, dto(), CONTEXT)).rejects.toThrow(
        DuplicatePendingApplicationException,
      );
    });

    it('boshqa baza xatosi yashirilmaydi', async () => {
      prisma.masterApplication.create.mockRejectedValue(new Error('ulanish uzildi'));

      await expect(service.submit(USER, dto(), CONTEXT)).rejects.toThrow('ulanish uzildi');
    });
  });

  describe('findMine', () => {
    it('ariza boʻlmasa null qaytaradi — bu xato emas', async () => {
      await expect(service.findMine('user-1')).resolves.toBeNull();
    });

    it('rad etilgan arizaning SABABINI qaytaradi', async () => {
      prisma.masterApplication.findFirst.mockResolvedValue(
        storedApplication({
          status: MasterApplicationStatus.REJECTED,
          rejectionReason: 'Sertifikat nusxasi oʻqilmadi',
          reviewedAt: new Date('2026-09-24T08:00:00.000Z'),
        }),
      );

      const view = await service.findMine('user-1');

      expect(view?.rejectionReason).toBe('Sertifikat nusxasi oʻqilmadi');
    });

    it('eng oxirgi arizani oladi', async () => {
      await service.findMine('user-1');

      expect(prisma.masterApplication.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});
