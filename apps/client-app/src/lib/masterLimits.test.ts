import { describe, expect, it } from 'vitest';
import { masterLimits, masterLimitsIntro, SOON_LABEL, type MasterLimitId } from './masterLimits';

/** Serversiz rejim — toʻliq roʻyxat. */
const MASTER_LIMITS = masterLimits(false);

/** Oʻzbek tipografiyasi: ASCII apostrof (U+0027) taqiqlanadi. */
const ASCII_APOSTROPHE = /'/;

/** Roʻyxat 0.5-boʻlimdagi jadval bilan bir xil uzunlikda boʻlishi shart. */
const EXPECTED_IDS: MasterLimitId[] = [
  'chat',
  'map',
  'push',
  'payout',
  'photo',
  'certificate',
  'otherOrders',
  'price',
  'commission',
  'districtFilter',
];

describe('MASTER_LIMITS', () => {
  it('serversiz rejimda oʻnta qator, tartibi TZ jadvalidagidek', () => {
    expect(MASTER_LIMITS.map((limit) => limit.id)).toEqual(EXPECTED_IDS);
  });

  /*
   * B5 da usta navbati serverga ulandi: boshqa mijozlarning buyurtmalari
   * haqiqatan tushadi. Bu qatorni roʻyxatda qoldirish endi yolgʻon
   * boʻlardi — lekin serversiz rejimda u hali ham rost.
   */
  it('server ulanganda hal boʻlgan chegara roʻyxatdan tushadi', () => {
    expect(masterLimits(true).map((limit) => limit.id)).not.toContain('otherOrders');
    expect(masterLimits(false).map((limit) => limit.id)).toContain('otherOrders');
    expect(masterLimits(true)).toHaveLength(MASTER_LIMITS.length - 1);
  });

  it('kirish jumlasi rejimga qarab oʻzgaradi', () => {
    expect(masterLimitsIntro(false)).toContain('serversiz');
    expect(masterLimitsIntro(true)).not.toContain('serversiz');
  });

  it('server ulangan rejimda «server ulanmagan» degan jumla YOʻQ', () => {
    for (const limit of masterLimits(true)) {
      expect(limit.sentence.toLowerCase()).not.toContain('server ulanmagan');
    }
  });

  it('id lar takrorlanmaydi', () => {
    const ids = MASTER_LIMITS.map((limit) => limit.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('har bir qatorda sarlavha va bitta toʻliq jumla bor', () => {
    for (const limit of MASTER_LIMITS) {
      expect(limit.title.length).toBeGreaterThan(0);
      expect(limit.sentence.length).toBeGreaterThan(20);
      expect(limit.sentence.endsWith('.')).toBe(true);
    }
  });

  it('hech bir jumla vaʼda bermaydi — "yuborildi" va "tez kunda ulaymiz" yoʻq', () => {
    for (const limit of MASTER_LIMITS) {
      expect(limit.sentence.toLowerCase()).not.toContain('yuborildi');
      expect(limit.sentence.toLowerCase()).not.toContain('ulaymiz');
    }
  });

  it('ASCII apostrof yoʻq', () => {
    const strings = [
      masterLimitsIntro(true),
      masterLimitsIntro(false),
      SOON_LABEL,
      ...MASTER_LIMITS.map((limit) => limit.title),
      ...MASTER_LIMITS.map((limit) => limit.sentence),
    ];
    for (const item of strings) expect(ASCII_APOSTROPHE.test(item)).toBe(false);
  });
});
