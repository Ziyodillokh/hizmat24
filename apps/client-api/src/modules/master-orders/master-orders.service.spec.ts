import { MasterStatus, OrderStatus } from '@prisma/client';
import { MasterOrdersService } from './master-orders.service';

const MASTER = 'master-1';
const USER = 'user-1';
const ORDER = '11111111-1111-4111-8111-111111111111';
const CONTEXT = { ipAddress: '127.0.0.1', userAgent: 'test' };

const dbOrder = (patch: Record<string, unknown> = {}) => ({
  id: ORDER,
  shortId: 'HZ-104901',
  clientId: 'client-1',
  masterId: MASTER,
  status: OrderStatus.ASSIGNED,
  masterAckedAt: null,
  description: 'Kran oqmoqda',
  attachmentUrls: [],
  isUrgent: false,
  price: 100_000,
  priceBase: 100_000,
  priceUrgentFee: 0,
  discountPercent: 0,
  discountAmount: 0,
  paymentMethod: 'CASH',
  scheduledAt: null,
  preferredMasterId: null,
  queuePosition: null,
  etaMinutes: null,
  clientAddress: { label: 'Namangan, Uychi 5' },
  workNote: null,
  handledByMaster: false,
  cancelReason: null,
  cancelledBy: null,
  createdAt: new Date('2026-09-24T10:00:00.000Z'),
  updatedAt: new Date('2026-09-24T10:00:00.000Z'),
  completedAt: null,
  master: null,
  category: null,
  rating: null,
  client: { fullName: 'Dilshod', phoneNumber: '+998901234567' },
  ...patch,
});

describe('MasterOrdersService', () => {
  let service: MasterOrdersService;
  let lockedRow: Record<string, unknown>;
  let orderUpdate: jest.Mock;
  let orderFindUnique: jest.Mock;
  let masterUpdate: jest.Mock;
  let applyTransition: jest.Mock;
  let requestMatching: jest.Mock;
  let record: jest.Mock;
  let profileFindUnique: jest.Mock;
  let declineUpsert: jest.Mock;

  beforeEach(() => {
    lockedRow = {
      id: ORDER,
      status: OrderStatus.ASSIGNED,
      master_id: MASTER,
      master_acked_at: null,
    };
    orderUpdate = jest.fn().mockResolvedValue(dbOrder());
    orderFindUnique = jest.fn().mockResolvedValue(dbOrder());
    masterUpdate = jest.fn().mockResolvedValue({});
    applyTransition = jest.fn().mockResolvedValue(dbOrder());
    requestMatching = jest.fn().mockResolvedValue(undefined);
    record = jest.fn().mockResolvedValue(undefined);
    profileFindUnique = jest.fn().mockResolvedValue({ availableSince: new Date() });
    declineUpsert = jest.fn().mockResolvedValue({});

    const tx = {
      $queryRaw: jest.fn().mockImplementation(() => Promise.resolve([lockedRow])),
      order: { update: orderUpdate, findUnique: orderFindUnique },
      master: { update: masterUpdate },
      masterProfile: { findUnique: profileFindUnique },
      orderMasterDecline: { upsert: declineUpsert },
    };

    const prisma = {
      master: { findUnique: jest.fn().mockResolvedValue({ id: MASTER, isActive: true }) },
      order: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: (fn: (client: typeof tx) => unknown) => fn(tx),
    };

    const orders = {
      findEntity: jest.fn().mockResolvedValue({ id: ORDER, status: OrderStatus.ASSIGNED }),
      applyTransition,
    };

    service = new MasterOrdersService(
      prisma as never,
      orders as never,
      { requestMatching } as never,
      { record } as never,
    );
  });

  const act = (action: Parameters<MasterOrdersService['act']>[3], payload = {}) =>
    service.act(MASTER, USER, ORDER, action, payload, CONTEXT);

  describe('egalik qorovuli', () => {
    /*
     * Eng muhim poyga: usta tugmani bosguncha javob kutish vaqti tugab,
     * buyurtma boshqa ustaga oʻtib ketishi mumkin. Ikkalasi ham
     * «muvaffaqiyat» deb javob bersa, ikki usta bitta manzilga borardi.
     */
    it('boshqa ustaga oʻtgan ishda amal bajarilmaydi', async () => {
      lockedRow.master_id = 'master-2';

      await expect(act('accept')).rejects.toThrow('boshqa usta');
      expect(orderUpdate).not.toHaveBeenCalled();
    });

    it('ustasiz qolgan ishda sabab aytiladi', async () => {
      lockedRow.master_id = null;

      await expect(act('accept')).rejects.toThrow('kutish vaqti');
    });
  });

  describe('qabul qilish', () => {
    it('holatni oʻzgartirmaydi — faqat javob vaqtini yozadi', async () => {
      await act('accept');

      expect(applyTransition).not.toHaveBeenCalled();
      expect(orderUpdate.mock.calls[0][0].data).toMatchObject({ handledByMaster: true });
      expect(orderUpdate.mock.calls[0][0].data.masterAckedAt).toBeInstanceOf(Date);
    });

    it('ikkinchi marta qabul qilinmaydi', async () => {
      lockedRow.master_acked_at = new Date();

      await expect(act('accept')).rejects.toThrow('allaqachon');
    });
  });

  describe('rad etish', () => {
    it('ustani boʻshatadi, qidiruvga qaytaradi va qayta qidiruv soʻraydi', async () => {
      await act('decline', { reason: 'Bandman' });

      expect(applyTransition.mock.calls[0][1]).toBe(OrderStatus.SEARCHING);
      expect(applyTransition.mock.calls[0][2].data).toMatchObject({ masterId: null });
      expect(requestMatching).toHaveBeenCalledWith(ORDER, [MASTER]);
    });

    /*
     * Joriy urinishdan chetlatish YETARLI EMAS: rejalashtiruvchi har 10
     * soniyada qidiruvni qaytadan boshlaydi va istisno roʻyxati unda
     * yoʻq. Rad etish yozuv boʻlib qolmasa, oʻsha ish bir necha
     * soniyada oʻsha ustaga qaytib kelardi.
     */
    it('rad etish YOZUV boʻlib qoladi', async () => {
      await act('decline', { reason: 'Bandman' });

      expect(declineUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId_masterId: { orderId: ORDER, masterId: MASTER } },
        }),
      );
    });

    /*
     * Qayta qidiruv tranzaksiyadan TASHQARIDA boʻlishi shart: Redis ga
     * yozish bazani keraksiz uzoq ushlab turardi.
     */
    it('amal rad etilsa qayta qidiruv umuman soʻralmaydi', async () => {
      lockedRow.master_acked_at = new Date();

      await expect(act('decline')).rejects.toThrow();
      expect(requestMatching).not.toHaveBeenCalled();
    });
  });

  describe('yoʻlga chiqish', () => {
    it('qabul qilinmagan ishda toʻsiladi', async () => {
      await expect(act('depart', { etaMinutes: 20 })).rejects.toThrow('Avval ishni qabul qiling');
    });

    it('qabul qilingan ishda vaqt bilan birga yoziladi', async () => {
      lockedRow.master_acked_at = new Date();

      await act('depart', { etaMinutes: 20 });

      expect(applyTransition.mock.calls[0][1]).toBe(OrderStatus.MASTER_EN_ROUTE);
      expect(applyTransition.mock.calls[0][2].data).toMatchObject({ etaMinutes: 20 });
    });
  });

  describe('yakunlash', () => {
    beforeEach(() => {
      lockedRow.status = OrderStatus.IN_PROGRESS;
      lockedRow.master_acked_at = new Date();
    });

    it('izohni yozadi va ustani boʻshatadi', async () => {
      await act('finish', { workNote: '  Kran almashtirildi  ' });

      expect(applyTransition.mock.calls[0][1]).toBe(OrderStatus.COMPLETED_BY_MASTER);
      expect(applyTransition.mock.calls[0][2].data).toMatchObject({
        workNote: 'Kran almashtirildi',
      });
      expect(masterUpdate).toHaveBeenCalled();
    });

    it('boʻsh izoh `null` boʻlib yoziladi — boʻsh satr emas', async () => {
      await act('finish', { workNote: '   ' });

      expect(applyTransition.mock.calls[0][2].data.workNote).toBeNull();
    });

    /*
     * Smenasini yopib qoʻygan usta ish tugagach yana taklif olmasligi
     * kerak: u ishlamayotganini aytgan.
     */
    it('smenasi yopiq usta ish tugagach OFFLINE boʻladi', async () => {
      profileFindUnique.mockResolvedValue({ availableSince: null });

      await act('finish', {});

      expect(masterUpdate.mock.calls[0][0].data.status).toBe(MasterStatus.OFFLINE);
    });

    it('smenasi ochiq usta yana ish qabul qila oladi', async () => {
      await act('finish', {});

      expect(masterUpdate.mock.calls[0][0].data.status).toBe(MasterStatus.AVAILABLE);
    });
  });

  describe('mijoz maʼlumoti', () => {
    /*
     * Taklif bosqichida begona odamning telefon raqami koʻrsatilmaydi:
     * usta ishni olmasa ham raqam qoʻlida qolib ketardi.
     */
    it('javob berilmagan taklifda telefon raqami YOʻQ', async () => {
      orderFindUnique.mockResolvedValue(dbOrder({ masterAckedAt: null }));
      lockedRow.master_acked_at = null;

      const view = await act('accept');

      expect(view.bucket).toBe('offer');
      expect(view.client).toBeNull();
    });

    it('qabul qilingan ishda telefon raqami koʻrinadi', async () => {
      orderFindUnique.mockResolvedValue(dbOrder({ masterAckedAt: new Date() }));

      const view = await act('accept');

      expect(view.bucket).toBe('active');
      expect(view.client?.phoneNumber).toBe('+998901234567');
    });
  });

  describe('usta hisobi', () => {
    it('usta boʻlmagan odamga aniq sabab aytiladi', async () => {
      const prisma = { master: { findUnique: jest.fn().mockResolvedValue(null) } };
      const lonely = new MasterOrdersService(prisma as never, {} as never, {} as never, {} as never);

      await expect(lonely.requireMasterId(USER)).rejects.toThrow('arizangiz');
    });

    it('bloklangan usta boshqa sabab oladi', async () => {
      const prisma = {
        master: { findUnique: jest.fn().mockResolvedValue({ id: MASTER, isActive: false }) },
      };
      const blocked = new MasterOrdersService(prisma as never, {} as never, {} as never, {} as never);

      await expect(blocked.requireMasterId(USER)).rejects.toThrow('bloklangan');
    });
  });
});
