import { ActorType, AuditAction, SafetyAlertStatus, SafetyResolution } from '@prisma/client';
import { AdminSafetyService } from './admin-safety.service';

const ADMIN = { id: 'admin-1' } as never;
const CONTEXT = { ipAddress: '127.0.0.1', userAgent: 'test' };
const ALERT = '22222222-2222-4222-8222-222222222222';
const MASTER = '33333333-3333-4333-8333-333333333333';

const dbAlert = (patch: Record<string, unknown> = {}) => ({
  id: ALERT,
  status: SafetyAlertStatus.OPEN,
  orderId: 'order-1',
  clientId: 'client-1',
  masterId: MASTER,
  clientNote: 'Kelgan odam suratdagiga oʻxshamadi',
  resolution: null,
  resolutionNote: null,
  resolvedByAdminId: null,
  createdAt: new Date('2026-09-24T10:00:00.000Z'),
  resolvedAt: null,
  order: {
    shortId: 'HZ-104901',
    client: { fullName: 'Dilshod', phoneNumber: '+998901234567' },
    master: { id: MASTER, fullName: 'Sardor', phoneNumber: '+998931112233', isActive: true },
  },
  ...patch,
});

describe('AdminSafetyService', () => {
  let service: AdminSafetyService;
  let alertFind: jest.Mock;
  let alertFindMany: jest.Mock;
  let alertCount: jest.Mock;
  let alertUpdate: jest.Mock;
  let masterFind: jest.Mock;
  let masterUpdate: jest.Mock;
  let record: jest.Mock;

  beforeEach(() => {
    alertFind = jest.fn().mockResolvedValue(dbAlert());
    alertFindMany = jest.fn().mockResolvedValue([dbAlert()]);
    alertCount = jest.fn().mockResolvedValue(2);
    alertUpdate = jest.fn().mockResolvedValue({});
    masterFind = jest.fn().mockResolvedValue({ id: MASTER, fullName: 'Sardor', isActive: true });
    masterUpdate = jest.fn().mockResolvedValue({ id: MASTER, fullName: 'Sardor', isActive: false });
    record = jest.fn().mockResolvedValue(undefined);

    const tx = { safetyAlert: { update: alertUpdate }, master: { update: masterUpdate } };
    const prisma = {
      safetyAlert: { findUnique: alertFind, findMany: alertFindMany, count: alertCount },
      master: { findUnique: masterFind },
      $transaction: (fn: (client: typeof tx) => unknown) => fn(tx),
    };

    service = new AdminSafetyService(prisma as never, { record } as never);
  });

  describe('roʻyxat', () => {
    it('ochiq signallar soni bilan qaytadi', async () => {
      const page = await service.list();

      expect(page.items).toHaveLength(1);
      expect(page.openCount).toBe(2);
      expect(page.items[0].orderShortId).toBe('HZ-104901');
    });

    it('usta bloklanganmi — operator qaytadan bloklamasligi uchun koʻrinadi', async () => {
      expect((await service.list()).items[0].masterIsActive).toBe(true);
    });
  });

  describe('yopish', () => {
    it('natija, izoh va kim yopgani yoziladi', async () => {
      alertFind
        .mockResolvedValueOnce({ status: SafetyAlertStatus.OPEN, orderId: 'order-1', masterId: MASTER })
        .mockResolvedValueOnce(
          dbAlert({ status: SafetyAlertStatus.RESOLVED, resolution: SafetyResolution.CONFIRMED }),
        );

      const view = await service.resolve(
        ALERT,
        SafetyResolution.CONFIRMED,
        'Mijoz bilan gaplashdim',
        ADMIN,
        CONTEXT,
      );

      expect(alertUpdate.mock.calls[0][0].data).toMatchObject({
        status: SafetyAlertStatus.RESOLVED,
        resolution: SafetyResolution.CONFIRMED,
        resolvedByAdminId: 'admin-1',
      });
      expect(record.mock.calls[0][0].action).toBe(AuditAction.SAFETY_ALERT_RESOLVED);
      expect(record.mock.calls[0][0].actorType).toBe(ActorType.ADMIN);
      // Tasdiqlangan hodisada panel bloklashni TAKLIF qiladi; qaror odamniki.
      expect(view.suggestsBlock).toBe(true);
    });

    it('yolgʻon signalda bloklash taklif qilinmaydi', async () => {
      alertFind
        .mockResolvedValueOnce({ status: SafetyAlertStatus.OPEN, orderId: 'order-1', masterId: MASTER })
        .mockResolvedValueOnce(
          dbAlert({ status: SafetyAlertStatus.RESOLVED, resolution: SafetyResolution.FALSE_ALARM }),
        );

      const view = await service.resolve(ALERT, SafetyResolution.FALSE_ALARM, 'Tekshirdim', ADMIN, CONTEXT);

      expect(view.suggestsBlock).toBe(false);
    });

    it('yopilgan signal ikkinchi marta yopilmaydi', async () => {
      alertFind.mockResolvedValue({
        status: SafetyAlertStatus.RESOLVED,
        orderId: 'order-1',
        masterId: MASTER,
      });

      await expect(
        service.resolve(ALERT, SafetyResolution.CONFIRMED, 'izoh matni', ADMIN, CONTEXT),
      ).rejects.toThrow('allaqachon');
      expect(alertUpdate).not.toHaveBeenCalled();
    });

    /*
     * Buyurtma holati bu yerdan OʻZGARTIRILMAYDI: `SAFETY_FLAGGED`
     * terminal holat va hodisa tarixda oʻz holicha qolishi kerak.
     */
    it('buyurtma holatiga TEGILMAYDI', async () => {
      alertFind
        .mockResolvedValueOnce({ status: SafetyAlertStatus.OPEN, orderId: 'order-1', masterId: MASTER })
        .mockResolvedValueOnce(dbAlert({ status: SafetyAlertStatus.RESOLVED }));

      await service.resolve(ALERT, SafetyResolution.NO_CONTACT, 'Bogʻlana olmadim', ADMIN, CONTEXT);

      // Faqat signal yangilandi; buyurtma yozuvlariga soʻrov yuborilmadi.
      expect(alertUpdate).toHaveBeenCalledTimes(1);
      expect(masterUpdate).not.toHaveBeenCalled();
    });
  });

  describe('usta bloklash', () => {
    /** Bloklash AVTOMATIK emas — operator tugmani alohida bosadi (5.4). */
    it('sabab bilan bloklaydi va auditga yozadi', async () => {
      const result = await service.setMasterActive(
        MASTER,
        false,
        'Xavfsizlik signali tasdiqlandi',
        ADMIN,
        CONTEXT,
      );

      expect(result.isActive).toBe(false);
      expect(record.mock.calls[0][0].action).toBe(AuditAction.MASTER_BLOCKED);
      expect(record.mock.calls[0][0].metadata).toMatchObject({ masterId: MASTER });
    });

    it('blokdan chiqarish boshqa amal sifatida yoziladi', async () => {
      masterFind.mockResolvedValue({ id: MASTER, fullName: 'Sardor', isActive: false });
      masterUpdate.mockResolvedValue({ id: MASTER, fullName: 'Sardor', isActive: true });

      await service.setMasterActive(MASTER, true, 'Tekshiruv tugadi', ADMIN, CONTEXT);

      expect(record.mock.calls[0][0].action).toBe(AuditAction.MASTER_UNBLOCKED);
    });

    it('holat oʻzgarmasa keraksiz yozuv qilinmaydi', async () => {
      await expect(
        service.setMasterActive(MASTER, true, 'sabab matni', ADMIN, CONTEXT),
      ).rejects.toThrow('allaqachon faol');
      expect(masterUpdate).not.toHaveBeenCalled();
    });

    it('topilmagan usta aniq xato beradi', async () => {
      masterFind.mockResolvedValue(null);

      await expect(
        service.setMasterActive(MASTER, false, 'sabab matni', ADMIN, CONTEXT),
      ).rejects.toThrow('topilmadi');
    });
  });
});
