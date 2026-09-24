import { ActorType, AuditAction, CancelledBy, OrderStatus } from '@prisma/client';
import { MAX_ASSIGNMENT_ATTEMPTS } from '@shared/index';
import { AdminOrdersService } from './admin-orders.service';

const ADMIN = { id: 'admin-1' } as never;
const CONTEXT = { ipAddress: '127.0.0.1', userAgent: 'test' };
const ORDER = '11111111-1111-4111-8111-111111111111';

const dbOrder = (patch: Record<string, unknown> = {}) => ({
  id: ORDER,
  shortId: 'HZ-104901',
  status: OrderStatus.SEARCHING,
  price: 120_000,
  isUrgent: false,
  assignmentAttempts: MAX_ASSIGNMENT_ATTEMPTS,
  clientAddress: { label: 'Namangan, Uychi 5' },
  createdAt: new Date('2026-09-24T10:00:00.000Z'),
  client: { fullName: 'Dilshod', phoneNumber: '+998901234567' },
  master: null,
  category: { name: 'Santexnika taʼmiri' },
  description: 'Kran oqmoqda',
  paymentMethod: 'CASH',
  workNote: null,
  cancelReason: null,
  scheduledAt: null,
  statusHistory: [],
  ...patch,
});

describe('AdminOrdersService', () => {
  let service: AdminOrdersService;
  let findUnique: jest.Mock;
  let findMany: jest.Mock;
  let count: jest.Mock;
  let update: jest.Mock;
  let applyTransition: jest.Mock;
  let requestMatching: jest.Mock;
  let record: jest.Mock;

  beforeEach(() => {
    findUnique = jest.fn().mockResolvedValue(dbOrder());
    findMany = jest.fn().mockResolvedValue([dbOrder()]);
    count = jest.fn().mockResolvedValue(3);
    update = jest.fn().mockResolvedValue({});
    applyTransition = jest.fn().mockResolvedValue({});
    requestMatching = jest.fn().mockResolvedValue(undefined);
    record = jest.fn().mockResolvedValue(undefined);

    const tx = { order: { update } };
    const prisma = {
      order: { findUnique, findMany, count },
      $transaction: (fn: (client: typeof tx) => unknown) => fn(tx),
    };
    const orders = {
      findEntity: jest.fn().mockResolvedValue({ id: ORDER, status: OrderStatus.SEARCHING }),
      applyTransition,
    };

    service = new AdminOrdersService(
      prisma as never,
      orders as never,
      { requestMatching } as never,
      { record } as never,
    );
  });

  describe('roʻyxat', () => {
    it('eskalatsiya hisoblanadi, ustun sifatida oʻqilmaydi', async () => {
      const page = await service.list({});

      expect(page.items[0].isEscalated).toBe(true);
      expect(page.escalatedCount).toBe(3);
    });

    it('usta topilgan buyurtma eskalatsiyada emas', async () => {
      findMany.mockResolvedValue([dbOrder({ status: OrderStatus.ASSIGNED })]);

      const page = await service.list({});

      expect(page.items[0].isEscalated).toBe(false);
    });

    it('manzil yorligʻi buzuq JSON da ham yiqilmaydi', async () => {
      findMany.mockResolvedValue([dbOrder({ clientAddress: 'buzuq' })]);

      expect((await service.list({})).items[0].addressLabel).toBeNull();
    });

    /*
     * Operator qoʻlida odatda buyurtma raqami yoki mijoz telefoni
     * boʻladi — qidiruv aynan shu ikkisi boʻyicha ishlaydi.
     */
    it('qidiruv raqam va telefon boʻyicha', async () => {
      await service.list({ search: 'HZ-1049' });

      const where = findMany.mock.calls[0][0].where;
      expect(where.OR).toHaveLength(2);
    });

    it('sana oraligʻi filtri qoʻllanadi', async () => {
      await service.list({ from: '2026-09-01T00:00:00.000Z' });

      expect(findMany.mock.calls[0][0].where.createdAt.gte).toBeInstanceOf(Date);
    });
  });

  describe('qayta qidiruv', () => {
    /*
     * Urinishlar hisobi NOLGA tushiriladi: aks holda buyurtma darhol
     * yana eskalatsiyaga qaytardi va tugma hech narsa qilmagandek
     * koʻrinardi.
     */
    it('urinishlarni nolga tushiradi va qidiruvni qayta soʻraydi', async () => {
      await service.requeue(ORDER, ADMIN, CONTEXT);

      expect(update.mock.calls[0][0].data).toMatchObject({ assignmentAttempts: 0 });
      expect(requestMatching).toHaveBeenCalledWith(ORDER);
      expect(record.mock.calls[0][0].action).toBe(AuditAction.ADMIN_ORDER_REQUEUED);
    });

    it('ustasi bor buyurtma qaytarilmaydi', async () => {
      findUnique.mockResolvedValue(dbOrder({ status: OrderStatus.ASSIGNED }));

      await expect(service.requeue(ORDER, ADMIN, CONTEXT)).rejects.toThrow('usta topilmagan');
      expect(requestMatching).not.toHaveBeenCalled();
    });
  });

  describe('bekor qilish', () => {
    it('SYSTEM nomidan bekor qiladi va sababni yozadi', async () => {
      await service.cancel(ORDER, 'Mijoz telefon orqali soʻradi', ADMIN, CONTEXT);

      const [, next, context] = applyTransition.mock.calls[0];
      expect(next).toBe(OrderStatus.CANCELLED);
      expect(context.actorType).toBe(ActorType.ADMIN);
      expect(context.data.cancelledBy).toBe(CancelledBy.SYSTEM);
      expect(context.data.cancelReason).toBe('Mijoz telefon orqali soʻradi');
    });

    /*
     * `SAFETY_FLAGGED` — terminal holat va u oʻzgartirilmaydi: mijoz
     * ustani rad etgan hodisa tarixda oʻz holicha qolishi kerak.
     */
    it('xavfsizlik bayrogʻi qoʻyilgan buyurtmaga tegilmaydi', async () => {
      findUnique.mockResolvedValue(dbOrder({ status: OrderStatus.SAFETY_FLAGGED }));

      await expect(service.cancel(ORDER, 'sabab matni', ADMIN, CONTEXT)).rejects.toThrow();
      expect(applyTransition).not.toHaveBeenCalled();
    });

    it('yopilgan buyurtma bekor qilinmaydi', async () => {
      findUnique.mockResolvedValue(dbOrder({ status: OrderStatus.CLOSED }));

      await expect(service.cancel(ORDER, 'sabab matni', ADMIN, CONTEXT)).rejects.toThrow();
    });
  });

  describe('kartochka', () => {
    it('holatlar tarixi bilan qaytadi', async () => {
      findUnique.mockResolvedValue(
        dbOrder({
          statusHistory: [
            {
              fromStatus: OrderStatus.SEARCHING,
              toStatus: OrderStatus.ASSIGNED,
              actorType: ActorType.SYSTEM,
              reason: null,
              createdAt: new Date(),
            },
          ],
        }),
      );

      const detail = await service.detail(ORDER);

      expect(detail.timeline).toHaveLength(1);
      expect(detail.shortId).toBe('HZ-104901');
    });

    /*
     * Panel qaysi tugmani chizishni SERVERDAN soʻraydi. Aks holda
     * qoida ikki joyda yashab, tugma ochiq turib soʻrov rad etilardi.
     */
    it('qaysi amal mumkinligini oʻzi aytadi', async () => {
      const detail = await service.detail(ORDER);

      expect(detail.canRequeue).toBe(true);
      expect(detail.canCancel).toBe(true);
      expect(detail.requeueBlockedReason).toBeNull();
    });

    it('xavfsizlik bayrogʻida ikkala amal ham yopiq va sababi bor', async () => {
      findUnique.mockResolvedValue(dbOrder({ status: OrderStatus.SAFETY_FLAGGED }));

      const detail = await service.detail(ORDER);

      expect(detail.canRequeue).toBe(false);
      expect(detail.canCancel).toBe(false);
      expect(detail.cancelBlockedReason).not.toBeNull();
    });

    it('topilmagan buyurtma aniq xato beradi', async () => {
      findUnique.mockResolvedValue(null);

      await expect(service.detail(ORDER)).rejects.toThrow('topilmadi');
    });
  });
});
