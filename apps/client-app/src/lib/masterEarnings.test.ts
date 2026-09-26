import { describe, expect, it } from 'vitest';
import {
  buildMasterEarnings,
  collectedCaption,
  COLLECTED_BANNER,
  COLLECTED_OVERLINE,
  COMMISSION_ROW_HINT,
  HISTORY_SOURCE_CAPTION,
  isEarningOrder,
  MASTER_COMMISSION_PERCENT,
  masterMonthlySeries,
  ratingHint,
  type EarningsOrder,
} from './masterEarnings';
import { ORDER_STATUS, type OrderStatus } from './orderStateMachine';

const NOW = new Date(2026, 8, 16, 12, 0);

const order = (
  patch: Partial<{
    status: OrderStatus;
    handledByMaster: boolean;
    total: number;
    completedAt: Date | null;
    stars: number | null;
  }> = {},
): EarningsOrder => ({
  // Mock oqim: id mock shaklida, boʻlim yoʻq — `handledByMaster` hal qiladi.
  id: 'live-1',
  masterBucket: undefined,
  status: (patch.status ?? ORDER_STATUS.CLOSED) as OrderStatus,
  handledByMaster: patch.handledByMaster ?? true,
  invoice: { unitPrice: 100_000, quantity: 1, base: 100_000, urgentFee: 0, discountPercent: 0, discount: 0, total: patch.total ?? 96_000 },
  completedAt: patch.completedAt === undefined ? NOW : patch.completedAt,
  createdAt: NOW,
  rating: patch.stars === undefined || patch.stars === null ? null : { stars: patch.stars, comment: '', tags: [] },
});

describe('isEarningOrder', () => {
  it('faqat usta olgan va yopilgan ish', () => {
    expect(isEarningOrder(order({ status: ORDER_STATUS.CLOSED, handledByMaster: true }))).toBe(true);
    expect(isEarningOrder(order({ status: ORDER_STATUS.CLOSED, handledByMaster: false }))).toBe(false);
    expect(isEarningOrder(order({ status: ORDER_STATUS.COMPLETED_BY_MASTER, handledByMaster: true }))).toBe(false);
    expect(isEarningOrder(order({ status: ORDER_STATUS.CANCELLED, handledByMaster: true }))).toBe(false);
  });

  /*
   * Serverdan kelgan buyurtmada boʻlim BOʻLISHI shart. Boʻlimsiz server
   * buyurtmasi — mijozning OʻZ buyurtmasi: `handledByMaster` unda ham
   * `true` (ishni haqiqatan usta bajargan). Ilgari mijoz toʻlagan pul
   * ustaning daromadiga qoʻshilardi.
   */
  it('boʻlimsiz SERVER buyurtmasi daromadga qoʻshilmaydi', () => {
    const clientOrder = {
      ...order({ status: ORDER_STATUS.CLOSED, handledByMaster: true }),
      id: '94e0640f-3463-4e19-8b3e-eb17ae021e2b',
      masterBucket: undefined,
    };

    expect(isEarningOrder(clientOrder)).toBe(false);
  });

  it('boʻlimi bor server buyurtmasi qoʻshiladi', () => {
    const masterOrder = {
      ...order({ status: ORDER_STATUS.CLOSED, handledByMaster: true }),
      id: '94e0640f-3463-4e19-8b3e-eb17ae021e2b',
      masterBucket: 'history' as const,
    };

    expect(isEarningOrder(masterOrder)).toBe(true);
  });
});

describe('buildMasterEarnings', () => {
  it('summa muzlatilgan invoice.total dan yigʻiladi', () => {
    const view = buildMasterEarnings([order({ total: 96_000 }), order({ total: 250_000 })], NOW);
    expect(view.totalEarned).toBe(346_000);
    expect(view.completedCount).toBe(2);
  });

  it('mock usta va yakunlanmagan ish sanalmaydi', () => {
    const view = buildMasterEarnings(
      [
        order({ total: 96_000 }),
        order({ handledByMaster: false, total: 500_000 }),
        order({ status: ORDER_STATUS.COMPLETED_BY_MASTER, total: 500_000 }),
        order({ status: ORDER_STATUS.CANCELLED, total: 500_000 }),
      ],
      NOW,
    );
    expect(view.totalEarned).toBe(96_000);
    expect(view.completedCount).toBe(1);
  });

  it('baho yoʻq boʻlsa ratingAvg null — 0 emas', () => {
    const view = buildMasterEarnings([order(), order()], NOW);
    expect(view.ratingAvg).toBeNull();
    expect(view.ratedCount).toBe(0);
  });

  it('baholangan ishlardan oʻrtacha hisoblanadi', () => {
    const view = buildMasterEarnings([order({ stars: 5 }), order({ stars: 4 }), order()], NOW);
    expect(view.ratingAvg).toBe(4.5);
    expect(view.ratedCount).toBe(2);
  });

  it('boʻsh roʻyxatda hamma qiymat nol va NaN yoʻq', () => {
    const view = buildMasterEarnings([], NOW);
    expect(view.totalEarned).toBe(0);
    expect(view.completedCount).toBe(0);
    expect(view.thisMonthEarned).toBe(0);
    expect(view.ratingAvg).toBeNull();
    expect(view.hasTrend).toBe(false);
    view.months.forEach((row) => expect(Number.isNaN(row.percent)).toBe(false));
  });

  it('shu oy alohida sanaladi', () => {
    const view = buildMasterEarnings(
      [order({ total: 96_000 }), order({ total: 100_000, completedAt: new Date(2026, 6, 10) })],
      NOW,
    );
    expect(view.thisMonthEarned).toBe(96_000);
    expect(view.thisMonthCount).toBe(1);
    expect(view.totalEarned).toBe(196_000);
  });

  it('belgilangan `now` bilan natija determinstik', () => {
    const orders = [order({ total: 96_000 })];
    expect(buildMasterEarnings(orders, NOW)).toEqual(buildMasterEarnings(orders, NOW));
  });
});

describe('masterMonthlySeries', () => {
  it('oxirgi olti oy, eskidan yangiga', () => {
    const rows = masterMonthlySeries([], NOW);
    expect(rows).toHaveLength(6);
    expect(rows[5].monthStart.getMonth()).toBe(NOW.getMonth());
    expect(rows[0].monthStart.getTime()).toBeLessThan(rows[5].monthStart.getTime());
  });

  it('ulush eng katta oyga nisbatan', () => {
    const rows = masterMonthlySeries(
      [
        order({ total: 100_000 }),
        order({ total: 50_000, completedAt: new Date(2026, 7, 10) }),
      ],
      NOW,
    );
    const current = rows[5];
    const previous = rows[4];
    expect(current.percent).toBe(100);
    expect(previous.percent).toBe(50);
  });

  it('yil chegarasi normallashadi', () => {
    const january = new Date(2026, 0, 15);
    const rows = masterMonthlySeries([], january);
    expect(rows[0].monthStart.getFullYear()).toBe(2025);
  });
});

describe('matnlar', () => {
  it('komissiya foizi yoʻq', () => {
    expect(MASTER_COMMISSION_PERCENT).toBeNull();
  });

  it('ish yoʻq boʻlsa caption chizilmaydi', () => {
    expect(collectedCaption({ completedCount: 0 })).toBeNull();
    expect(collectedCaption({ completedCount: 3 })).toContain('3 ta');
  });

  it('baho izohi', () => {
    expect(ratingHint({ ratedCount: 0 })).toBe('Hali baho yoʻq');
    expect(ratingHint({ ratedCount: 2 })).toBe('2 ta bahodan');
  });

  it('taqiqlangan soʻzlar yoʻq', () => {
    const texts = [COLLECTED_BANNER, COLLECTED_OVERLINE, HISTORY_SOURCE_CAPTION, COMMISSION_ROW_HINT];
    texts.forEach((text) => {
      const lower = text.toLowerCase();
      ['balans', 'qarz', 'pul yechish', 'hisobim'].forEach((word) =>
        expect(lower).not.toContain(word),
      );
      expect(text).not.toMatch(/[a-zA-Z]'[a-zA-Z]/);
    });
  });
});
