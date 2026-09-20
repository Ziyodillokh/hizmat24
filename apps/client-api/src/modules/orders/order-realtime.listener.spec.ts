import { OrderStatus, PaymentMethod } from '@prisma/client';
import { WS_EVENT_ORDER_UPDATED } from '@shared/index';
import { OrderSnapshotChangedEvent } from './domain/events/order-snapshot-changed.event';
import { OrderRealtimeListener } from './order-realtime.listener';
import type { OrderWithRelations } from './infrastructure/order.presenter';

const snapshot = {
  id: 'order-1',
  shortId: 'HZ-104901',
  clientId: 'client-1',
  masterId: null,
  categoryId: 'category-1',
  description: 'Kran oqmoqda',
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
  status: OrderStatus.SEARCHING_QUEUED,
  queuePosition: 3,
  etaMinutes: null,
  clientAddress: { label: 'Chilonzor 9' },
  addressLat: null,
  addressLng: null,
  cancelReason: null,
  cancelledBy: null,
  cancelledAt: null,
  assignmentAttempts: 0,
  assignedAt: null,
  masterAckedAt: null,
  enRouteAt: null,
  arrivedAt: null,
  startedAt: null,
  completedAt: null,
  closedAt: null,
  idempotencyKey: null,
  createdAt: new Date('2026-09-20T05:00:00.000Z'),
  updatedAt: new Date('2026-09-20T05:00:00.000Z'),
  master: null,
  category: null,
  rating: null,
} as unknown as OrderWithRelations;

describe('OrderRealtimeListener (TZ 3.5 — jonli yangilanish)', () => {
  let emitToUser: jest.Mock;
  let findById: jest.Mock;
  let listener: OrderRealtimeListener;

  beforeEach(() => {
    emitToUser = jest.fn();
    findById = jest.fn().mockResolvedValue(snapshot);
    listener = new OrderRealtimeListener({ findById } as never, { emitToUser } as never);
  });

  it('holat oʻzgarganda mijozga toʻliq suratni yuboradi', () => {
    // Act
    listener.onSnapshotChanged(new OrderSnapshotChangedEvent('order-1', 'client-1', snapshot));

    // Assert
    const [userId, event, payload] = emitToUser.mock.calls[0] as [string, string, { id: string }];
    expect(userId).toBe('client-1');
    expect(event).toBe(WS_EVENT_ORDER_UPDATED);
    expect(payload).toMatchObject({
      id: 'order-1',
      shortId: 'HZ-104901',
      status: OrderStatus.SEARCHING_QUEUED,
      paymentMethod: 'cash',
      invoice: { base: 100_000, discount: 2_000, total: 98_000 },
    });
  });

  it('hodisadagi suratdan foydalanadi — bazaga qayta murojaat qilmaydi', () => {
    listener.onSnapshotChanged(new OrderSnapshotChangedEvent('order-1', 'client-1', snapshot));

    expect(findById).not.toHaveBeenCalled();
  });

  it('navbat oʻrni siljiganda suratni bazadan oʻqib yuboradi', async () => {
    await listener.onQueueChanged({ orderId: 'order-1' } as never);

    expect(findById).toHaveBeenCalledWith('order-1');
    expect(emitToUser).toHaveBeenCalledWith(
      'client-1',
      WS_EVENT_ORDER_UPDATED,
      expect.objectContaining({ queuePosition: 3 }),
    );
  });

  it("buyurtma topilmasa hech narsa yubormaydi (boʻsh surat chizilmaydi)", async () => {
    findById.mockResolvedValue(null);

    await listener.onQueueChanged({ orderId: 'yoʻq' } as never);

    expect(emitToUser).not.toHaveBeenCalled();
  });

  it('WS xatosi domen oqimini toʻxtatmaydi', () => {
    emitToUser.mockImplementation(() => {
      throw new Error('socket yopilgan');
    });

    expect(() =>
      listener.onSnapshotChanged(new OrderSnapshotChangedEvent('order-1', 'client-1', snapshot)),
    ).not.toThrow();
  });
});
