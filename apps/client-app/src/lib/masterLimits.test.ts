import { describe, expect, it } from 'vitest';
import {
  MASTER_LIMITS,
  MASTER_LIMITS_INTRO,
  SOON_LABEL,
  type MasterLimitId,
} from './masterLimits';

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
  it('oʻnta qator, tartibi TZ jadvalidagidek', () => {
    expect(MASTER_LIMITS.map((limit) => limit.id)).toEqual(EXPECTED_IDS);
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
      MASTER_LIMITS_INTRO,
      SOON_LABEL,
      ...MASTER_LIMITS.map((limit) => limit.title),
      ...MASTER_LIMITS.map((limit) => limit.sentence),
    ];
    for (const item of strings) expect(ASCII_APOSTROPHE.test(item)).toBe(false);
  });
});
