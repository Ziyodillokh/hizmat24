import { describe, expect, it } from 'vitest';
import { toAppStatus, toCreatePayload, toLiveOrder, type ServerOrder } from './orderDto';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { EMPTY_DRAFT } from '@/app/types';

const raw: ServerOrder = {
  id: 'o-1',
  shortId: 'HZ-104905',
  status: 'SEARCHING',
  description: 'Sifon oqmoqda',
  isUrgent: true,
  invoice: { base: 120_000, urgentFee: 20_000, discountPercent: 2, discount: 2_400, total: 137_600 },
  paymentMethod: 'cash',
  scheduledAt: null,
  preferredMasterId: null,
  queuePosition: null,
  etaMinutes: null,
  clientAddress: { label: 'Chilonzor 9-kvartal, 42-uy', entrance: '2', floor: '5', apartment: '34' },
  category: { id: 'c-1', name: 'Santexnika taʼmiri', iconKey: 'plumbing-repair', basePrice: 120_000 },
  master: null,
  workNote: null,
  handledByMaster: false,
  cancelReason: null,
  cancelledBy: null,
  rating: null,
  createdAt: '2026-09-21T02:02:02.623+05:00',
  completedAt: null,
};

describe('toAppStatus', () => {
  it('serverdagi RATED ilovada CLOSED boʻladi', () => {
    expect(toAppStatus('RATED')).toBe(ORDER_STATUS.CLOSED);
  });

  it('mavjud holatlar oʻzgarmaydi', () => {
    expect(toAppStatus('MASTER_EN_ROUTE')).toBe(ORDER_STATUS.MASTER_EN_ROUTE);
    expect(toAppStatus('CANCELLED')).toBe(ORDER_STATUS.CANCELLED);
  });

  it('notanish holat buyurtmani yoʻqotmaydi', () => {
    expect(toAppStatus('DRAFT')).toBe(ORDER_STATUS.SEARCHING);
    expect(toAppStatus('KELAJAKDAGI_HOLAT')).toBe(ORDER_STATUS.SEARCHING);
  });
});

describe('toLiveOrder', () => {
  it('asosiy maydonlar oʻgiriladi', () => {
    const order = toLiveOrder(raw);
    expect(order).toMatchObject({
      id: 'o-1',
      shortId: 'HZ-104905',
      categoryId: 'c-1',
      categoryIconKey: 'plumbing-repair',
      paymentMethod: 'cash',
      handledByMaster: false,
    });
    expect(order.invoice.total).toBe(137_600);
    expect(order.createdAt).toBeInstanceOf(Date);
    expect(order.scheduledAt).toBeNull();
    expect(order.completedAt).toBeNull();
  });

  it('usta boʻlsa toʻliq yozuv yigʻiladi', () => {
    const order = toLiveOrder({
      ...raw,
      status: 'ASSIGNED',
      etaMinutes: 20,
      master: {
        id: 'm-1',
        fullName: 'Akmal Rahimov',
        photoUrl: null,
        experienceLevel: 'EXPERIENCED',
        hasGovCertificate: true,
        ratingAvg: 4.8,
        completedOrdersCount: 214,
        phoneNumber: '+998901112233',
      },
    });
    expect(order.master).toMatchObject({
      id: 'm-1',
      fullName: 'Akmal Rahimov',
      profession: 'Santexnik',
      ratingAvg: 4.8,
      phoneNumber: '+998901112233',
    });
    expect(order.master?.photoUrl).toBeUndefined();
    expect(order.etaMinutes).toBe(20);
  });

  /*
   * Kasb tajribadan YASALMAYDI. Ilgari bu yerda «Yangi usta» /
   * «Tajribali usta» degan yorliq chiqardi — ustadan tajriba
   * soʻralmaydi va bu toʻqilgan maʼlumot edi.
   */
  it('tajriba darajasi kasbni oʻzgartirmaydi', () => {
    const order = toLiveOrder({
      ...raw,
      master: { ...raw.master, id: 'm-2', fullName: 'Yangi', photoUrl: null, experienceLevel: 'NEW', hasGovCertificate: false, ratingAvg: 0, completedOrdersCount: 0, phoneNumber: null } as ServerOrder['master'],
    });
    // Kasb tajribadan YASALMAYDI: platformada u yagona — santexnik.
    expect(order.master?.profession).toBe('Santexnik');
  });

  it('baho teglari boʻlmasa boʻsh massiv', () => {
    const order = toLiveOrder({ ...raw, status: 'RATED', rating: { stars: 5, comment: null } });
    expect(order.status).toBe(ORDER_STATUS.CLOSED);
    expect(order.rating).toEqual({ stars: 5, comment: '', tags: [] });
  });

  it('kategoriyasiz buyurtma ham yiqilmaydi', () => {
    const order = toLiveOrder({ ...raw, category: null });
    expect(order.categoryId).toBe('');
    expect(order.categoryName).toBe('Xizmat');
    expect(order.categoryIconKey).toBe('plumber');
  });

  it('buzuq sana `null` boʻladi, yaratilgan vaqt esa hech qachon boʻsh emas', () => {
    const order = toLiveOrder({ ...raw, createdAt: 'yaroqsiz', completedAt: 'yaroqsiz' });
    expect(order.createdAt).toBeInstanceOf(Date);
    expect(order.completedAt).toBeNull();
  });

  it('rejalashtirilgan vaqt oʻgiriladi', () => {
    const order = toLiveOrder({ ...raw, scheduledAt: '2026-09-22T14:00:00.000+05:00' });
    expect(order.scheduledAt).toBeInstanceOf(Date);
  });
});

describe('toCreatePayload', () => {
  const draft = {
    ...EMPTY_DRAFT,
    categoryId: 'c-1',
    description: '  Sifon oqmoqda  ',
    isUrgent: true,
    paymentMethod: 'cash' as const,
    address: { label: 'Chilonzor 42-uy' },
  };

  it('qoralamadan soʻrov yigʻiladi va narx YUBORILMAYDI', () => {
    const payload = toCreatePayload(draft);
    expect(payload).toEqual({
      categoryId: 'c-1',
      description: 'Sifon oqmoqda',
      isUrgent: true,
      paymentMethod: 'cash',
      clientAddress: { label: 'Chilonzor 42-uy' },
    });
    expect(JSON.stringify(payload)).not.toContain('price');
    expect(JSON.stringify(payload)).not.toContain('invoice');
  });

  it('rejalashtirilgan vaqt va soʻralgan usta qoʻshiladi', () => {
    const payload = toCreatePayload({
      ...draft,
      scheduledAt: new Date('2026-09-22T09:00:00.000Z'),
      preferredMasterId: 'm-1',
    });
    expect(payload?.scheduledAt).toBe('2026-09-22T09:00:00.000Z');
    expect(payload?.preferredMasterId).toBe('m-1');
  });

  it('toʻliq boʻlmagan qoralama yuborilmaydi', () => {
    expect(toCreatePayload({ ...draft, categoryId: null })).toBeNull();
    expect(toCreatePayload({ ...draft, address: null })).toBeNull();
    expect(toCreatePayload({ ...draft, paymentMethod: null })).toBeNull();
  });
});
