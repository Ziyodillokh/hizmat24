import { OrderStatus } from '@prisma/client';
import {
  ForbiddenResourceException,
  OrderNotFoundException,
} from '@client/common/exceptions/domain.exception';
import {
  GetOrderEtaHandler,
  GetOrderHandler,
  GetOrderReceiptHandler,
  ListOrderHistoryHandler,
} from './get-order.handler';
import {
  GetOrderEtaQuery,
  GetOrderQuery,
  GetOrderReceiptQuery,
  ListOrderHistoryQuery,
} from './get-order.query';

const buildOrder = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'order-1',
    clientId: 'client-1',
    status: OrderStatus.ASSIGNED,
    description: 'test',
    attachmentUrls: [],
    isUrgent: false,
    price: 100_000,
    queuePosition: null,
    etaMinutes: 15,
    clientAddress: {},
    cancelReason: null,
    cancelledBy: null,
    completedAt: new Date('2026-09-05T12:00:00.000Z'),
    createdAt: new Date('2026-09-05T12:00:00.000Z'),
    updatedAt: new Date('2026-09-05T12:00:00.000Z'),
    master: null,
    category: { id: 'category-1', name: "Kran ta'mirlash", basePrice: 100_000 },
    rating: null,
    ...overrides,
  }) as never;

describe('GetOrderHandler', () => {
  let orders: { findById: jest.Mock };
  let handler: GetOrderHandler;

  beforeEach(() => {
    orders = { findById: jest.fn().mockResolvedValue(buildOrder()) };
    handler = new GetOrderHandler(orders as never);
  });

  it('buyurtmani egasiga qaytaradi', async () => {
    const result = await handler.execute(new GetOrderQuery('order-1', 'client-1'));

    expect(result.id).toBe('order-1');
    expect(result.currency).toBe('UZS');
  });

  it("javobda faqat bitta master maydoni bo'ladi (biznes-qoida 5.2)", async () => {
    const result = await handler.execute(new GetOrderQuery('order-1', 'client-1'));

    expect(Object.keys(result)).not.toContain('masters');
    expect(Object.keys(result)).not.toContain('candidates');
  });

  it('begona mijozga 403 qaytaradi (6.1)', async () => {
    await expect(handler.execute(new GetOrderQuery('order-1', 'begona'))).rejects.toThrow(
      ForbiddenResourceException,
    );
  });

  it('topilmagan buyurtma uchun 404 qaytaradi', async () => {
    orders.findById.mockResolvedValue(null);

    await expect(handler.execute(new GetOrderQuery("yo'q", 'client-1'))).rejects.toThrow(
      OrderNotFoundException,
    );
  });
});

describe('GetOrderEtaHandler', () => {
  let orders: { findById: jest.Mock };
  let queuePosition: { positionOf: jest.Mock };
  let handler: GetOrderEtaHandler;

  beforeEach(() => {
    orders = { findById: jest.fn().mockResolvedValue(buildOrder()) };
    queuePosition = { positionOf: jest.fn().mockResolvedValue(3) };
    handler = new GetOrderEtaHandler(orders as never, queuePosition as never);
  });

  it("usta yo'lda bo'lganda ETA qaytaradi", async () => {
    const result = await handler.execute(new GetOrderEtaQuery('order-1', 'client-1'));

    expect(result.etaMinutes).toBe(15);
    expect(queuePosition.positionOf).not.toHaveBeenCalled();
  });

  it("navbatda bo'lganda Redis dan joriy pozitsiyani oladi", async () => {
    orders.findById.mockResolvedValue(
      buildOrder({ status: OrderStatus.SEARCHING_QUEUED, queuePosition: 5, etaMinutes: null }),
    );

    const result = await handler.execute(new GetOrderEtaQuery('order-1', 'client-1'));

    expect(result.queuePosition).toBe(3);
  });

  it('Redis da topilmasa DB dagi pozitsiyaga qaytadi', async () => {
    orders.findById.mockResolvedValue(
      buildOrder({ status: OrderStatus.SEARCHING_QUEUED, queuePosition: 5, etaMinutes: null }),
    );
    queuePosition.positionOf.mockResolvedValue(0);

    const result = await handler.execute(new GetOrderEtaQuery('order-1', 'client-1'));

    expect(result.queuePosition).toBe(5);
  });

  it('begona mijozni rad etadi', async () => {
    await expect(handler.execute(new GetOrderEtaQuery('order-1', 'begona'))).rejects.toThrow(
      ForbiddenResourceException,
    );
  });

  it('topilmagan buyurtmaga 404', async () => {
    orders.findById.mockResolvedValue(null);

    await expect(handler.execute(new GetOrderEtaQuery('x', 'client-1'))).rejects.toThrow(
      OrderNotFoundException,
    );
  });
});

describe('GetOrderReceiptHandler (TZ 3.9)', () => {
  let orders: { findById: jest.Mock };
  let handler: GetOrderReceiptHandler;

  beforeEach(() => {
    orders = {
      findById: jest.fn().mockResolvedValue(
        buildOrder({
          status: OrderStatus.CLOSED,
          master: { fullName: 'Akmal Rahimov' },
          rating: { stars: 5, comment: null },
        }),
      ),
    };
    handler = new GetOrderReceiptHandler(orders as never);
  });

  it('yakunlangan buyurtma uchun chek qaytaradi', async () => {
    const result = await handler.execute(new GetOrderReceiptQuery('order-1', 'client-1'));

    expect(result).toMatchObject({
      serviceName: "Kran ta'mirlash",
      price: 100_000,
      currency: 'UZS',
      masterName: 'Akmal Rahimov',
      rating: 5,
    });
    expect(result.completedAt).toBe('2026-09-05T17:00:00.000+05:00');
  });

  it.each([OrderStatus.SEARCHING, OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED])(
    '%s holatida chek bermaydi',
    async (status) => {
      orders.findById.mockResolvedValue(buildOrder({ status }));

      await expect(
        handler.execute(new GetOrderReceiptQuery('order-1', 'client-1')),
      ).rejects.toMatchObject({ code: 'RECEIPT_NOT_AVAILABLE' });
    },
  );

  it('begona mijozni rad etadi', async () => {
    await expect(handler.execute(new GetOrderReceiptQuery('order-1', 'begona'))).rejects.toThrow(
      ForbiddenResourceException,
    );
  });

  it('topilmagan buyurtmaga 404', async () => {
    orders.findById.mockResolvedValue(null);

    await expect(handler.execute(new GetOrderReceiptQuery('x', 'client-1'))).rejects.toThrow(
      OrderNotFoundException,
    );
  });
});

describe('ListOrderHistoryHandler', () => {
  it("sahifalash meta ma'lumotlarini hisoblaydi", async () => {
    // Arrange
    const orders = {
      listHistory: jest.fn().mockResolvedValue({ items: [buildOrder()], total: 25 }),
    };
    const handler = new ListOrderHistoryHandler(orders as never);

    // Act
    const result = await handler.execute(new ListOrderHistoryQuery('client-1', 2, 10));

    // Assert
    expect(result.meta).toEqual({ total: 25, page: 2, limit: 10, totalPages: 3 });
    expect(result.items).toHaveLength(1);
  });

  it("bo'sh tarixda ham kamida 1 sahifa qaytaradi", async () => {
    const orders = { listHistory: jest.fn().mockResolvedValue({ items: [], total: 0 }) };
    const handler = new ListOrderHistoryHandler(orders as never);

    const result = await handler.execute(new ListOrderHistoryQuery('client-1', 1, 20));

    expect(result.meta.totalPages).toBe(1);
  });
});
