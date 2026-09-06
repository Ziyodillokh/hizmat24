import { ComplexityLevel, OrderStatus, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_EVENTS } from '@shared/index';
import { CreateOrderCommand } from './create-order.command';
import { CreateOrderHandler } from './create-order.handler';

const address = { label: 'Chilonzor 9', lat: 41.3, lng: 69.2 };

const persistedOrder = {
  id: 'order-1',
  clientId: 'client-1',
  categoryId: 'category-1',
  status: OrderStatus.SEARCHING,
  description: "Kran oqmoqda va suv to'planyapti",
  attachmentUrls: [],
  isUrgent: false,
  price: 100_000,
  queuePosition: null,
  etaMinutes: null,
  clientAddress: address,
  cancelReason: null,
  cancelledBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
  master: null,
  category: { id: 'category-1', name: "Kran ta'mirlash", basePrice: 100_000 },
  rating: null,
};

const buildCommand = (idempotencyKey: string | null = null): CreateOrderCommand =>
  new CreateOrderCommand(
    'client-1',
    'category-1',
    "Kran oqmoqda va suv to'planyapti",
    [],
    false,
    address,
    idempotencyKey,
  );

describe('CreateOrderHandler (TZ 3.3)', () => {
  let handler: CreateOrderHandler;
  let orderCreate: jest.Mock;
  let categoryFind: jest.Mock;
  let orders: { findByIdempotencyKey: jest.Mock };
  let matching: { requestMatching: jest.Mock };
  let events: EventEmitter2;

  beforeEach(() => {
    orderCreate = jest.fn().mockResolvedValue(persistedOrder);
    categoryFind = jest.fn().mockResolvedValue({
      id: 'category-1',
      basePrice: 100_000,
      isActive: true,
      complexityLevel: ComplexityLevel.SIMPLE,
    });
    orders = { findByIdempotencyKey: jest.fn().mockResolvedValue(null) };
    matching = { requestMatching: jest.fn().mockResolvedValue(undefined) };
    events = new EventEmitter2();
    jest.spyOn(events, 'emit');

    const prisma = {
      order: { create: orderCreate },
      serviceCategory: { findUnique: categoryFind },
    };

    handler = new CreateOrderHandler(prisma as never, orders as never, matching as never, events);
  });

  it('narxni kategoriyaning joriy base_price qiymatidan oladi (hardcode qilinmaydi)', async () => {
    // Act
    await handler.execute(buildCommand());

    // Assert
    expect(orderCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ price: 100_000, status: OrderStatus.SEARCHING }),
      }),
    );
  });

  it('usta qidiruvini darhol ishga tushiradi', async () => {
    await handler.execute(buildCommand());

    expect(matching.requestMatching).toHaveBeenCalledWith('order-1');
    expect(events.emit).toHaveBeenCalledWith(ORDER_EVENTS.CREATED, expect.anything());
  });

  it("faol bo'lmagan kategoriyani rad etadi", async () => {
    categoryFind.mockResolvedValue({ id: 'category-1', basePrice: 1, isActive: false });

    await expect(handler.execute(buildCommand())).rejects.toThrow('faol emas');
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("mavjud bo'lmagan kategoriyani rad etadi", async () => {
    categoryFind.mockResolvedValue(null);

    await expect(handler.execute(buildCommand())).rejects.toThrow('mavjud emas');
  });

  it("bir xil idempotency key bilan takroriy so'rovda yangi buyurtma yaratmaydi (5.6)", async () => {
    // Arrange
    orders.findByIdempotencyKey.mockResolvedValue(persistedOrder);

    // Act
    const result = await handler.execute(buildCommand('key-1'));

    // Assert
    expect(result.id).toBe('order-1');
    expect(orderCreate).not.toHaveBeenCalled();
    expect(matching.requestMatching).not.toHaveBeenCalled();
  });

  it("parallel takroriy so'rovda unique constraint xatosini mavjud buyurtma bilan hal qiladi", async () => {
    // Arrange: birinchi tekshiruvda topilmaydi, DB unique constraint ishga tushadi
    orders.findByIdempotencyKey.mockResolvedValueOnce(null).mockResolvedValueOnce(persistedOrder);
    orderCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.0.0',
      }),
    );

    // Act
    const result = await handler.execute(buildCommand('key-1'));

    // Assert
    expect(result.id).toBe('order-1');
  });

  it("javobda valyuta har doim UZS bo'ladi", async () => {
    const result = await handler.execute(buildCommand());

    expect(result.currency).toBe('UZS');
  });
});
