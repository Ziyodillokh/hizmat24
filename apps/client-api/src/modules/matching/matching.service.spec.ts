import { ComplexityLevel, MasterStatus, OrderStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  JOB_MASTER_ACK_TIMEOUT,
  JOB_MATCH_ORDER,
  MASTER_ACK_TIMEOUT_MS,
  MAX_ASSIGNMENT_ATTEMPTS,
  ORDER_EVENTS,
} from '@shared/index';
import { OrderEntity } from '@client/modules/orders/domain/order.entity';
import { MatchingService } from './matching.service';

const buildOrderRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'order-1',
  clientId: 'client-1',
  categoryId: 'category-1',
  masterId: null,
  status: OrderStatus.SEARCHING,
  isUrgent: false,
  addressLat: 41.3,
  addressLng: 69.2,
  assignmentAttempts: 0,
  masterAckedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  price: 100_000,
  queuePosition: null,
  category: { id: 'category-1', complexityLevel: ComplexityLevel.SIMPLE },
  ...overrides,
});

const buildEntity = (status: OrderStatus = OrderStatus.SEARCHING, masterId: string | null = null) =>
  OrderEntity.fromPersistence({
    id: 'order-1',
    clientId: 'client-1',
    masterId,
    categoryId: 'category-1',
    status,
    isUrgent: false,
    price: 100_000,
    queuePosition: null,
    assignmentAttempts: 0,
    masterAckedAt: null,
    createdAt: new Date(),
  });

describe('MatchingService (TZ 3.4)', () => {
  let service: MatchingService;
  let orderFindUnique: jest.Mock;
  let orderFindMany: jest.Mock;
  let orderUpdate: jest.Mock;
  let masterUpdateMany: jest.Mock;
  let orders: { findEntity: jest.Mock; applyTransition: jest.Mock };
  let finder: { findCandidates: jest.Mock; countActiveMastersInCategory: jest.Mock };
  let queuePosition: { add: jest.Mock; remove: jest.Mock; peek: jest.Mock };
  let audit: { record: jest.Mock };
  let queueAdd: jest.Mock;
  let events: EventEmitter2;

  beforeEach(() => {
    orderFindUnique = jest.fn().mockResolvedValue(buildOrderRow());
    orderFindMany = jest.fn().mockResolvedValue([]);
    orderUpdate = jest.fn().mockResolvedValue({});
    masterUpdateMany = jest.fn().mockResolvedValue({ count: 1 });

    orders = {
      findEntity: jest.fn().mockResolvedValue(buildEntity()),
      applyTransition: jest.fn().mockResolvedValue({}),
    };
    finder = {
      findCandidates: jest.fn().mockResolvedValue([]),
      countActiveMastersInCategory: jest.fn().mockResolvedValue(3),
    };
    queuePosition = {
      add: jest.fn().mockResolvedValue(2),
      remove: jest.fn().mockResolvedValue(undefined),
      peek: jest.fn().mockResolvedValue([]),
    };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    queueAdd = jest.fn().mockResolvedValue({});
    events = new EventEmitter2();
    jest.spyOn(events, 'emit');

    const prisma = {
      order: { findUnique: orderFindUnique, findMany: orderFindMany, update: orderUpdate },
      $transaction: jest
        .fn()
        .mockImplementation((callback: (tx: unknown) => unknown) =>
          callback({ master: { updateMany: masterUpdateMany } }),
        ),
    };

    service = new MatchingService(
      prisma as never,
      orders as never,
      finder as never,
      queuePosition as never,
      audit as never,
      events,
      { add: queueAdd } as never,
    );
  });

  describe('matchOrder', () => {
    it('mos usta topilganda buyurtmani tayinlaydi va ustani band qiladi', async () => {
      // Arrange
      finder.findCandidates.mockResolvedValue([{ id: 'master-1', distance_km: 3 }]);

      // Act
      const outcome = await service.matchOrder('order-1');

      // Assert
      expect(outcome).toEqual({ kind: 'assigned', masterId: 'master-1' });
      expect(masterUpdateMany).toHaveBeenCalledWith({
        where: { id: 'master-1', status: MasterStatus.AVAILABLE, isActive: true },
        data: { status: MasterStatus.BUSY },
      });
      expect(events.emit).toHaveBeenCalledWith(ORDER_EVENTS.ASSIGNED, expect.anything());
    });

    it("tayinlangandan keyin 3 daqiqalik javob taymerini qo'yadi", async () => {
      finder.findCandidates.mockResolvedValue([{ id: 'master-1', distance_km: 3 }]);

      await service.matchOrder('order-1');

      expect(queueAdd).toHaveBeenCalledWith(
        JOB_MASTER_ACK_TIMEOUT,
        expect.objectContaining({ orderId: 'order-1' }),
        expect.objectContaining({ delay: MASTER_ACK_TIMEOUT_MS }),
      );
    });

    it('ETA masofa asosida hisoblanadi', async () => {
      finder.findCandidates.mockResolvedValue([{ id: 'master-1', distance_km: 10 }]);

      await service.matchOrder('order-1');

      expect(orders.applyTransition).toHaveBeenCalledWith(
        expect.anything(),
        OrderStatus.ASSIGNED,
        expect.objectContaining({ data: expect.objectContaining({ etaMinutes: 30 }) }),
        expect.anything(),
      );
    });

    it("bo'sh usta bo'lmaganda navbatga qo'yadi va pozitsiyani xabar qiladi", async () => {
      // Act
      const outcome = await service.matchOrder('order-1');

      // Assert
      expect(outcome).toEqual({ kind: 'queued', queuePosition: 2 });
      expect(queuePosition.add).toHaveBeenCalledWith('order-1', expect.any(Date), false);
      expect(events.emit).toHaveBeenCalledWith(
        ORDER_EVENTS.QUEUED,
        expect.objectContaining({ queuePosition: 2 }),
      );
    });

    it("navbatdagi pozitsiya o'zgarmasa takroriy xabar yubormaydi", async () => {
      // Arrange: buyurtma allaqachon navbatda va o'sha pozitsiyada
      orderFindUnique.mockResolvedValue(
        buildOrderRow({ status: OrderStatus.SEARCHING_QUEUED, queuePosition: 2 }),
      );

      // Act
      await service.matchOrder('order-1');

      // Assert
      expect(events.emit).not.toHaveBeenCalledWith(ORDER_EVENTS.QUEUED, expect.anything());
      expect(orderUpdate).not.toHaveBeenCalled();
    });

    it('navbatda oldinga siljiganda yangi pozitsiyani xabar qiladi', async () => {
      // Arrange
      orderFindUnique.mockResolvedValue(
        buildOrderRow({ status: OrderStatus.SEARCHING_QUEUED, queuePosition: 5 }),
      );

      // Act
      await service.matchOrder('order-1');

      // Assert
      expect(orderUpdate).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { queuePosition: 2 },
      });
      expect(events.emit).toHaveBeenCalledWith(
        ORDER_EVENTS.QUEUED,
        expect.objectContaining({ queuePosition: 2 }),
      );
    });

    it("usta band bo'lib qolgan bo'lsa (poyga holati) tayinlamaydi", async () => {
      finder.findCandidates.mockResolvedValue([{ id: 'master-1', distance_km: 3 }]);
      masterUpdateMany.mockResolvedValue({ count: 0 });

      const outcome = await service.matchOrder('order-1');

      expect(outcome.kind).toBe('queued');
    });

    it("urinishlar chegarasi tugaganda admin panelga eskalatsiya qiladi (cheksiz tsikl yo'q)", async () => {
      // Arrange
      orderFindUnique.mockResolvedValue(
        buildOrderRow({ assignmentAttempts: MAX_ASSIGNMENT_ATTEMPTS }),
      );

      // Act
      const outcome = await service.matchOrder('order-1');

      // Assert
      expect(outcome.kind).toBe('skipped');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MATCHING_ESCALATED' }),
      );
      expect(events.emit).toHaveBeenCalledWith(ORDER_EVENTS.MATCHING_ESCALATED, expect.anything());
      expect(finder.findCandidates).not.toHaveBeenCalled();
      // Navbatdan chiqariladi, aks holda har sweep'da qayta eskalatsiya bo'lardi
      expect(queuePosition.remove).toHaveBeenCalledWith('order-1');
    });

    it.each([OrderStatus.CANCELLED, OrderStatus.IN_PROGRESS, OrderStatus.CLOSED])(
      '%s holatidagi buyurtmani qidirmaydi',
      async (status) => {
        orderFindUnique.mockResolvedValue(buildOrderRow({ status }));

        expect((await service.matchOrder('order-1')).kind).toBe('skipped');
        expect(finder.findCandidates).not.toHaveBeenCalled();
      },
    );
  });

  describe('handleAckTimeout', () => {
    it("javob bermagan ustani bo'shatib qidiruvni qaytadan boshlaydi", async () => {
      // Arrange
      orderFindUnique.mockResolvedValue(
        buildOrderRow({ status: OrderStatus.ASSIGNED, masterId: 'master-1' }),
      );
      orders.findEntity.mockResolvedValue(buildEntity(OrderStatus.ASSIGNED, 'master-1'));

      // Act
      await service.handleAckTimeout('order-1');

      // Assert
      expect(masterUpdateMany).toHaveBeenCalledWith({
        where: { id: 'master-1', status: MasterStatus.BUSY },
        data: { status: MasterStatus.AVAILABLE },
      });
      expect(orders.applyTransition).toHaveBeenCalledWith(
        expect.anything(),
        OrderStatus.SEARCHING,
        expect.anything(),
        expect.anything(),
      );
      expect(queueAdd).toHaveBeenCalledWith(
        JOB_MATCH_ORDER,
        { orderId: 'order-1', excludeMasterIds: ['master-1'] },
        expect.anything(),
      );
    });

    it("usta allaqachon javob bergan bo'lsa hech narsa qilmaydi", async () => {
      orderFindUnique.mockResolvedValue(
        buildOrderRow({
          status: OrderStatus.ASSIGNED,
          masterId: 'master-1',
          masterAckedAt: new Date(),
        }),
      );

      await service.handleAckTimeout('order-1');

      expect(masterUpdateMany).not.toHaveBeenCalled();
    });

    it("buyurtma allaqachon boshqa holatga o'tgan bo'lsa aralashmaydi", async () => {
      orderFindUnique.mockResolvedValue(buildOrderRow({ status: OrderStatus.MASTER_EN_ROUTE }));

      await service.handleAckTimeout('order-1');

      expect(orders.applyTransition).not.toHaveBeenCalled();
    });
  });

  describe('sweepQueue', () => {
    it('qidiruv kutayotgan buyurtmalarni DB dan oladi (Redis dan emas)', async () => {
      // Arrange: BullMQ jobi yo'qolgan bo'lsa ham buyurtma DB da qoladi
      orderFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'order-1' }]);
      finder.findCandidates.mockResolvedValue([{ id: 'master-1', distance_km: 1 }]);

      // Act
      await service.sweepQueue();

      // Assert
      expect(orderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: { in: expect.arrayContaining([OrderStatus.SEARCHING]) } },
          orderBy: [{ isUrgent: 'desc' }, { createdAt: 'asc' }],
        }),
      );
      expect(events.emit).toHaveBeenCalledWith(ORDER_EVENTS.ASSIGNED, expect.anything());
    });

    it("shoshilinch buyurtmalarni navbat boshiga qo'yib so'raydi (TZ 3.4)", async () => {
      await service.sweepQueue();

      const pendingQuery = orderFindMany.mock.calls[1][0] as { orderBy: unknown };
      expect(pendingQuery.orderBy).toEqual([{ isUrgent: 'desc' }, { createdAt: 'asc' }]);
    });

    it("javob taymeri yo'qolgan tayinlashlarni tiklaydi", async () => {
      // Arrange: eskirgan ASSIGNED buyurtma (BullMQ delayed job tushib qolgan)
      orderFindMany.mockResolvedValueOnce([{ id: 'stale-order' }]).mockResolvedValueOnce([]);
      orderFindUnique.mockResolvedValue(
        buildOrderRow({ status: OrderStatus.ASSIGNED, masterId: 'master-1' }),
      );
      orders.findEntity.mockResolvedValue(buildEntity(OrderStatus.ASSIGNED, 'master-1'));

      // Act
      await service.sweepQueue();

      // Assert
      expect(orderFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.ASSIGNED,
            masterAckedAt: null,
          }),
        }),
      );
      expect(masterUpdateMany).toHaveBeenCalledWith({
        where: { id: 'master-1', status: MasterStatus.BUSY },
        data: { status: MasterStatus.AVAILABLE },
      });
    });
  });
});
