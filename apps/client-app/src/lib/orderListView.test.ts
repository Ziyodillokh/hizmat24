import { describe, expect, it } from 'vitest';
import { HISTORY_FILTERS, type OrderFactSource } from './orderList';
import {
  FILTER_TAB_LABELS,
  filterStepDirection,
  filterTabAriaLabel,
  formatTabCount,
  historyRowFact,
  MAX_TAB_LABEL_CHARS,
  TAB_COUNT_CAP,
} from './orderListView';
import { HISTORY_FILTER_LABELS, ORDER_STATUS } from './orderStateMachine';

/** Nazorat qilinadigan sana — `new Date()` ishlatilmaydi. 2026-09-13. */
const NOW = new Date(2026, 8, 13, 14, 30);
const NO_ASCII_APOSTROPHE = /^[^']*$/;

function makeFactSource(overrides: Partial<OrderFactSource> = {}): OrderFactSource {
  return {
    status: ORDER_STATUS.CLOSED,
    createdAt: new Date(2026, 8, 10, 10, 59),
    scheduledAt: null,
    queuePosition: null,
    etaMinutes: null,
    completedAt: new Date(2026, 8, 10, 12, 59),
    cancelReason: null,
    master: null,
    ...overrides,
  };
}

describe('FILTER_TAB_LABELS', () => {
  it('har bir filtr uchun qisqa yorliq bor va u 360px chegarasiga sigʻadi', () => {
    for (const filter of HISTORY_FILTERS) {
      expect(FILTER_TAB_LABELS[filter].length).toBeGreaterThan(0);
      expect(FILTER_TAB_LABELS[filter].length).toBeLessThanOrEqual(MAX_TAB_LABEL_CHARS);
    }
  });

  it('qisqa yorliq toʻliq nomning boshi — foydalanuvchi ikkisini bir narsa deb taniydi', () => {
    for (const filter of HISTORY_FILTERS) {
      expect(HISTORY_FILTER_LABELS[filter].startsWith(FILTER_TAB_LABELS[filter])).toBe(true);
    }
  });

  it('ASCII apostrof ishlatilmaydi', () => {
    for (const label of Object.values(FILTER_TAB_LABELS)) expect(label).toMatch(NO_ASCII_APOSTROPHE);
  });
});

describe('formatTabCount', () => {
  it('nol va manfiy — nishon yoʻq', () => {
    expect(formatTabCount(0)).toBeNull();
    expect(formatTabCount(-3)).toBeNull();
    expect(formatTabCount(Number.NaN)).toBeNull();
  });

  it('oddiy son matn sifatida', () => {
    expect(formatTabCount(1)).toBe('1');
    expect(formatTabCount(TAB_COUNT_CAP)).toBe('99');
  });

  it('chegaradan oshsa "99+"', () => {
    expect(formatTabCount(100)).toBe('99+');
    expect(formatTabCount(1200)).toBe('99+');
  });
});

describe('filterTabAriaLabel', () => {
  it('toʻliq nom va son', () => {
    expect(filterTabAriaLabel('cancelled', 1)).toBe('Bekor qilingan, 1 ta');
    expect(filterTabAriaLabel('done', 12)).toBe('Yakunlangan, 12 ta');
  });

  it('nol boʻlsa faqat toʻliq nom', () => {
    expect(filterTabAriaLabel('active', 0)).toBe('Faol');
  });
});

describe('filterStepDirection', () => {
  it('oʻngdagi tabga +1, chapdagiga −1, oʻziga 0', () => {
    expect(filterStepDirection('all', 'active')).toBe(1);
    expect(filterStepDirection('all', 'cancelled')).toBe(1);
    expect(filterStepDirection('done', 'active')).toBe(-1);
    expect(filterStepDirection('done', 'done')).toBe(0);
  });
});

describe('historyRowFact', () => {
  it('yakunlangan buyurtmada "Yakunlandi: …" takrorlanmaydi — null', () => {
    expect(historyRowFact(makeFactSource(), NOW)).toBeNull();
  });

  it('bekor sababi qoladi', () => {
    const cancelled = makeFactSource({
      status: ORDER_STATUS.CANCELLED,
      completedAt: null,
      cancelReason: 'Muammo oʻzi hal boʻldi',
    });
    expect(historyRowFact(cancelled, NOW)).toBe('Sabab: Muammo oʻzi hal boʻldi');
  });

  it('sababsiz bekor — null', () => {
    expect(historyRowFact(makeFactSource({ status: ORDER_STATUS.CANCELLED, completedAt: null }), NOW)).toBeNull();
  });

  it('xavfsizlik tekshiruvi belgisi qoladi', () => {
    expect(historyRowFact(makeFactSource({ status: ORDER_STATUS.SAFETY_FLAGGED }), NOW)).toBe(
      'Ustani tasdiqlamadingiz',
    );
  });
});

