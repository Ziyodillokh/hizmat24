import { describe, expect, it } from 'vitest';
import { reviveSession } from './persistence';
import { formatPrice } from '@/lib/formatters';

/**
 * Eski yozuvning migratsiyasi.
 *
 * Bu testlar REAL xavfni qoplaydi: ilova qurilmada saqlangan sessiyadan
 * ochiladi va har bosqichda sxemaga yangi maydon qoʻshiladi. Migratsiya
 * buzilsa foydalanuvchi buyurtma tarixini yoʻqotadi va buni hech kim
 * sezmaydi — hech qanday xato yozuvi chiqmaydi.
 */
const LEGACY_ORDER = {
  id: 'live-1',
  shortId: 'HZ-104901',
  categoryId: 'c-tap',
  categoryName: 'Kran taʼmirlash',
  categoryIconKey: 'tap',
  description: 'Kran oqmoqda',
  // 3-bosqichdan oldingi shakl: `invoice` oʻrniga bitta `price`.
  price: 150_000,
  scheduledAt: null,
  isUrgent: false,
  address: { label: 'Chilonzor 9-kvartal' },
  status: 'CLOSED',
  master: null,
  etaMinutes: null,
  queuePosition: null,
  createdAt: new Date(2026, 8, 1, 10, 0).toISOString(),
  completedAt: new Date(2026, 8, 1, 12, 0).toISOString(),
  cancelReason: null,
  cancelledBy: null,
  rating: null,
};

describe('reviveSession — obyekt boʻlmagan kirish', () => {
  it('null va massivda null qaytadi', () => {
    expect(reviveSession(null)).toBeNull();
    expect(reviveSession('{}')).toBeNull();
    expect(reviveSession(42)).toBeNull();
  });

  it('boʻsh obyektda toza sessiya qaytadi — qulamaydi', () => {
    const session = reviveSession({});
    expect(session).not.toBeNull();
    expect(session?.isAuthenticated).toBe(false);
    expect(session?.phoneNumber).toBe('');
    expect(session?.fullName).toBeNull();
    expect(session?.orders).toEqual([]);
    expect(session?.readNotificationIds).toEqual([]);
  });
});

describe('reviveSession — fullName (6-bosqich)', () => {
  it('eski yozuvda maydon yoʻq — null boʻlib tiklanadi', () => {
    expect(reviveSession({ isAuthenticated: true })?.fullName).toBeNull();
  });

  it('saqlangan ism qaytadi', () => {
    expect(reviveSession({ fullName: 'Dilshod' })?.fullName).toBe('Dilshod');
  });

  it('boʻsh va faqat boʻshliqdan iborat ism null boʻladi', () => {
    expect(reviveSession({ fullName: '' })?.fullName).toBeNull();
    expect(reviveSession({ fullName: '   ' })?.fullName).toBeNull();
  });

  it('ism satr boʻlmasa null', () => {
    expect(reviveSession({ fullName: 42 })?.fullName).toBeNull();
  });
});

describe('reviveSession — preferredMasterId (6-bosqich)', () => {
  it('eski buyurtmada maydon yoʻq — null boʻladi', () => {
    const session = reviveSession({ orders: [LEGACY_ORDER] });
    expect(session?.orders).toHaveLength(1);
    expect(session?.orders[0].preferredMasterId).toBeNull();
  });

  it('saqlangan tanlov qaytadi', () => {
    const session = reviveSession({
      orders: [{ ...LEGACY_ORDER, preferredMasterId: 'm-sardor' }],
    });
    expect(session?.orders[0].preferredMasterId).toBe('m-sardor');
  });

  it('satr boʻlmagan qiymat null boʻladi', () => {
    const session = reviveSession({ orders: [{ ...LEGACY_ORDER, preferredMasterId: 7 }] });
    expect(session?.orders[0].preferredMasterId).toBeNull();
  });
});

describe('reviveSession — 3-bosqich migratsiyasi hamon ishlaydi', () => {
  it('eski `price` yakuniy summa boʻlib qoladi — summa yoʻqolmaydi', () => {
    const session = reviveSession({ orders: [LEGACY_ORDER] });
    const [order] = session?.orders ?? [];
    expect(order.invoice.total).toBe(150_000);
    expect(order.invoice.base).toBe(150_000);
    expect(order.invoice.discount).toBe(0);
    // NBSP bilan formatlanadi, shuning uchun taqqoslash formatter orqali.
    expect(formatPrice(order.invoice.total)).toBe(formatPrice(150_000));
  });

  it('sana satrlari `Date` boʻlib qaytadi', () => {
    const [order] = reviveSession({ orders: [LEGACY_ORDER] })?.orders ?? [];
    expect(order.createdAt).toBeInstanceOf(Date);
    expect(order.completedAt).toBeInstanceOf(Date);
    expect(order.scheduledAt).toBeNull();
  });

  it('toʻlov usuli yoʻq boʻlsa "Kafolatli" boʻlib qoladi — tarix qayta yozilmaydi', () => {
    // 2-bosqich bu buyurtmalarni "Kafolatli" deb koʻrsatgan edi. Ularni
    // endi "Naqd" deb koʻrsatish foydalanuvchining oʻz tarixini oʻzgartirish
    // boʻlardi, shuning uchun zaxira qiymat ataylab `escrow`.
    const [order] = reviveSession({ orders: [LEGACY_ORDER] })?.orders ?? [];
    expect(order.paymentMethod).toBe('escrow');
  });

  it('notoʻgʻri toʻlov usuli ham zaxira qiymatga tushadi', () => {
    const [order] = reviveSession({
      orders: [{ ...LEGACY_ORDER, paymentMethod: 'bitcoin' }],
    })?.orders ?? [];
    expect(order.paymentMethod).toBe('escrow');
  });

  it('bahoda `tags` yoʻq boʻlsa boʻsh massiv boʻladi — `join` qulamaydi', () => {
    const [order] = reviveSession({
      orders: [{ ...LEGACY_ORDER, rating: { stars: 2, comment: null } }],
    })?.orders ?? [];
    expect(order.rating?.tags).toEqual([]);
    expect(() => order.rating?.tags.join(' · ')).not.toThrow();
  });

  it('buzuq buyurtma tushib qoladi, butuni saqlanadi', () => {
    const session = reviveSession({
      orders: [{ id: 'yaroqsiz' }, LEGACY_ORDER, null],
    });
    expect(session?.orders).toHaveLength(1);
    expect(session?.orders[0].id).toBe('live-1');
  });
});
