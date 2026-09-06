import { CancelledBy, MasterStatus, OrderStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MASTER_EVENTS, ORDER_EVENTS } from '@shared/index';
import { OrderEntity, type OrderProps } from '../../domain/order.entity';
import { CancelOrderCommand } from './cancel-order.command';
import { CancelOrderHandler } from './cancel-order.handler';

const buildEntity = (overrides: Partial<OrderProps> = {}): OrderEntity =>
  OrderEntity.fromPersistence({
    id: 'order-1',
    clientId: 'client-1',
    masterId: null,
    categoryId: 'category-1',
    status: OrderStatus.SEARCHING,
    isUrgent: false,
    price: 100_000,
    queuePosition: null,
    assignmentAttempts: 0,
    masterAckedAt: null,
    createdAt: new Date(),
    ...overrides,
  });

const orderView = (status: OrderStatus) => ({
  id: 'order-1',
  status,
  description: '',
  attachmentUrls: [],
  isUrgent: false,
  price: 100_000,
  queuePosition: null,
  etaMinutes: null,
  clientAddress: {},
  cancelReason: 'sabab',
  cancelledBy: CancelledBy.CLIENT,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
  master: null,
  category: null,
  rating: null,
});

describe('CancelOrderHandler (TZ 3.6)', () => {
  let handler: CancelOrderHandler;
  let orders: { findEntity: jest.Mock; applyTransition: jest.Mock };
  let masterUpdateMany: jest.Mock;
  let matching: { removeFromQueue: jest.Mock };
  let events: EventEmitter2;

  beforeEach(() => {
    masterUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    orders = {
      findEntity: jest.fn(),
      applyTransition: jest.fn().mockResolvedValue(orderView(OrderStatus.CANCELLED)),
    };
    matching = { removeFromQueue: jest.fn().mockResolvedValue(undefined) };
    events = new EventEmitter2();
    jest.spyOn(events, 'emit');

    const prisma = {
      $transaction: jest
        .fn()
        .mockImplementation((callback: (tx: unknown) => unknown) =>
          callback({ master: { updateMany: masterUpdateMany } }),
        ),
    };

    handler = new CancelOrderHandler(prisma as never, orders as never, matching as never, events);
  });

  it('qidiruv bosqichida bekor qilishga ruxsat beradi', async () => {
    // Arrange
    orders.findEntity.mockResolvedValue(buildEntity());

    // Act
    const result = await handler.execute(new CancelOrderCommand('order-1', 'client-1', 'sabab'));

    // Assert
    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(orders.applyTransition).toHaveBeenCalledWith(
      expect.anything(),
      OrderStatus.CANCELLED,
      expect.objectContaining({
        reason: 'sabab',
        data: expect.objectContaining({ cancelledBy: CancelledBy.CLIENT }),
      }),
      expect.anything(),
    );
  });

  it('ish boshlangandan keyin bekor qilishni rad etadi (biznes-qoida 5.5)', async () => {
    orders.findEntity.mockResolvedValue(buildEntity({ status: OrderStatus.IN_PROGRESS }));

    await expect(
      handler.execute(new CancelOrderCommand('order-1', 'client-1', 'sabab')),
    ).rejects.toThrow("qo'llab-quvvatlash xizmatiga");
  });

  it('tayinlangan ustani "bo\'sh" holatiga qaytaradi va navbatni tekshirishni ishga tushiradi', async () => {
    // Arrange
    orders.findEntity.mockResolvedValue(
      buildEntity({ status: OrderStatus.ASSIGNED, masterId: 'master-1' }),
    );

    // Act
    await handler.execute(new CancelOrderCommand('order-1', 'client-1', 'sabab'));

    // Assert
    expect(masterUpdateMany).toHaveBeenCalledWith({
      where: { id: 'master-1', status: MasterStatus.BUSY },
      data: { status: MasterStatus.AVAILABLE },
    });
    expect(events.emit).toHaveBeenCalledWith(
      MASTER_EVENTS.BECAME_AVAILABLE,
      expect.objectContaining({ masterId: 'master-1' }),
    );
  });

  it("usta tayinlanmagan bo'lsa usta holatiga tegmaydi", async () => {
    orders.findEntity.mockResolvedValue(buildEntity());

    await handler.execute(new CancelOrderCommand('order-1', 'client-1', 'sabab'));

    expect(masterUpdateMany).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalledWith(MASTER_EVENTS.BECAME_AVAILABLE, expect.anything());
  });

  it('buyurtmani navbatdan olib tashlaydi va bekor qilish eventini chiqaradi', async () => {
    orders.findEntity.mockResolvedValue(buildEntity({ status: OrderStatus.SEARCHING_QUEUED }));

    await handler.execute(new CancelOrderCommand('order-1', 'client-1', 'sabab'));

    expect(matching.removeFromQueue).toHaveBeenCalledWith('order-1');
    expect(events.emit).toHaveBeenCalledWith(
      ORDER_EVENTS.CANCELLED,
      expect.objectContaining({ cancelledBy: 'CLIENT' }),
    );
  });

  it("boshqa mijozning buyurtmasini bekor qilishga yo'l qo'ymaydi (6.1)", async () => {
    orders.findEntity.mockResolvedValue(buildEntity());

    await expect(
      handler.execute(new CancelOrderCommand('order-1', 'begona', 'sabab')),
    ).rejects.toThrow('Bu buyurtma sizga tegishli emas');
  });
});
