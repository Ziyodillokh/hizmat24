import { OrderStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_EVENTS } from '@shared/index';
import { OrderNotFoundException } from '@client/common/exceptions/domain.exception';
import { OrderEntity, type OrderProps } from '../../domain/order.entity';
import { ConfirmMasterCommand } from './confirm-master.command';
import { ConfirmMasterHandler } from './confirm-master.handler';

const buildEntity = (overrides: Partial<OrderProps> = {}): OrderEntity =>
  OrderEntity.fromPersistence({
    id: 'order-1',
    clientId: 'client-1',
    masterId: 'master-1',
    categoryId: 'category-1',
    status: OrderStatus.ARRIVED_PENDING_CONFIRMATION,
    isUrgent: false,
    price: 100_000,
    queuePosition: null,
    assignmentAttempts: 1,
    masterAckedAt: new Date(),
    createdAt: new Date(),
    ...overrides,
  });

describe('ConfirmMasterHandler (TZ 3.7)', () => {
  let handler: ConfirmMasterHandler;
  let orders: { findEntity: jest.Mock; applyTransition: jest.Mock };
  let prisma: { $transaction: jest.Mock; safetyAlert: { create: jest.Mock } };
  let audit: { record: jest.Mock };
  let events: EventEmitter2;

  beforeEach(() => {
    orders = {
      findEntity: jest.fn(),
      applyTransition: jest.fn().mockImplementation((entity, next) => ({
        id: entity.id,
        status: next,
        description: '',
        attachmentUrls: [],
        isUrgent: false,
        price: 100_000,
        queuePosition: null,
        etaMinutes: null,
        clientAddress: {},
        cancelReason: null,
        cancelledBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
        master: null,
        category: null,
        rating: null,
      })),
    };

    prisma = {
      safetyAlert: { create: jest.fn().mockResolvedValue({ id: 'alert-1' }) },
      $transaction: jest
        .fn()
        .mockImplementation((callback: (tx: unknown) => unknown) =>
          callback({ safetyAlert: prisma.safetyAlert }),
        ),
    };

    audit = { record: jest.fn().mockResolvedValue(undefined) };
    events = new EventEmitter2();
    jest.spyOn(events, 'emit');

    handler = new ConfirmMasterHandler(prisma as never, orders as never, audit as never, events);
  });

  it("tasdiqlanganda buyurtmani IN_PROGRESS ga o'tkazadi", async () => {
    // Arrange
    orders.findEntity.mockResolvedValue(buildEntity());
    const command = new ConfirmMasterCommand('order-1', 'client-1', true, null, '1.1.1.1', 'app');

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(orders.applyTransition).toHaveBeenCalledWith(
      expect.anything(),
      OrderStatus.IN_PROGRESS,
      expect.objectContaining({ actorId: 'client-1' }),
    );
    expect(result.safetyAlertId).toBeNull();
  });

  it("tasdiqlanmaganda ish IN_PROGRESS ga O'TMAYDI, SAFETY_FLAGGED bo'ladi", async () => {
    // Arrange
    orders.findEntity.mockResolvedValue(buildEntity());
    const command = new ConfirmMasterCommand(
      'order-1',
      'client-1',
      false,
      'Boshqa odam keldi',
      '1.1.1.1',
      'app',
    );

    // Act
    const result = await handler.execute(command);

    // Assert
    const targetStatuses = orders.applyTransition.mock.calls.map((call) => call[1]);
    expect(targetStatuses).toContain(OrderStatus.SAFETY_FLAGGED);
    expect(targetStatuses).not.toContain(OrderStatus.IN_PROGRESS);
    expect(result.safetyAlertId).toBe('alert-1');
    expect(result.message).toContain("bog'lanadi");
  });

  it("xavfsizlik signalida o'chirilmaydigan audit yozuvi yaratadi (IP va User-Agent bilan)", async () => {
    // Arrange
    orders.findEntity.mockResolvedValue(buildEntity());

    // Act
    await handler.execute(
      new ConfirmMasterCommand('order-1', 'client-1', false, 'izoh', '10.0.0.1', 'Hizmat24/1.0'),
    );

    // Assert
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'client-1',
        orderId: 'order-1',
        ipAddress: '10.0.0.1',
        userAgent: 'Hizmat24/1.0',
        toStatus: OrderStatus.SAFETY_FLAGGED,
      }),
      expect.anything(),
    );
  });

  it('xavfsizlik signalida admin/support uchun event chiqaradi', async () => {
    orders.findEntity.mockResolvedValue(buildEntity());

    await handler.execute(new ConfirmMasterCommand('order-1', 'client-1', false, null, null, null));

    expect(events.emit).toHaveBeenCalledWith(
      ORDER_EVENTS.SAFETY_FLAGGED,
      expect.objectContaining({ orderId: 'order-1', safetyAlertId: 'alert-1' }),
    );
  });

  it("boshqa mijozning buyurtmasini tasdiqlashga yo'l qo'ymaydi (6.1)", async () => {
    orders.findEntity.mockResolvedValue(buildEntity());

    await expect(
      handler.execute(new ConfirmMasterCommand('order-1', 'begona-client', true, null, null, null)),
    ).rejects.toThrow('Bu buyurtma sizga tegishli emas');
  });

  it("mavjud bo'lmagan buyurtma uchun 404 qaytaradi", async () => {
    orders.findEntity.mockResolvedValue(null);

    await expect(
      handler.execute(new ConfirmMasterCommand("yo'q", 'client-1', true, null, null, null)),
    ).rejects.toThrow(OrderNotFoundException);
  });

  it("noto'g'ri holatda tasdiqlashni rad etadi (masalan hali yetib kelmagan)", async () => {
    orders.findEntity.mockResolvedValue(buildEntity({ status: OrderStatus.MASTER_EN_ROUTE }));

    await expect(
      handler.execute(new ConfirmMasterCommand('order-1', 'client-1', true, null, null, null)),
    ).rejects.toThrow("o'tkazish mumkin emas");
  });
});
