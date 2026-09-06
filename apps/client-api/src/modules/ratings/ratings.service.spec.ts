import { OrderStatus, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JOB_RECALCULATE_MASTER_RATING, MASTER_EVENTS, ORDER_EVENTS } from '@shared/index';
import { OrderEntity, type OrderProps } from '@client/modules/orders/domain/order.entity';
import { RatingsService } from './ratings.service';

const buildEntity = (overrides: Partial<OrderProps> = {}): OrderEntity =>
  OrderEntity.fromPersistence({
    id: 'order-1',
    clientId: 'client-1',
    masterId: 'master-1',
    categoryId: 'category-1',
    status: OrderStatus.COMPLETED_BY_MASTER,
    isUrgent: false,
    price: 100_000,
    queuePosition: null,
    assignmentAttempts: 1,
    masterAckedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  });

describe('RatingsService (TZ 3.8)', () => {
  let service: RatingsService;
  let orders: { findEntity: jest.Mock; applyTransition: jest.Mock };
  let ratingCreate: jest.Mock;
  let masterUpdate: jest.Mock;
  let ratingAggregate: jest.Mock;
  let masterUpdateRoot: jest.Mock;
  let queueAdd: jest.Mock;
  let events: EventEmitter2;

  beforeEach(() => {
    ratingCreate = jest
      .fn()
      .mockResolvedValue({ id: 'rating-1', orderId: 'order-1', stars: 5, comment: null });
    masterUpdate = jest.fn().mockResolvedValue({});
    masterUpdateRoot = jest.fn().mockResolvedValue({});
    ratingAggregate = jest.fn().mockResolvedValue({ _avg: { stars: 4.5 }, _count: { _all: 4 } });
    queueAdd = jest.fn().mockResolvedValue({});
    events = new EventEmitter2();
    jest.spyOn(events, 'emit');

    orders = {
      findEntity: jest.fn().mockResolvedValue(buildEntity()),
      applyTransition: jest.fn().mockResolvedValue({}),
    };

    const prisma = {
      rating: { aggregate: ratingAggregate },
      master: { update: masterUpdateRoot },
      $transaction: jest
        .fn()
        .mockImplementation((callback: (tx: unknown) => unknown) =>
          callback({ rating: { create: ratingCreate }, master: { update: masterUpdate } }),
        ),
    };

    service = new RatingsService(prisma as never, orders as never, events, {
      add: queueAdd,
    } as never);
  });

  it('yakunlangan buyurtmani baholaydi va CLOSED holatiga yopadi', async () => {
    // Act
    const result = await service.rateOrder('order-1', 'client-1', 5, null);

    // Assert
    expect(result.id).toBe('rating-1');
    const statuses = orders.applyTransition.mock.calls.map((call) => call[1]);
    expect(statuses).toEqual([OrderStatus.RATED, OrderStatus.CLOSED]);
  });

  it("ish yakunlanmagan bo'lsa baholashni rad etadi", async () => {
    orders.findEntity.mockResolvedValue(buildEntity({ status: OrderStatus.IN_PROGRESS }));

    await expect(service.rateOrder('order-1', 'client-1', 5, null)).rejects.toThrow(
      'faqat ish yakunlangandan keyin',
    );
  });

  it('bitta buyurtma ikki marta baholansa 409 qaytaradi (idempotentlik)', async () => {
    // Arrange
    ratingCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.0.0',
      }),
    );

    // Act & Assert
    await expect(service.rateOrder('order-1', 'client-1', 5, null)).rejects.toMatchObject({
      code: 'RATING_ALREADY_EXISTS',
    });
  });

  it("boshqa mijozning buyurtmasini baholashga yo'l qo'ymaydi (6.1)", async () => {
    await expect(service.rateOrder('order-1', 'begona', 5, null)).rejects.toThrow(
      'Bu buyurtma sizga tegishli emas',
    );
  });

  it("reyting o'rtachasini background job orqali qayta hisoblaydi (bloklamaydi)", async () => {
    await service.rateOrder('order-1', 'client-1', 4, 'rahmat');

    expect(queueAdd).toHaveBeenCalledWith(
      JOB_RECALCULATE_MASTER_RATING,
      { masterId: 'master-1' },
      expect.anything(),
    );
  });

  it('bajarilgan buyurtmalar sonini oshiradi', async () => {
    await service.rateOrder('order-1', 'client-1', 5, null);

    expect(masterUpdate).toHaveBeenCalledWith({
      where: { id: 'master-1' },
      data: { completedOrdersCount: { increment: 1 } },
    });
    expect(events.emit).toHaveBeenCalledWith(MASTER_EVENTS.BECAME_AVAILABLE, expect.anything());
    expect(events.emit).toHaveBeenCalledWith(ORDER_EVENTS.RATED, expect.anything());
  });

  it("ustaning bo'sh/band holatiga bevosita tegmaydi (invariant egasi — reconcile)", async () => {
    // Kech baholash allaqachon yangi ish olgan ustani "bo'sh" qilib qo'ymasligi kerak
    await service.rateOrder('order-1', 'client-1', 5, null);

    expect(masterUpdate.mock.calls[0][0].data).not.toHaveProperty('status');
  });

  describe('recalculateMasterRating', () => {
    it("o'rtacha reytingni ikki xonagacha yaxlitlab saqlaydi", async () => {
      // Arrange
      ratingAggregate.mockResolvedValue({ _avg: { stars: 4.333333 }, _count: { _all: 3 } });

      // Act
      await service.recalculateMasterRating('master-1');

      // Assert
      expect(masterUpdateRoot).toHaveBeenCalledWith({
        where: { id: 'master-1' },
        data: { ratingAvg: new Prisma.Decimal('4.33'), ratingCount: 3 },
      });
    });

    it("baho bo'lmasa 0 yozadi", async () => {
      ratingAggregate.mockResolvedValue({ _avg: { stars: null }, _count: { _all: 0 } });

      await service.recalculateMasterRating('master-1');

      expect(masterUpdateRoot).toHaveBeenCalledWith({
        where: { id: 'master-1' },
        data: { ratingAvg: new Prisma.Decimal('0.00'), ratingCount: 0 },
      });
    });
  });
});
