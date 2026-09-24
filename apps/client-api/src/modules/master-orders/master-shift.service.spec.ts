import { MasterStatus } from '@prisma/client';
import { MasterShiftService } from './master-shift.service';

const MASTER = 'master-1';
const USER = 'user-1';
const CONTEXT = { ipAddress: '127.0.0.1', userAgent: 'test' };
const SINCE = new Date('2026-09-24T10:00:00.000Z');

describe('MasterShiftService', () => {
  let service: MasterShiftService;
  let profileFind: jest.Mock;
  let masterFind: jest.Mock;
  let masterUpdate: jest.Mock;
  let profileUpsert: jest.Mock;
  let txMasterUpdate: jest.Mock;
  let orderCount: jest.Mock;
  let record: jest.Mock;

  beforeEach(() => {
    profileFind = jest.fn().mockResolvedValue({ availableSince: null });
    masterFind = jest.fn().mockResolvedValue({ status: MasterStatus.OFFLINE });
    masterUpdate = jest.fn().mockResolvedValue({});
    profileUpsert = jest.fn().mockResolvedValue({});
    txMasterUpdate = jest.fn().mockResolvedValue({});
    orderCount = jest.fn().mockResolvedValue(0);
    record = jest.fn().mockResolvedValue(undefined);

    const tx = {
      masterProfile: { upsert: profileUpsert },
      master: { update: txMasterUpdate },
    };
    const prisma = {
      masterProfile: { findUnique: profileFind },
      master: { findUnique: masterFind, update: masterUpdate },
      order: { count: orderCount },
      $transaction: (fn: (client: typeof tx) => unknown) => fn(tx),
    };

    service = new MasterShiftService(prisma as never, { record } as never);
  });

  describe('oʻqish', () => {
    it('yopiq smena', async () => {
      expect(await service.read(MASTER)).toEqual({ isOpen: false, since: null });
    });

    it('ochiq smena boshlanish vaqti bilan', async () => {
      profileFind.mockResolvedValue({ availableSince: SINCE });
      masterFind.mockResolvedValue({ status: MasterStatus.AVAILABLE });

      expect(await service.read(MASTER)).toEqual({ isOpen: true, since: SINCE.toISOString() });
    });

    /*
     * Haqiqat manbai — `available_since`, lekin qidiruv `masters.status`
     * ni oʻqiydi. Ikkalasi ajralib qolsa, ekran «smenadasiz» deb turib
     * ustaga bitta ham taklif kelmasdi — tushuntirib boʻlmaydigan holat.
     */
    it('ochiq smenada OFFLINE qolgan holat tuzatiladi', async () => {
      profileFind.mockResolvedValue({ availableSince: SINCE });
      masterFind.mockResolvedValue({ status: MasterStatus.OFFLINE });

      await service.read(MASTER);

      expect(masterUpdate).toHaveBeenCalledWith({
        where: { id: MASTER },
        data: { status: MasterStatus.AVAILABLE },
      });
    });

    it('yopiq smenada AVAILABLE qolgan holat ham tuzatiladi', async () => {
      masterFind.mockResolvedValue({ status: MasterStatus.AVAILABLE });

      await service.read(MASTER);

      expect(masterUpdate.mock.calls[0][0].data.status).toBe(MasterStatus.OFFLINE);
    });

    /** Band ustaga TEGILMAYDI: uning holati ish tugagach tiklanadi. */
    it('band usta holati oʻzgartirilmaydi', async () => {
      profileFind.mockResolvedValue({ availableSince: SINCE });
      masterFind.mockResolvedValue({ status: MasterStatus.BUSY });

      await service.read(MASTER);

      expect(masterUpdate).not.toHaveBeenCalled();
    });

    it('holat mos boʻlsa keraksiz yozuv qilinmaydi', async () => {
      profileFind.mockResolvedValue({ availableSince: SINCE });
      masterFind.mockResolvedValue({ status: MasterStatus.AVAILABLE });

      await service.read(MASTER);

      expect(masterUpdate).not.toHaveBeenCalled();
    });
  });

  describe('yozish', () => {
    it('smenani ochadi va ustani AVAILABLE qiladi', async () => {
      const view = await service.set(MASTER, USER, true, CONTEXT);

      expect(view.isOpen).toBe(true);
      expect(txMasterUpdate.mock.calls[0][0].data.status).toBe(MasterStatus.AVAILABLE);
      expect(profileUpsert.mock.calls[0][0].update.availableSince).toBeInstanceOf(Date);
    });

    it('smenani yopadi va boshlanish vaqtini tozalaydi', async () => {
      const view = await service.set(MASTER, USER, false, CONTEXT);

      expect(view).toEqual({ isOpen: false, since: null });
      expect(txMasterUpdate.mock.calls[0][0].data.status).toBe(MasterStatus.OFFLINE);
      expect(profileUpsert.mock.calls[0][0].update.availableSince).toBeNull();
    });

    /*
     * Faol ishi bor usta smenani yopsa ham ishni yakunlashi kerak: uni
     * yarim yoʻlda tashlab ketish mijozni kutib qoldirardi. Shuning
     * uchun `BUSY` holat tegilmaydi.
     */
    it('faol ishi bor ustaning holati tegilmaydi', async () => {
      orderCount.mockResolvedValue(1);

      await service.set(MASTER, USER, false, CONTEXT);

      expect(txMasterUpdate).not.toHaveBeenCalled();
      expect(profileUpsert).toHaveBeenCalled();
    });

    it('oʻzgarish auditga yoziladi', async () => {
      await service.set(MASTER, USER, true, CONTEXT);

      expect(record.mock.calls[0][0].metadata).toMatchObject({ masterId: MASTER, isOpen: true });
      expect(record.mock.calls[0][1]).toBeDefined();
    });
  });
});
