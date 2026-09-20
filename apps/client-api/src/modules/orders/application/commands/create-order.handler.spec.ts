import { ComplexityLevel, OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_EVENTS } from '@shared/index';
import { CreateOrderCommand } from './create-order.command';
import { CreateOrderHandler } from './create-order.handler';

const address = { label: 'Chilonzor 9', lat: 41.3, lng: 69.2 };

const persistedOrder = {
  id: 'order-1',
  shortId: 'HZ-104901',
  clientId: 'client-1',
  categoryId: 'category-1',
  status: OrderStatus.SEARCHING,
  description: "Kran oqmoqda va suv toʻplanyapti",
  attachmentUrls: [],
  isUrgent: false,
  price: 98_000,
  priceBase: 100_000,
  priceUrgentFee: 0,
  discountPercent: 2,
  discountAmount: 2_000,
  paymentMethod: PaymentMethod.CASH,
  scheduledAt: null,
  preferredMasterId: null,
  workNote: null,
  handledByMaster: false,
  queuePosition: null,
  etaMinutes: null,
  clientAddress: address,
  cancelReason: null,
  cancelledBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
  master: null,
  category: { id: 'category-1', name: "Kran taʼmirlash", iconKey: 'tap', basePrice: 100_000 },
  rating: null,
};

interface CommandOverrides {
  idempotencyKey?: string | null;
  isUrgent?: boolean;
  scheduledAt?: Date | null;
  preferredMasterId?: string | null;
  address?: typeof address;
}

const buildCommand = ({
  idempotencyKey = null,
  isUrgent = false,
  scheduledAt = null,
  preferredMasterId = null,
  address: clientAddress = address,
}: CommandOverrides = {}): CreateOrderCommand =>
  new CreateOrderCommand(
    'client-1',
    'category-1',
    "Kran oqmoqda va suv toʻplanyapti",
    [],
    isUrgent,
    clientAddress,
    idempotencyKey,
    'cash',
    scheduledAt,
    preferredMasterId,
  );

describe('CreateOrderHandler (TZ 3.3)', () => {
  let handler: CreateOrderHandler;
  let orderCreate: jest.Mock;
  let categoryFind: jest.Mock;
  let orders: { findByIdempotencyKey: jest.Mock };
  let matching: { requestMatching: jest.Mock };
  let events: EventEmitter2;
  let masterFind: jest.Mock;
  let levels: { percentForClient: jest.Mock };

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

    masterFind = jest.fn().mockResolvedValue({ isActive: true });
    levels = { percentForClient: jest.fn().mockResolvedValue(2) };

    const prisma = {
      order: { create: orderCreate },
      serviceCategory: { findUnique: categoryFind },
      master: { findUnique: masterFind },
    };

    handler = new CreateOrderHandler(
      prisma as never,
      orders as never,
      matching as never,
      events,
      levels as never,
    );
  });

  const dataOf = () => orderCreate.mock.calls[0][0].data as Record<string, unknown>;

  it('narxni kategoriyaning joriy base_price qiymatidan oladi (hardcode qilinmaydi)', async () => {
    // Act
    await handler.execute(buildCommand());

    // Assert: 100 000 − 2% = 98 000
    expect(dataOf()).toMatchObject({
      priceBase: 100_000,
      priceUrgentFee: 0,
      discountPercent: 2,
      discountAmount: 2_000,
      price: 98_000,
      status: OrderStatus.SEARCHING,
    });
  });

  it('shoshilinchlik qoʻshimchasini server qoʻshadi (qatʼiy 20 000)', async () => {
    await handler.execute(buildCommand({ isUrgent: true }));

    expect(dataOf()).toMatchObject({
      priceUrgentFee: 20_000,
      discountAmount: 2_000,
      price: 118_000,
    });
  });

  it('chegirma foizini mijozning darajasidan oladi, ilovadan emas', async () => {
    levels.percentForClient.mockResolvedValue(6);

    await handler.execute(buildCommand());

    expect(levels.percentForClient).toHaveBeenCalledWith('client-1');
    expect(dataOf()).toMatchObject({ discountPercent: 6, discountAmount: 6_000, price: 94_000 });
  });

  it('koordinatasiz manzilni soxta nuqta bilan toʻldirmaydi', async () => {
    await handler.execute(buildCommand({ address: { label: 'Chilonzor 9' } as typeof address }));

    expect(dataOf()).toMatchObject({ addressLat: null, addressLng: null });
  });

  it('toʻlov usulini DB enumiga oʻgirib saqlaydi', async () => {
    await handler.execute(buildCommand());

    expect(dataOf().paymentMethod).toBe(PaymentMethod.CASH);
  });

  it('usta qidiruvini darhol ishga tushiradi', async () => {
    await handler.execute(buildCommand());

    expect(matching.requestMatching).toHaveBeenCalledWith('order-1', [], 0);
    expect(events.emit).toHaveBeenCalledWith(ORDER_EVENTS.CREATED, expect.anything());
  });

  it('rejalashtirilgan buyurtmada qidiruv kechiktiriladi (usta hozir tayinlanmaydi)', async () => {
    // Arrange
    const scheduledAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    orderCreate.mockResolvedValue({ ...persistedOrder, scheduledAt });

    // Act
    await handler.execute(buildCommand({ scheduledAt }));

    // Assert
    const [, , delayMs] = matching.requestMatching.mock.calls[0] as [string, string[], number];
    expect(delayMs).toBeGreaterThan(2.9 * 60 * 60 * 1000);
    expect(dataOf().scheduledAt).toBe(scheduledAt);
  });

  it('oʻtib ketgan rejalashtirilgan vaqtda qidiruv darhol boshlanadi', async () => {
    const scheduledAt = new Date(Date.now() - 60_000);
    orderCreate.mockResolvedValue({ ...persistedOrder, scheduledAt });

    await handler.execute(buildCommand({ scheduledAt }));

    expect(matching.requestMatching).toHaveBeenCalledWith('order-1', [], 0);
  });

  it('bloklangan ustani soʻrashni rad etadi (jimgina tashlab yubormaydi)', async () => {
    masterFind.mockResolvedValue({ isActive: false });

    await expect(
      handler.execute(buildCommand({ preferredMasterId: 'master-1' })),
    ).rejects.toThrow('qabul qilmaydi');
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("faol boʻlmagan kategoriyani rad etadi", async () => {
    categoryFind.mockResolvedValue({ id: 'category-1', basePrice: 1, isActive: false });

    await expect(handler.execute(buildCommand())).rejects.toThrow('faol emas');
    expect(orderCreate).not.toHaveBeenCalled();
  });

  it("mavjud boʻlmagan kategoriyani rad etadi", async () => {
    categoryFind.mockResolvedValue(null);

    await expect(handler.execute(buildCommand())).rejects.toThrow('mavjud emas');
  });

  it("bir xil idempotency key bilan takroriy soʻrovda yangi buyurtma yaratmaydi (5.6)", async () => {
    // Arrange
    orders.findByIdempotencyKey.mockResolvedValue(persistedOrder);

    // Act
    const result = await handler.execute(buildCommand({ idempotencyKey: 'key-1' }));

    // Assert
    expect(result.id).toBe('order-1');
    expect(orderCreate).not.toHaveBeenCalled();
    expect(matching.requestMatching).not.toHaveBeenCalled();
  });

  it("parallel takroriy soʻrovda unique constraint xatosini mavjud buyurtma bilan hal qiladi", async () => {
    // Arrange: birinchi tekshiruvda topilmaydi, DB unique constraint ishga tushadi
    orders.findByIdempotencyKey.mockResolvedValueOnce(null).mockResolvedValueOnce(persistedOrder);
    orderCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '6.0.0',
      }),
    );

    // Act
    const result = await handler.execute(buildCommand({ idempotencyKey: 'key-1' }));

    // Assert
    expect(result.id).toBe('order-1');
  });

  it("javobda valyuta har doim UZS boʻladi", async () => {
    const result = await handler.execute(buildCommand());

    expect(result.currency).toBe('UZS');
  });
});
