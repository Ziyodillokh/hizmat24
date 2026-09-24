import { ActorType, AuditAction, CancelledBy, MasterStatus, UserStatus } from '@prisma/client';
import { AdminPeopleService } from './admin-people.service';

const ADMIN = { id: 'admin-1' } as never;
const CONTEXT = { ipAddress: '127.0.0.1', userAgent: 'test' };
const USER = '11111111-1111-4111-8111-111111111111';

const dbUser = (patch: Record<string, unknown> = {}) => ({
  id: USER,
  fullName: 'Dilshod',
  phoneNumber: '+998901234567',
  status: UserStatus.ACTIVE,
  createdAt: new Date('2026-09-01T10:00:00.000Z'),
  master: null,
  _count: { orders: 4 },
  ...patch,
});

describe('AdminPeopleService', () => {
  let service: AdminPeopleService;
  let userFind: jest.Mock;
  let userFindMany: jest.Mock;
  let userUpdate: jest.Mock;
  let masterFind: jest.Mock;
  let masterFindMany: jest.Mock;
  let orderGroupBy: jest.Mock;
  let record: jest.Mock;

  beforeEach(() => {
    userFind = jest.fn().mockResolvedValue(dbUser());
    userFindMany = jest.fn().mockResolvedValue([dbUser()]);
    userUpdate = jest.fn().mockResolvedValue({});
    masterFind = jest.fn().mockResolvedValue({ phoneNumber: '+998931112233' });
    masterFindMany = jest.fn().mockResolvedValue([]);
    orderGroupBy = jest.fn().mockResolvedValue([]);
    record = jest.fn().mockResolvedValue(undefined);

    const tx = { user: { update: userUpdate } };
    const prisma = {
      user: { findUnique: userFind, findMany: userFindMany },
      master: { findUnique: masterFind, findMany: masterFindMany },
      order: { groupBy: orderGroupBy },
      $transaction: (fn: (client: typeof tx) => unknown) => fn(tx),
    };

    service = new AdminPeopleService(prisma as never, { record } as never);
  });

  describe('roʻyxat', () => {
    /*
     * Panelga kirgan odam minglab raqamni koʻchirib ololmasligi kerak:
     * roʻyxatda raqam DOIM maskalangan.
     */
    it('telefon raqami maskalangan holda qaytadi', async () => {
      const rows = await service.listUsers();

      expect(rows[0].phoneMasked).toBe('+998 90 *** ** 67');
      expect(JSON.stringify(rows[0])).not.toContain('901234567');
    });

    it('qidiruv telefon va ism boʻyicha ishlaydi', async () => {
      await service.listUsers('dil');

      expect(userFindMany.mock.calls[0][0].where.OR).toHaveLength(2);
    });

    it('usta hisobi bor foydalanuvchi belgilanadi', async () => {
      userFindMany.mockResolvedValue([dbUser({ master: { id: 'm-1' } })]);

      expect((await service.listUsers())[0].isMaster).toBe(true);
    });
  });

  describe('toʻliq raqamni ochish', () => {
    it('raqamni beradi va auditga yozadi', async () => {
      const result = await service.revealPhone('user', USER, ADMIN, CONTEXT);

      expect(result.phoneNumber).toBe('+998901234567');
      expect(record.mock.calls[0][0].action).toBe(AuditAction.PII_VIEWED);
      expect(record.mock.calls[0][0].actorType).toBe(ActorType.ADMIN);
      expect(record.mock.calls[0][0].metadata).toMatchObject({ kind: 'user', field: 'phoneNumber' });
    });

    it('usta raqami ham shu yoʻldan ochiladi', async () => {
      const result = await service.revealPhone('master', 'm-1', ADMIN, CONTEXT);

      expect(result.phoneNumber).toBe('+998931112233');
      expect(record.mock.calls[0][0].metadata).toMatchObject({ kind: 'master' });
    });

    it('topilmagan yozuvda audit yozilmaydi', async () => {
      userFind.mockResolvedValue(null);

      await expect(service.revealPhone('user', USER, ADMIN, CONTEXT)).rejects.toThrow('topilmadi');
      expect(record).not.toHaveBeenCalled();
    });
  });

  describe('bloklash', () => {
    it('holatni oʻzgartiradi va sababni auditga yozadi', async () => {
      await service.setUserBlocked(USER, true, 'Soxta buyurtmalar berdi', ADMIN, CONTEXT);

      expect(userUpdate.mock.calls[0][0].data.status).toBe(UserStatus.BLOCKED);
      expect(record.mock.calls[0][0].action).toBe(AuditAction.USER_BLOCKED);
      expect(record.mock.calls[0][0].metadata).toMatchObject({ reason: 'Soxta buyurtmalar berdi' });
    });

    it('blokdan chiqarish boshqa amal sifatida yoziladi', async () => {
      userFind.mockResolvedValue(dbUser({ status: UserStatus.BLOCKED }));

      await service.setUserBlocked(USER, false, 'Tekshiruv tugadi', ADMIN, CONTEXT);

      expect(record.mock.calls[0][0].action).toBe(AuditAction.USER_UNBLOCKED);
    });

    /*
     * Bir xil holatga qayta oʻtkazish audit logni maʼnosiz yozuvlar
     * bilan toʻldirardi.
     */
    it('holat oʻzgarmasa yozuv qilinmaydi', async () => {
      await expect(
        service.setUserBlocked(USER, false, 'sabab matni', ADMIN, CONTEXT),
      ).rejects.toThrow('faol');
      expect(userUpdate).not.toHaveBeenCalled();
    });
  });

  describe('ustalar roʻyxati', () => {
    const dbMaster = (patch: Record<string, unknown> = {}) => ({
      id: 'm-1',
      fullName: 'Sardor',
      phoneNumber: '+998931112233',
      isActive: true,
      status: MasterStatus.AVAILABLE,
      ratingAvg: 4.8,
      ratingCount: 10,
      completedOrdersCount: 9,
      profile: { availableSince: new Date() },
      _count: { categories: 7 },
      ...patch,
    });

    it('bekor qilish ulushi usta teggan ishlardan hisoblanadi', async () => {
      masterFindMany.mockResolvedValue([dbMaster()]);
      orderGroupBy.mockResolvedValue([{ masterId: 'm-1', _count: { _all: 1 } }]);

      const rows = await service.listMasters();

      expect(rows[0].cancelledByMasterCount).toBe(1);
      expect(rows[0].cancelRatePercent).toBe(10);
      expect(orderGroupBy.mock.calls[0][0].where.cancelledBy).toBe(CancelledBy.MASTER);
    });

    it('ishi yoʻq ustada foiz hisoblanmaydi', async () => {
      masterFindMany.mockResolvedValue([dbMaster({ completedOrdersCount: 0 })]);

      expect((await service.listMasters())[0].cancelRatePercent).toBeNull();
    });

    it('ustaning raqami ham maskalangan', async () => {
      masterFindMany.mockResolvedValue([dbMaster()]);

      expect((await service.listMasters())[0].phoneMasked).toBe('+998 93 *** ** 33');
    });

    it('smena holati profildan oʻqiladi', async () => {
      masterFindMany.mockResolvedValue([dbMaster({ profile: { availableSince: null } })]);

      expect((await service.listMasters())[0].isOnShift).toBe(false);
    });
  });
});
