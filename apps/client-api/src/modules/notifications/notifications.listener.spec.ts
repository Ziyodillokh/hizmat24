import { NotificationType, OrderStatus } from '@prisma/client';
import {
  MatchingEscalatedEvent,
  OrderAssignedEvent,
  OrderCancelledEvent,
  OrderQueuedEvent,
  OrderSafetyFlaggedEvent,
  OrderStatusChangedEvent,
} from '@shared/index';
import { NotificationsListener } from './notifications.listener';

describe('NotificationsListener (TZ 3.5, 4)', () => {
  let listener: NotificationsListener;
  let dispatch: jest.Mock;
  let publishSafetyAlert: jest.Mock;

  beforeEach(() => {
    dispatch = jest.fn().mockResolvedValue(undefined);
    publishSafetyAlert = jest.fn().mockResolvedValue(undefined);
    listener = new NotificationsListener({ dispatch, publishSafetyAlert } as never);
  });

  it('usta tayinlanganda mijozga xabar yuboradi', async () => {
    await listener.onAssigned(new OrderAssignedEvent('order-1', 'client-1', 'master-1', 1));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.MASTER_ASSIGNED, userId: 'client-1' }),
    );
  });

  it("navbat pozitsiyasi va kutish vaqtini xabarda ko'rsatadi", async () => {
    await listener.onQueued(new OrderQueuedEvent('order-1', 'client-1', 3, 45));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.QUEUE_POSITION_UPDATE,
        body: expect.stringContaining('45'),
      }),
    );
  });

  it("kutish vaqti noma'lum bo'lsa faqat pozitsiyani xabar qiladi", async () => {
    await listener.onQueued(new OrderQueuedEvent('order-1', 'client-1', 3, null));

    expect(dispatch.mock.calls[0][0].body).toContain('3');
  });

  it.each([
    [OrderStatus.MASTER_EN_ROUTE, NotificationType.MASTER_EN_ROUTE],
    [OrderStatus.ARRIVED_PENDING_CONFIRMATION, NotificationType.MASTER_ARRIVED],
    [OrderStatus.IN_PROGRESS, NotificationType.ORDER_IN_PROGRESS],
    [OrderStatus.COMPLETED_BY_MASTER, NotificationType.ORDER_COMPLETED_BY_MASTER],
  ])('%s holatida %s xabarini yuboradi', async (status, expectedType) => {
    await listener.onStatusChanged(
      new OrderStatusChangedEvent('order-1', 'client-1', OrderStatus.ASSIGNED, status),
    );

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: expectedType }));
  });

  it("mijozga ahamiyatsiz holat o'zgarishlarida xabar yubormaydi", async () => {
    await listener.onStatusChanged(
      new OrderStatusChangedEvent(
        'order-1',
        'client-1',
        OrderStatus.SEARCHING,
        OrderStatus.SEARCHING_QUEUED,
      ),
    );

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('bekor qilinganda sababni yuboradi', async () => {
    await listener.onCancelled(
      new OrderCancelledEvent('order-1', 'client-1', 'master-1', 'CLIENT', "fikrim o'zgardi"),
    );

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NotificationType.ORDER_CANCELLED,
        body: "fikrim o'zgardi",
      }),
    );
  });

  it('xavfsizlik signalida avval admin navbatiga, keyin mijozga xabar yuboradi', async () => {
    // Act
    await listener.onSafetyFlagged(
      new OrderSafetyFlaggedEvent('order-1', 'client-1', 'master-1', 'alert-1'),
    );

    // Assert
    expect(publishSafetyAlert).toHaveBeenCalledWith(
      expect.objectContaining({ safetyAlertId: 'alert-1' }),
    );
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.SAFETY_ALERT_RECEIVED }),
    );
  });

  it("eskalatsiyada mijozga operator ko'rib chiqishini bildiradi", async () => {
    await listener.onEscalated(new MatchingEscalatedEvent('order-1', 'client-1', 5));

    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.MATCHING_ESCALATED }),
    );
  });
});
