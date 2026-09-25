import { describe, expect, it } from 'vitest';
import type { LiveOrder } from '@/app/types';
import type { Master } from '@/mocks/types';
import {
  adjacentHistoryFilter,
  countByHistoryFilter,
  EMPTY_CTA_LABELS,
  emptyStateFor,
  filterLabelWithCount,
  groupOrdersByDate,
  HISTORY_FILTERS,
  historyDateLabel,
  isEmphasisedAction,
  ORDER_ROUTES,
  orderFactLine,
  primaryListAction,
  secondaryListAction,
  sortByCreatedDesc,
  splitOrderList,
} from './orderList';
import {
  canCancel,
  canOpenEnRoute,
  canRate,
  hasReceipt,
  isBlockingConfirmation,
  isTerminal,
  ORDER_STATUS,
  type HistoryFilter,
  type OrderStatus,
} from './orderStateMachine';

/** Nazorat qilinadigan sana — `new Date()` ishlatilmaydi. 2026-09-13, yakshanba. */
const NOW = new Date(2026, 8, 13, 14, 30);
const TODAY_MORNING = new Date(2026, 8, 13, 9, 38);
const YESTERDAY = new Date(2026, 8, 12, 18, 5);
const LAST_MONTH = new Date(2026, 7, 5, 18, 5);
const LAST_YEAR = new Date(2025, 11, 5, 14, 30);

const ALL: OrderStatus[] = Object.values(ORDER_STATUS);

const MASTER: Master = {
  id: 'm-1',
  fullName: 'Akmal Rahimov',
  profession: 'Santexnik',
  experienceLevel: 'EXPERIENCED',
  hasGovCertificate: true,
  ratingAvg: 4.8,
  completedOrdersCount: 120,
  phoneNumber: '+998901234567',
};

let counter = 0;

function makeOrder(overrides: Partial<LiveOrder> = {}): LiveOrder {
  counter += 1;
  return {
    id: `live-${counter}`,
    shortId: `HZ-1049${counter.toString().padStart(2, '0')}`,
    categoryId: 'c-tap',
    categoryName: 'Kran taʼmirlash',
    categoryIconKey: 'tap',
    description: 'Kran oqmoqda',
    invoice: { unitPrice: 100_000, quantity: 1, base: 100_000, urgentFee: 0, discountPercent: 0, discount: 0, total: 100_000 },
    paymentMethod: 'cash',
    preferredMasterId: null,
    scheduledAt: null,
    isUrgent: false,
    address: { label: 'Chilonzor 5' },
    status: ORDER_STATUS.SEARCHING,
    master: null,
    etaMinutes: null,
    queuePosition: null,
    createdAt: TODAY_MORNING,
    completedAt: null,
    cancelReason: null,
    cancelledBy: null,
    rating: null,
    handledByMaster: false,
    workNote: null,
    ...overrides,
  };
}

const NO_ASCII_APOSTROPHE = /^[^']*$/;

describe('sortByCreatedDesc / groupOrdersByDate', () => {
  it('kirish massivini oʻzgartirmaydi va yangi massiv qaytaradi', () => {
    const older = makeOrder({ createdAt: YESTERDAY });
    const newer = makeOrder({ createdAt: TODAY_MORNING });
    const input = [older, newer];

    const result = sortByCreatedDesc(input);

    expect(result).not.toBe(input);
    expect(input).toEqual([older, newer]);
    expect(result.map((o) => o.id)).toEqual([newer.id, older.id]);
  });

  it('guruh sarlavhalari tartibli va takrorlanmaydi — kirish aralash boʻlsa ham', () => {
    const orders = [
      makeOrder({ createdAt: LAST_MONTH }),
      makeOrder({ createdAt: TODAY_MORNING }),
      makeOrder({ createdAt: LAST_YEAR }),
      makeOrder({ createdAt: YESTERDAY }),
      makeOrder({ createdAt: new Date(2026, 8, 13, 12, 0) }),
    ];

    const groups = groupOrdersByDate(orders, NOW);

    expect(groups.map((g) => g.title)).toEqual(['Bugun', 'Kecha', 'Avgust', '2025-yil dekabr']);
    expect(groups[0].orders.map((o) => o.createdAt.getHours())).toEqual([12, 9]);
  });

  it('boʻsh kirish → boʻsh guruhlar', () => {
    expect(groupOrdersByDate([], NOW)).toEqual([]);
  });
});

describe('splitOrderList', () => {
  const searching = makeOrder({ status: ORDER_STATUS.SEARCHING, createdAt: TODAY_MORNING });
  const inProgress = makeOrder({ status: ORDER_STATUS.IN_PROGRESS, createdAt: YESTERDAY });
  const arrived = makeOrder({ status: ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION, createdAt: LAST_MONTH });
  const closed = makeOrder({ status: ORDER_STATUS.CLOSED, createdAt: YESTERDAY });
  const cancelled = makeOrder({ status: ORDER_STATUS.CANCELLED, createdAt: LAST_MONTH });
  const flagged = makeOrder({ status: ORDER_STATUS.SAFETY_FLAGGED, createdAt: LAST_YEAR });
  // Ataylab eskidan yangiga — tab store tartibiga tayanmasligi kerak.
  const orders = [flagged, cancelled, arrived, closed, inProgress, searching];

  it('"all": faol zona faqat terminal boʻlmaganlar, yangidan eskiga', () => {
    const { active, history } = splitOrderList(orders, 'all', NOW);

    expect(active.map((o) => o.id)).toEqual([searching.id, inProgress.id, arrived.id]);
    expect(history.flatMap((g) => g.orders.map((o) => o.id))).toEqual([closed.id, cancelled.id, flagged.id]);
    expect(history.map((g) => g.title)).toEqual(['Kecha', 'Avgust', '2025-yil dekabr']);
  });

  it('"active": tarix boʻsh, terminal buyurtmalar boʻlsa ham', () => {
    const { active, history } = splitOrderList(orders, 'active', NOW);
    expect(active).toHaveLength(3);
    expect(history).toEqual([]);
  });

  it('"done": faol boʻsh, tarixda faqat CLOSED', () => {
    const { active, history } = splitOrderList(orders, 'done', NOW);
    expect(active).toEqual([]);
    expect(history.flatMap((g) => g.orders.map((o) => o.status))).toEqual([ORDER_STATUS.CLOSED]);
  });

  it('"cancelled": CANCELLED va SAFETY_FLAGGED', () => {
    const { history } = splitOrderList(orders, 'cancelled', NOW);
    expect(history.flatMap((g) => g.orders.map((o) => o.status))).toEqual([
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.SAFETY_FLAGGED,
    ]);
  });

  it('kelasi haftaga rejalashtirilgan SEARCHING faol zonada, sana guruhida emas', () => {
    const scheduled = makeOrder({ scheduledAt: new Date(2026, 8, 20, 10, 0) });
    const { active, history } = splitOrderList([scheduled], 'all', NOW);
    expect(active.map((o) => o.id)).toEqual([scheduled.id]);
    expect(history).toEqual([]);
  });

  it('kirish massivini oʻzgartirmaydi', () => {
    const snapshot = [...orders];
    splitOrderList(orders, 'all', NOW);
    expect(orders).toEqual(snapshot);
  });

  it('boʻsh kirish → ikkala zona boʻsh', () => {
    expect(splitOrderList([], 'all', NOW)).toEqual({ active: [], history: [] });
  });
});

describe('historyDateLabel', () => {
  it.each([
    ['Bugun', TODAY_MORNING, '09:38'],
    ['Kecha', YESTERDAY, '18:05'],
    ['Avgust', LAST_MONTH, '5-avgust, 18:05'],
    ['2025-yil dekabr', LAST_YEAR, '2025-yil 5-dekabr, 14:30'],
  ])('%s guruhida → %s', (title, date, expected) => {
    expect(historyDateLabel(date, title, NOW)).toBe(expected);
  });
});

describe('countByHistoryFilter / filterLabelWithCount', () => {
  it('boʻsh → hammasi nol', () => {
    expect(countByHistoryFilter([])).toEqual({ all: 0, active: 0, done: 0, cancelled: 0 });
  });

  it('har holatdan bittadan → { all: 10, active: 7, done: 1, cancelled: 2 }', () => {
    expect(countByHistoryFilter(ALL)).toEqual({ all: 10, active: 7, done: 1, cancelled: 2 });
  });

  it('all = active + done + cancelled (COMPLETED_BY_MASTER faol hisoblanadi)', () => {
    const counts = countByHistoryFilter([
      ORDER_STATUS.SEARCHING,
      ORDER_STATUS.COMPLETED_BY_MASTER,
      ORDER_STATUS.CLOSED,
      ORDER_STATUS.CLOSED,
      ORDER_STATUS.CANCELLED,
      ORDER_STATUS.SAFETY_FLAGGED,
    ]);
    expect(counts).toEqual({ all: 6, active: 2, done: 2, cancelled: 2 });
    expect(counts.all).toBe(counts.active + counts.done + counts.cancelled);
  });

  it('yorliq: son bor boʻlsa " · n", nol boʻlsa faqat yorliq', () => {
    expect(filterLabelWithCount('active', 2)).toBe('Faol · 2');
    expect(filterLabelWithCount('cancelled', 0)).toBe('Bekor qilingan');
  });

  it('HISTORY_FILTERS toʻrtta filtrni tartibda beradi', () => {
    expect(HISTORY_FILTERS).toEqual(['all', 'active', 'done', 'cancelled']);
  });
});

describe('orderFactLine — faqat haqiqiy maydonlar', () => {
  it('SEARCHING, rejasiz → soʻrov yuborilgan vaqt', () => {
    expect(orderFactLine(makeOrder(), NOW)).toEqual({ kind: 'sent', text: 'Soʻrov 09:38 da yuborildi' });
  });

  it('SEARCHING, ertaga 10:00 ga rejalashtirilgan', () => {
    const order = makeOrder({ scheduledAt: new Date(2026, 8, 14, 10, 0) });
    expect(orderFactLine(order, NOW)).toEqual({ kind: 'scheduled', text: 'Rejalashtirilgan: Ertaga, 10:00' });
  });

  it('SEARCHING_QUEUED: navbat oʻrni bor → koʻrsatiladi, yoʻq → null', () => {
    const queued = makeOrder({ status: ORDER_STATUS.SEARCHING_QUEUED, queuePosition: 3, etaMinutes: 15 });
    expect(orderFactLine(queued, NOW)).toEqual({ kind: 'queue', text: 'Navbatdagi oʻrningiz: ~3-oʻrin' });
    expect(orderFactLine({ ...queued, queuePosition: null }, NOW)).toBeNull();
  });

  it.each([ORDER_STATUS.ASSIGNED, ORDER_STATUS.MASTER_EN_ROUTE])('%s: ETA bor → "~15 daqiqa", yoʻq → null', (status) => {
    const order = makeOrder({ status, master: MASTER, etaMinutes: 15 });
    expect(orderFactLine(order, NOW)).toEqual({ kind: 'eta', text: 'Taxminiy yetib kelish: ~15 daqiqa' });
    expect(orderFactLine({ ...order, etaMinutes: null }, NOW)).toBeNull();
  });

  it('ARRIVED_PENDING_CONFIRMATION: eskirgan ETA eʼtiborga olinmaydi', () => {
    const order = makeOrder({ status: ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION, master: MASTER, etaMinutes: 15 });
    expect(orderFactLine(order, NOW)).toEqual({ kind: 'confirm', text: 'Tasdiqlashingiz kutilmoqda' });
  });

  it('IN_PROGRESS: usta bor → null (ETA 15 boʻlsa ham); usta yoʻq → neytral satr', () => {
    const order = makeOrder({ status: ORDER_STATUS.IN_PROGRESS, master: MASTER, etaMinutes: 15 });
    expect(orderFactLine(order, NOW)).toBeNull();
    expect(orderFactLine({ ...order, master: null }, NOW)).toEqual({ kind: 'progress', text: 'Ish davom etmoqda' });
  });

  it('COMPLETED_BY_MASTER: yakunlangan vaqt + baholash kutilmoqda', () => {
    const done = new Date(2026, 8, 13, 13, 40);
    const order = makeOrder({ status: ORDER_STATUS.COMPLETED_BY_MASTER, master: MASTER, completedAt: done });
    expect(orderFactLine(order, NOW)).toEqual({
      kind: 'completed',
      text: 'Yakunlandi: Bugun, 13:40 · Baholashni kutmoqda',
    });
    expect(orderFactLine({ ...order, completedAt: null }, NOW)).toEqual({
      kind: 'completed',
      text: 'Baholashni kutmoqda',
    });
  });

  it('CLOSED: completedAt bor → "Yakunlandi: …", yoʻq → null', () => {
    const order = makeOrder({ status: ORDER_STATUS.CLOSED, completedAt: YESTERDAY });
    expect(orderFactLine(order, NOW)).toEqual({ kind: 'completed', text: 'Yakunlandi: Kecha, 18:05' });
    expect(orderFactLine({ ...order, completedAt: null }, NOW)).toBeNull();
  });

  it('CANCELLED: sabab bor → "Sabab: …", yoʻq → null; completedAt hech qachon yozilmaydi', () => {
    const order = makeOrder({ status: ORDER_STATUS.CANCELLED, cancelReason: 'Usta kechikdi', completedAt: YESTERDAY });
    expect(orderFactLine(order, NOW)).toEqual({ kind: 'cancel', text: 'Sabab: Usta kechikdi' });
    expect(orderFactLine({ ...order, cancelReason: null }, NOW)).toBeNull();
  });

  it('SAFETY_FLAGGED: sababdan qatʼi nazar bitta satr', () => {
    const order = makeOrder({ status: ORDER_STATUS.SAFETY_FLAGGED });
    expect(orderFactLine(order, NOW)).toEqual({ kind: 'flagged', text: 'Ustani tasdiqlamadingiz' });
    expect(orderFactLine({ ...order, cancelReason: 'Boshqa odam' }, NOW)?.text).toBe('Ustani tasdiqlamadingiz');
  });

  it('hech bir matnda ASCII apostrof yoʻq', () => {
    for (const status of ALL) {
      const fact = orderFactLine(
        makeOrder({ status, master: MASTER, etaMinutes: 15, queuePosition: 3, completedAt: YESTERDAY, cancelReason: 'x' }),
        NOW,
      );
      if (fact) expect(fact.text).toMatch(NO_ASCII_APOSTROPHE);
    }
  });
});

describe('primaryListAction / secondaryListAction', () => {
  it.each([
    ORDER_STATUS.SEARCHING,
    ORDER_STATUS.SEARCHING_QUEUED,
    ORDER_STATUS.ASSIGNED,
    ORDER_STATUS.IN_PROGRESS,
  ])('%s → "Kuzatish" → tafsilot', (status) => {
    expect(primaryListAction(makeOrder({ id: 'live-x', status }))).toEqual({
      kind: 'track',
      label: 'Kuzatish',
      route: '/app/order/live-x',
    });
  });

  it('MASTER_EN_ROUTE: usta bor → xarita, yoʻq → tafsilot', () => {
    const order = makeOrder({ id: 'live-x', status: ORDER_STATUS.MASTER_EN_ROUTE, master: MASTER });
    expect(primaryListAction(order)).toEqual({ kind: 'map', label: 'Xaritada kuzatish', route: '/app/order/live-x/map' });
    expect(primaryListAction({ ...order, master: null })?.route).toBe('/app/order/live-x');
  });

  it('ARRIVED_PENDING_CONFIRMATION → tasdiqlash ekrani, ikkinchi amal yoʻq', () => {
    const order = makeOrder({ id: 'live-x', status: ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION, master: MASTER });
    expect(primaryListAction(order)).toEqual({
      kind: 'confirm-master',
      label: 'Ustani tasdiqlash',
      route: '/app/order/live-x/confirm-master',
    });
    expect(secondaryListAction(order)).toBeNull();
  });

  it('COMPLETED_BY_MASTER → baholash; ikkinchi amal — chek', () => {
    const order = makeOrder({ id: 'live-x', status: ORDER_STATUS.COMPLETED_BY_MASTER, master: MASTER });
    expect(primaryListAction(order)).toEqual({ kind: 'rate', label: 'Ishni baholash', route: '/app/order/live-x/rate' });
    expect(secondaryListAction(order)).toEqual({ kind: 'receipt', label: 'Chekni koʻrish', route: '/app/order/live-x/receipt' });
  });

  it('CLOSED → chek; CANCELLED va SAFETY_FLAGGED → null (manzilsiz tugma yoʻq)', () => {
    expect(primaryListAction(makeOrder({ id: 'live-x', status: ORDER_STATUS.CLOSED }))?.route).toBe('/app/order/live-x/receipt');
    expect(primaryListAction(makeOrder({ status: ORDER_STATUS.CANCELLED }))).toBeNull();
    expect(primaryListAction(makeOrder({ status: ORDER_STATUS.SAFETY_FLAGGED }))).toBeNull();
  });

  it('bekor qilish faqat canCancel holatlarida va openCancel holati bilan', () => {
    for (const status of ALL) {
      const secondary = secondaryListAction(makeOrder({ id: 'live-x', status, master: MASTER }));
      if (canCancel(status)) {
        expect(secondary).toEqual({
          kind: 'cancel',
          label: 'Bekor qilish',
          route: '/app/order/live-x',
          state: { openCancel: true },
        });
      } else {
        expect(secondary?.kind).not.toBe('cancel');
      }
    }
  });

  it('invariantlar: rate ⇔ canRate, receipt ⇒ hasReceipt, confirm ⇔ isBlockingConfirmation, map ⇒ canOpenEnRoute', () => {
    for (const status of ALL) {
      const order = makeOrder({ status, master: MASTER });
      const primary = primaryListAction(order);
      const secondary = secondaryListAction(order);
      expect(primary?.kind === 'rate').toBe(canRate(status));
      expect(primary?.kind === 'confirm-master').toBe(isBlockingConfirmation(status));
      if (primary?.kind === 'receipt' || secondary?.kind === 'receipt') expect(hasReceipt(status)).toBe(true);
      if (primary?.kind === 'map') expect(canOpenEnRoute(status)).toBe(true);
      if (isTerminal(status)) expect(secondary).toBeNull();
    }
  });

  it('yorliqlarda ASCII apostrof yoʻq; urgʻu faqat tasdiqlash va baholashda', () => {
    for (const status of ALL) {
      const order = makeOrder({ status, master: MASTER });
      for (const action of [primaryListAction(order), secondaryListAction(order)]) {
        if (action) expect(action.label).toMatch(NO_ASCII_APOSTROPHE);
      }
    }
    expect(isEmphasisedAction('confirm-master')).toBe(true);
    expect(isEmphasisedAction('rate')).toBe(true);
    expect(isEmphasisedAction('track')).toBe(false);
    expect(isEmphasisedAction('cancel')).toBe(false);
  });

  it('ORDER_ROUTES mavjud marshrutlarga mos', () => {
    expect(ORDER_ROUTES.detail('a')).toBe('/app/order/a');
    expect(ORDER_ROUTES.confirmMaster('a')).toBe('/app/order/a/confirm-master');
    expect(ORDER_ROUTES.rate('a')).toBe('/app/order/a/rate');
    expect(ORDER_ROUTES.receipt('a')).toBe('/app/order/a/receipt');
    expect(ORDER_ROUTES.map('a')).toBe('/app/order/a/map');
  });
});

describe('emptyStateFor', () => {
  const none = { all: 0, active: 0, done: 0, cancelled: 0 };

  it('buyurtma umuman yoʻq → har filtrda bitta "hozircha yoʻq" nusxasi', () => {
    for (const filter of HISTORY_FILTERS) {
      expect(emptyStateFor(filter, none)?.title).toBe('Hozircha buyurtmalaringiz yoʻq');
      expect(emptyStateFor(filter, none)?.cta).toBe('services');
    }
  });

  it('"active" boʻsh → ustani chaqirish', () => {
    expect(emptyStateFor('active', { all: 3, active: 0, done: 2, cancelled: 1 })).toEqual({
      title: 'Hozir faol buyurtma yoʻq',
      description: 'Yangi buyurtma bergach, u shu yerda kuzatiladi',
      cta: 'services',
    });
  });

  it('"done" boʻsh: faollar bor → faollarni koʻrish, yoʻq → ustani chaqirish', () => {
    expect(emptyStateFor('done', { all: 2, active: 2, done: 0, cancelled: 0 })?.cta).toBe('show-active');
    expect(emptyStateFor('done', { all: 1, active: 0, done: 0, cancelled: 1 })?.cta).toBe('services');
  });

  it('"cancelled" boʻsh → barchasini koʻrish', () => {
    expect(emptyStateFor('cancelled', { all: 2, active: 1, done: 1, cancelled: 0 })?.cta).toBe('show-all');
  });

  it('toʻplam boʻsh boʻlmasa → null', () => {
    const counts = { all: 3, active: 1, done: 1, cancelled: 1 };
    for (const filter of HISTORY_FILTERS) expect(emptyStateFor(filter, counts)).toBeNull();
  });

  it('matnlar va CTA yorliqlarida ASCII apostrof yoʻq', () => {
    for (const filter of HISTORY_FILTERS) {
      const copy = emptyStateFor(filter, { all: 5, active: 0, done: 0, cancelled: 0 }) ?? emptyStateFor(filter, none);
      expect(copy?.title).toMatch(NO_ASCII_APOSTROPHE);
      expect(copy?.description).toMatch(NO_ASCII_APOSTROPHE);
    }
    for (const label of Object.values(EMPTY_CTA_LABELS)) expect(label).toMatch(NO_ASCII_APOSTROPHE);
  });
});

describe('adjacentHistoryFilter', () => {
  it('chapga surish keyingi filtrga oʻtadi', () => {
    expect(adjacentHistoryFilter('all', 'left')).toBe('active');
    expect(adjacentHistoryFilter('active', 'left')).toBe('done');
    expect(adjacentHistoryFilter('done', 'left')).toBe('cancelled');
  });

  it('oʻngga surish oldingi filtrga qaytadi', () => {
    expect(adjacentHistoryFilter('cancelled', 'right')).toBe('done');
    expect(adjacentHistoryFilter('active', 'right')).toBe('all');
  });

  it('chekkalarda null — aylanib oʻtmaydi', () => {
    expect(adjacentHistoryFilter('all', 'right')).toBeNull();
    expect(adjacentHistoryFilter('cancelled', 'left')).toBeNull();
  });

  it('har bir filtr uchun ketma-ket surish HISTORY_FILTERS tartibini beradi', () => {
    const walked = HISTORY_FILTERS.reduce<HistoryFilter[]>(
      (acc) => {
        const next = adjacentHistoryFilter(acc[acc.length - 1], 'left');
        return next ? [...acc, next] : acc;
      },
      ['all'],
    );
    expect(walked).toEqual(HISTORY_FILTERS);
  });
});
