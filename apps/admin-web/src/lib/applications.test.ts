import { describe, expect, it } from 'vitest';
import {
  categorySelectionProblem,
  CATEGORIES_MAX,
  formatDistricts,
  formatWorkHours,
  rejectionReasonProblem,
  REJECTION_REASON_MAX,
  REJECTION_REASON_MIN,
  STATUS_FILTERS,
  STATUS_LABELS,
  toggleId,
} from './applications';

describe('rad etish sababi', () => {
  it('boʻsh sababni rad etadi va nega majburiyligini aytadi', () => {
    expect(rejectionReasonProblem('   ')).toContain('majburiy');
  });

  it(`${REJECTION_REASON_MIN} belgidan qisqa sababni rad etadi`, () => {
    expect(rejectionReasonProblem('qisqa')).toContain('kamida');
  });

  it('chegaradagi uzunlikni qabul qiladi', () => {
    expect(rejectionReasonProblem('a'.repeat(REJECTION_REASON_MIN))).toBeNull();
    expect(rejectionReasonProblem('a'.repeat(REJECTION_REASON_MAX))).toBeNull();
  });

  it('juda uzun sababni rad etadi', () => {
    expect(rejectionReasonProblem('a'.repeat(REJECTION_REASON_MAX + 1))).toContain('uzun');
  });

  it('atrofidagi boʻshliqni hisobga olmaydi', () => {
    expect(rejectionReasonProblem(`  ${'a'.repeat(REJECTION_REASON_MIN)}  `)).toBeNull();
  });
});

describe('xizmat tanlovi', () => {
  it('hech narsa tanlanmasa xato', () => {
    expect(categorySelectionProblem(0)).toContain('Kamida bitta');
  });

  it('bitta tanlov yetarli', () => {
    expect(categorySelectionProblem(1)).toBeNull();
  });

  it('chegaradan oshsa xato', () => {
    expect(categorySelectionProblem(CATEGORIES_MAX + 1)).toContain(String(CATEGORIES_MAX));
  });
});

describe('toggleId', () => {
  it('yoʻq boʻlsa qoʻshadi', () => {
    expect(toggleId(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('bor boʻlsa olib tashlaydi', () => {
    expect(toggleId(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('asl massivni oʻzgartirmaydi', () => {
    const original = ['a'];
    toggleId(original, 'b');
    expect(original).toEqual(['a']);
  });
});

describe('ish vaqti', () => {
  it('kunduzgi smena', () => {
    expect(formatWorkHours(8, 18)).toBe('08:00 – 18:00');
  });

  it('tungi smenani belgilaydi', () => {
    expect(formatWorkHours(22, 6)).toBe('22:00 – 06:00 (tunda)');
  });
});

describe('tumanlar', () => {
  it('boʻsh roʻyxatni ochiq aytadi — «hamma joyda» deb tushunilmasin', () => {
    expect(formatDistricts([])).toBe('Tuman koʻrsatilmagan');
  });

  it('roʻyxatni vergul bilan yozadi', () => {
    expect(formatDistricts(['Chilonzor', 'Yunusobod'])).toBe('Chilonzor, Yunusobod');
  });
});

describe('holat yorliqlari', () => {
  it('har bir holatning yorligʻi bor', () => {
    for (const filter of STATUS_FILTERS) {
      if (filter.key !== 'ALL') expect(STATUS_LABELS[filter.key]).toBe(filter.label);
    }
  });

  it('kutilmoqda birinchi turadi — moderator shundan boshlaydi', () => {
    expect(STATUS_FILTERS[0].key).toBe('PENDING');
  });
});
