import { ActorType, AuditAction, OrderStatus } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ORDER_EVENTS } from '@shared/index';
import { ConflictException } from '@client/common/exceptions/domain.exception';
import { OrderEntity, type OrderProps } from '../domain/order.entity';
import { OrdersRepository } from './orders.repository';

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

describe('OrdersRepository.applyTransition (nofunksional talab 7.3)', () => {
  let repository: OrdersRepository;
  let updateMany: jest.Mock;
  let historyCreate: jest.Mock;
  let findUniqueOrThrow: jest.Mock;
  let audit: { record: jest.Mock };
  let events: EventEmitter2;
  let transaction: jest.Mock;

  beforeEach(() => {
    updateMany = jest.fn().mockResolvedValue({ count: 1 });
    historyCreate = jest.fn().mockResolvedValue({});
    findUniqueOrThrow = jest
      .fn()
      .mockResolvedValue({ id: 'order-1', clientId: 'client-1', status: OrderStatus.ASSIGNED });
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    events = new EventEmitter2();
    jest.spyOn(events, 'emit');

    const prisma = {
      order: { updateMany, findUniqueOrThrow },
      orderStatusHistory: { create: historyCreate },
      $transaction: jest
        .fn()
        .mockImplementation((callback: (tx: unknown) => unknown) => callback(prisma)),
    };

    repository = new OrdersRepository(prisma as never, audit as never, events);
    transaction = prisma.$transaction;
  });

  it("joriy holatni shartga qo'shib atomar yangilaydi (poyga holatidan himoya)", async () => {
    // Act
    await repository.applyTransition(buildEntity(), OrderStatus.ASSIGNED, {
      actorType: ActorType.SYSTEM,
    });

    // Assert
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', status: OrderStatus.SEARCHING },
      data: { status: OrderStatus.ASSIGNED },
    });
  });

  it("holat oradan o'zgargan bo'lsa 409 bilan to'xtaydi", async () => {
    updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.applyTransition(buildEntity(), OrderStatus.ASSIGNED, {
        actorType: ActorType.SYSTEM,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it("ruxsat etilmagan o'tishda DB ga umuman murojaat qilmaydi", async () => {
    await expect(
      repository.applyTransition(
        buildEntity({ status: OrderStatus.IN_PROGRESS }),
        OrderStatus.CLOSED,
        {
          actorType: ActorType.SYSTEM,
        },
      ),
    ).rejects.toThrow("o'tkazish mumkin emas");

    expect(updateMany).not.toHaveBeenCalled();
  });

  it("har bir o'tish uchun tarix va audit yozuvi qoldiradi", async () => {
    await repository.applyTransition(buildEntity(), OrderStatus.ASSIGNED, {
      actorType: ActorType.CLIENT,
      actorId: 'client-1',
      reason: 'sabab',
    });

    expect(historyCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromStatus: OrderStatus.SEARCHING,
        toStatus: OrderStatus.ASSIGNED,
        actorId: 'client-1',
        reason: 'sabab',
      }),
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: AuditAction.ORDER_STATUS_CHANGED }),
      expect.anything(),
    );
  });

  it("holat o'zgarishini yagona manba sifatida event orqali tarqatadi (9.6)", async () => {
    await repository.applyTransition(buildEntity(), OrderStatus.ASSIGNED, {
      actorType: ActorType.SYSTEM,
    });

    expect(events.emit).toHaveBeenCalledWith(
      ORDER_EVENTS.STATUS_CHANGED,
      expect.objectContaining({
        fromStatus: OrderStatus.SEARCHING,
        toStatus: OrderStatus.ASSIGNED,
      }),
    );
  });

  it("chaqiruvchi tranzaksiya bermasa o'zi ochadi (holat + tarix + audit bo'linmas)", async () => {
    await repository.applyTransition(buildEntity(), OrderStatus.ASSIGNED, {
      actorType: ActorType.SYSTEM,
    });

    expect(transaction).toHaveBeenCalled();
  });

  it("chaqiruvchi tranzaksiya bergan bo'lsa yangisini ochmaydi", async () => {
    await repository.applyTransition(
      buildEntity(),
      OrderStatus.ASSIGNED,
      { actorType: ActorType.SYSTEM },
      {
        order: { updateMany, findUniqueOrThrow },
        orderStatusHistory: { create: historyCreate },
      } as never,
    );

    expect(transaction).not.toHaveBeenCalled();
  });

  it("qo'shimcha maydonlarni holat bilan bitta so'rovda yozadi", async () => {
    await repository.applyTransition(buildEntity(), OrderStatus.ASSIGNED, {
      actorType: ActorType.SYSTEM,
      data: { masterId: 'master-1', etaMinutes: 12 },
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', status: OrderStatus.SEARCHING },
      data: { status: OrderStatus.ASSIGNED, masterId: 'master-1', etaMinutes: 12 },
    });
  });
});
