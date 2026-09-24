import { ActorType, AuditAction, CancelledBy, OrderStatus } from '@prisma/client';
import { AdminReportsService } from './admin-reports.service';

describe('AdminReportsService', () => {
  let service: AdminReportsService;
  let orderGroupBy: jest.Mock;
  let orderFindMany: jest.Mock;
  let orderCount: jest.Mock;
  let categoryFindMany: jest.Mock;
  let auditFindMany: jest.Mock;
  let auditCount: jest.Mock;

  beforeEach(() => {
    orderGroupBy = jest.fn().mockImplementation(({ by }: { by: string[] }) => {
      if (by[0] === 'status') {
        return Promise.resolve([
          { status: OrderStatus.CLOSED, _count: { _all: 4 } },
          { status: OrderStatus.CANCELLED, _count: { _all: 2 } },
        ]);
      }
      if (by[0] === 'categoryId') {
        return Promise.resolve([{ categoryId: 'cat-1', _count: { _all: 6 } }]);
      }
      return Promise.resolve([{ cancelledBy: CancelledBy.CLIENT, _count: { _all: 2 } }]);
    });
    orderFindMany = jest.fn().mockResolvedValue([]);
    orderCount = jest.fn().mockResolvedValue(1);
    categoryFindMany = jest.fn().mockResolvedValue([{ id: 'cat-1', name: 'Santexnika taʼmiri' }]);
    auditFindMany = jest.fn().mockResolvedValue([]);
    auditCount = jest.fn().mockResolvedValue(0);

    const prisma = {
      order: { groupBy: orderGroupBy, findMany: orderFindMany, count: orderCount },
      serviceCategory: { findMany: categoryFindMany },
      master: { count: jest.fn().mockResolvedValue(3) },
      masterProfile: { count: jest.fn().mockResolvedValue(1) },
      safetyAlert: { count: jest.fn().mockResolvedValue(2) },
      masterApplication: { count: jest.fn().mockResolvedValue(5) },
      auditLog: { findMany: auditFindMany, count: auditCount },
    };

    service = new AdminReportsService(prisma as never);
  });

  describe('stats', () => {
    it('holat boʻyicha sanaydi va jamini chiqaradi', async () => {
      const stats = await service.stats();

      expect(stats.ordersTotal).toBe(6);
      expect(stats.byStatus).toEqual([
        { status: OrderStatus.CLOSED, count: 4 },
        { status: OrderStatus.CANCELLED, count: 2 },
      ]);
    });

    it('kategoriya nomlari id oʻrniga qoʻyiladi', async () => {
      const stats = await service.stats();

      expect(stats.byCategory).toEqual([{ name: 'Santexnika taʼmiri', count: 6 }]);
    });

    it('bekor sabablari odam tilida', async () => {
      const stats = await service.stats();

      expect(stats.cancelReasons[0].name).toBe('Mijoz bekor qildi');
    });

    /*
     * `null` — bu davrda tayinlangan buyurtma yoʻq. Nol «bir zumda
     * tayinlandi» degan yolgʻon maʼnoni berardi.
     */
    it('tayinlangan buyurtma boʻlmasa oʻrtacha vaqt `null`', async () => {
      const stats = await service.stats();

      expect(stats.avgAssignSeconds).toBeNull();
    });

    it('oʻrtacha tayinlash vaqti soniyada hisoblanadi', async () => {
      orderFindMany.mockResolvedValue([
        {
          createdAt: new Date('2026-09-24T10:00:00.000Z'),
          assignedAt: new Date('2026-09-24T10:00:10.000Z'),
        },
        {
          createdAt: new Date('2026-09-24T11:00:00.000Z'),
          assignedAt: new Date('2026-09-24T11:00:20.000Z'),
        },
      ]);

      expect((await service.stats()).avgAssignSeconds).toBe(15);
    });

    it('ochiq muammolar bitta joyda sanaladi', async () => {
      const stats = await service.stats();

      expect(stats.openProblems).toEqual({
        escalatedOrders: 1,
        openSafetyAlerts: 2,
        pendingApplications: 5,
      });
    });

    it('davr berilmasa bugundan boshlanadi', async () => {
      const stats = await service.stats();
      const from = new Date(stats.from);

      expect(from.getHours()).toBe(0);
      expect(from.getMinutes()).toBe(0);
    });
  });

  describe('audit', () => {
    it('filtrlar soʻrovga tushadi', async () => {
      await service.audit({ action: AuditAction.MASTER_BLOCKED, actorType: ActorType.ADMIN });

      const where = auditFindMany.mock.calls[0][0].where;
      expect(where.action).toBe(AuditAction.MASTER_BLOCKED);
      expect(where.actorType).toBe(ActorType.ADMIN);
    });

    it('sana oraligʻi qoʻllanadi', async () => {
      await service.audit({ from: '2026-09-01T00:00:00.000Z' });

      expect(auditFindMany.mock.calls[0][0].where.createdAt.gte).toBeInstanceOf(Date);
    });
  });

  describe('auditCsv', () => {
    /*
     * Izohlarda vergul ham, qator koʻchirish ham uchraydi — qoʻshtirnoqsiz
     * fayl buzilardi va uni Excel notoʻgʻri oʻqirdi.
     */
    it('maydonlar qoʻshtirnoq ichida va ichki qoʻshtirnoq ikkilanadi', async () => {
      auditFindMany.mockResolvedValue([
        {
          id: 'a-1',
          action: AuditAction.MASTER_BLOCKED,
          actorType: ActorType.ADMIN,
          actorId: 'admin-1',
          orderId: null,
          metadata: { reason: 'u "boshqa" odam edi, ishlamadi' },
          createdAt: new Date('2026-09-24T10:00:00.000Z'),
        },
      ]);

      const csv = await service.auditCsv({});
      const [header, row] = csv.split('\n');

      expect(header).toBe('"vaqt","amal","aktor","aktor_id","buyurtma","tafsilot"');
      expect(row.startsWith('"2026-09-24T10:00:00.000Z"')).toBe(true);

      // Har maydon qoʻshtirnoq ichida va ichkilari ikkilangan: faylni
      // qaytadan oʻqiganda izoh buzilmasligi kerak.
      const cells = row.match(/"(?:[^"]|"")*"/g) ?? [];
      expect(cells).toHaveLength(6);

      const metadata = cells[5].slice(1, -1).replace(/""/g, '"');
      expect(JSON.parse(metadata).reason).toBe('u "boshqa" odam edi, ishlamadi');
    });

    it('yozuv boʻlmasa faqat sarlavha qoladi', async () => {
      expect((await service.auditCsv({})).split('\n')).toHaveLength(1);
    });
  });
});
