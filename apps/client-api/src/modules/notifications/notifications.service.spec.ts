import { NotificationType } from '@prisma/client';
import { NotificationsService, ADMIN_SAFETY_CHANNEL } from './notifications.service';

describe('NotificationsService (TZ 4, 9.6)', () => {
  let service: NotificationsService;
  let notificationCreate: jest.Mock;
  let deviceFindMany: jest.Mock;
  let deviceDeleteMany: jest.Mock;
  let emitToUser: jest.Mock;
  let sendToTokens: jest.Mock;
  let publish: jest.Mock;

  beforeEach(() => {
    notificationCreate = jest
      .fn()
      .mockResolvedValue({ id: 'notification-1', sentAt: new Date('2026-09-05T12:00:00.000Z') });
    deviceFindMany = jest.fn().mockResolvedValue([{ token: 'device-token-1' }]);
    deviceDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
    emitToUser = jest.fn();
    sendToTokens = jest.fn().mockResolvedValue([]);
    publish = jest.fn().mockResolvedValue(1);

    const prisma = {
      notification: {
        create: notificationCreate,
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      deviceToken: {
        findMany: deviceFindMany,
        deleteMany: deviceDeleteMany,
        upsert: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockResolvedValue([[], 0, 0]),
    };

    service = new NotificationsService(
      prisma as never,
      { emitToUser } as never,
      { sendToTokens } as never,
      { publish } as never,
    );
  });

  const dispatchInput = {
    userId: 'user-1',
    orderId: 'order-1',
    type: NotificationType.MASTER_ASSIGNED,
    title: 'Usta topildi',
    body: 'Buyurtmangizga usta tayinlandi',
  };

  it("xabarni avval DB ga yozadi (offline foydalanuvchi keyin ko'radi)", async () => {
    await service.dispatch(dispatchInput);

    expect(notificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1', type: NotificationType.MASTER_ASSIGNED }),
      }),
    );
  });

  it('WebSocket va push kanallariga parallel yuboradi', async () => {
    await service.dispatch(dispatchInput);

    expect(emitToUser).toHaveBeenCalledWith(
      'user-1',
      NotificationType.MASTER_ASSIGNED,
      expect.objectContaining({ id: 'notification-1' }),
    );
    expect(sendToTokens).toHaveBeenCalledWith(
      ['device-token-1'],
      expect.objectContaining({ title: 'Usta topildi' }),
    );
  });

  it("qurilma tokeni bo'lmasa push yubormaydi", async () => {
    deviceFindMany.mockResolvedValue([]);

    await service.dispatch(dispatchInput);

    expect(sendToTokens).not.toHaveBeenCalled();
    expect(notificationCreate).toHaveBeenCalled();
  });

  it('yaroqsiz push tokenlarini tozalaydi', async () => {
    sendToTokens.mockResolvedValue(['device-token-1']);

    await service.dispatch(dispatchInput);

    expect(deviceDeleteMany).toHaveBeenCalledWith({
      where: { token: { in: ['device-token-1'] } },
    });
  });

  it('xavfsizlik signalini admin kanaliga kritik ustuvorlik bilan chiqaradi', async () => {
    // Act
    await service.publishSafetyAlert({
      safetyAlertId: 'alert-1',
      orderId: 'order-1',
      clientId: 'client-1',
      masterId: 'master-1',
    });

    // Assert
    expect(publish).toHaveBeenCalledWith(ADMIN_SAFETY_CHANNEL, expect.any(String));
    const payload = JSON.parse(publish.mock.calls[0][1] as string);
    expect(payload).toMatchObject({ safetyAlertId: 'alert-1', priority: 'critical' });
  });
});
