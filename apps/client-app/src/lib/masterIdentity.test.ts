import { describe, expect, it } from 'vitest';
import {
  buildSelfMaster,
  EMPTY_MASTER_STATS,
  isSelfMaster,
  masterJobStats,
  masterRatingLabel,
  NO_PROFESSION_LABEL,
  NO_RATING_LABEL,
  SELF_MASTER_ID,
} from './masterIdentity';
import { ORDER_STATUS, type OrderStatus } from './orderStateMachine';
import { MASTERS } from '@/mocks/masters';

const statsOrder = (
  patch: Partial<{ status: OrderStatus; handledByMaster: boolean; stars: number | null }> = {},
) => ({
  status: (patch.status ?? ORDER_STATUS.CLOSED) as OrderStatus,
  handledByMaster: patch.handledByMaster ?? true,
  rating: patch.stars === null || patch.stars === undefined ? null : { stars: patch.stars, comment: '', tags: [] },
});

describe('masterJobStats', () => {
  it('faqat usta yuritgan CLOSED ishlar sanaladi', () => {
    const stats = masterJobStats([
      statsOrder({ stars: 5 }),
      statsOrder({ stars: 4 }),
      statsOrder({ status: ORDER_STATUS.COMPLETED_BY_MASTER, stars: 5 }),
      statsOrder({ status: ORDER_STATUS.CANCELLED }),
      statsOrder({ handledByMaster: false, stars: 5 }),
    ]);
    expect(stats.completedCount).toBe(2);
    expect(stats.ratingAvg).toBe(4.5);
    expect(stats.ratedCount).toBe(2);
  });

  it('baho yoʻq boʻlsa ratingAvg null — 0 emas', () => {
    const stats = masterJobStats([statsOrder({ stars: null })]);
    expect(stats.completedCount).toBe(1);
    expect(stats.ratingAvg).toBeNull();
  });

  it('boʻsh roʻyxatda hamma qiymat nol', () => {
    expect(masterJobStats([])).toEqual(EMPTY_MASTER_STATS);
  });
});

describe('buildSelfMaster', () => {
  const input = {
    fullName: 'Ziyodullo Rahmatov',
    phoneNumber: '+998901234567',
    profession: 'Santexnik',
    experienceLevel: 'EXPERIENCED' as const,
    stats: { completedCount: 3, ratingAvg: 4.8, ratedCount: 3 },
  };

  it('sertifikat DOIM tasdiqlanmagan', () => {
    expect(buildSelfMaster(input).hasGovCertificate).toBe(false);
  });

  it('premium ham, foto ham yoʻq', () => {
    const master = buildSelfMaster(input);
    expect(master.isPremium).toBe(false);
    expect(master.photoUrl).toBeUndefined();
  });

  it('ish soni statistikadan keladi', () => {
    expect(buildSelfMaster(input).completedOrdersCount).toBe(3);
  });

  it('ism yoʻq boʻlsa raqam koʻrsatiladi — toʻqilgan ism emas', () => {
    const master = buildSelfMaster({ ...input, fullName: '   ' });
    expect(master.fullName).toContain('998');
  });

  it('soha tanlanmagan boʻlsa rost yorliq', () => {
    expect(buildSelfMaster({ ...input, profession: null }).profession).toBe(NO_PROFESSION_LABEL);
  });

  it('katalogdagi id bilan kesishmaydi', () => {
    expect(buildSelfMaster(input).id).toBe(SELF_MASTER_ID);
    expect(Object.values(MASTERS).some((master) => master.id === SELF_MASTER_ID)).toBe(false);
  });
});

describe('isSelfMaster', () => {
  it('katalog ustasi oʻzimiz emas', () => {
    expect(isSelfMaster(MASTERS.akmal)).toBe(false);
    expect(isSelfMaster({ id: SELF_MASTER_ID })).toBe(true);
  });
});

describe('masterRatingLabel', () => {
  const self = buildSelfMaster({
    fullName: 'Ziyodullo',
    phoneNumber: '+998901234567',
    profession: 'Santexnik',
    experienceLevel: 'NEW',
    stats: EMPTY_MASTER_STATS,
  });

  it('bahosiz oʻzimizda «0,0» emas, matn', () => {
    expect(masterRatingLabel(self, EMPTY_MASTER_STATS)).toBe(NO_RATING_LABEL);
    expect(masterRatingLabel(self, null)).toBe(NO_RATING_LABEL);
  });

  it('baho bor boʻlsa raqam', () => {
    expect(masterRatingLabel(self, { completedCount: 2, ratingAvg: 4.5, ratedCount: 2 })).toBe('4,5');
  });

  it('katalog ustasida ish soni nol boʻlsa baho koʻrsatilmaydi', () => {
    expect(masterRatingLabel({ id: 'm-x', ratingAvg: 4.9, completedOrdersCount: 0 }, null)).toBe(
      NO_RATING_LABEL,
    );
    expect(masterRatingLabel(MASTERS.akmal, null)).not.toBe(NO_RATING_LABEL);
  });
});

describe('matn qoidalari', () => {
  it('ASCII apostrof yoʻq', () => {
    [NO_RATING_LABEL, NO_PROFESSION_LABEL].forEach((text) =>
      expect(text).not.toMatch(/[a-zA-Z]'[a-zA-Z]/),
    );
  });
});
