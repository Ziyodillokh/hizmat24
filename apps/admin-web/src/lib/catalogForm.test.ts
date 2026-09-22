import { describe, expect, it } from 'vitest';
import {
  DURATION_MAX,
  EMPTY_FORM,
  fileProblem,
  MAX_MEDIA_PER_CATEGORY,
  parseWholeNumber,
  priceLabel,
  toCategoryInput,
  toFormState,
  validateForm,
  type CategoryFormState,
} from './catalogForm';
import type { AdminCategory } from '@/api/admin';

const valid = (extra: Partial<CategoryFormState> = {}): CategoryFormState => ({
  ...EMPTY_FORM,
  name: 'Kran taʼmirlash',
  basePrice: '120000',
  ...extra,
});

describe('parseWholeNumber', () => {
  it.each([
    ['120000', 120000],
    ['120 000', 120000],
    ['0', 0],
    // `formatPrice` boʻlinmas boʻshliq bilan yozadi — nusxalangan narx
    // maydonga qoʻyilganda ham tushunilishi kerak.
    ['120\u00A0000', 120000],
  ])('%s → %i', (raw, expected) => {
    expect(parseWholeNumber(raw)).toBe(expected);
  });

  it.each(['', '  ', '12.5', '-5', 'abc', '1e5'])('%s → null', (raw) => {
    expect(parseWholeNumber(raw)).toBeNull();
  });
});

describe('validateForm', () => {
  it('toʻgʻri shaklda muammo yoʻq', () => {
    expect(validateForm(valid())).toEqual([]);
  });

  it('muammolarni BIRDANIGA qaytaradi', () => {
    const problems = validateForm({ ...EMPTY_FORM, name: 'a', basePrice: 'xyz' });
    expect(problems.length).toBeGreaterThanOrEqual(2);
  });

  it('kasrli narxni rad etadi — tiyin yoʻq', () => {
    expect(validateForm(valid({ basePrice: '120000.50' }))).toContainEqual(
      expect.stringContaining('butun son'),
    );
  });

  it('davomiylik ixtiyoriy — boʻsh boʻlsa shikoyat yoʻq', () => {
    expect(validateForm(valid({ durationMinutes: '' }))).toEqual([]);
  });

  it('chegaradan tashqari davomiylikni rad etadi', () => {
    expect(validateForm(valid({ durationMinutes: String(DURATION_MAX + 1) }))).toContainEqual(
      expect.stringContaining('daqiqa'),
    );
  });
});

describe('toCategoryInput', () => {
  it('boʻsh ixtiyoriy maydonlarni YUBORMAYDI', () => {
    const input = toCategoryInput(valid());

    expect(input).not.toHaveProperty('summary');
    expect(input).not.toHaveProperty('details');
    expect(input).not.toHaveProperty('durationMinutes');
    expect(input).not.toHaveProperty('groupId');
  });

  it('roʻyxatlardagi boʻsh qatorlarni tashlab yuboradi', () => {
    const input = toCategoryInput(valid({ includes: ['Ishchi kuchi', '  ', 'Prokladka'] }));
    expect(input?.includes).toEqual(['Ishchi kuchi', 'Prokladka']);
  });

  it('boʻshliqli narxni sonaga aylantiradi', () => {
    expect(toCategoryInput(valid({ basePrice: '120 000' }))?.basePrice).toBe(120000);
  });

  it('yaroqsiz shaklda null', () => {
    expect(toCategoryInput({ ...EMPTY_FORM, name: 'x', basePrice: '' })).toBeNull();
  });
});

describe('toFormState', () => {
  it('serverdan kelgan kartani shaklga aylantiradi va nusxa oladi', () => {
    const category = {
      name: 'Kran',
      summary: null,
      details: null,
      includes: ['a'],
      excludes: [],
      basePrice: 90000,
      priceKind: 'FROM',
      durationMinutes: null,
      groupId: null,
    } as unknown as AdminCategory;

    const form = toFormState(category);

    expect(form).toMatchObject({ name: 'Kran', summary: '', basePrice: '90000', priceKind: 'FROM' });
    form.includes.push('b');
    expect(category.includes).toEqual(['a']);
  });
});

describe('fileProblem', () => {
  it('yaroqli rasmda null', () => {
    expect(fileProblem({ type: 'image/png', size: 1000 }, 0)).toBeNull();
  });

  it('katta rasmni rad etadi', () => {
    expect(fileProblem({ type: 'image/png', size: 6 * 1024 * 1024 }, 0)).toContain('5 MB');
  });

  it('katta videoni rad etadi', () => {
    expect(fileProblem({ type: 'video/mp4', size: 61 * 1024 * 1024 }, 0)).toContain('60 MB');
  });

  it('notanish turni rad etadi', () => {
    expect(fileProblem({ type: 'image/gif', size: 10 }, 0)).toContain('JPEG');
  });

  it('chegaraga yetganda yangi fayl qabul qilinmaydi', () => {
    expect(fileProblem({ type: 'image/png', size: 10 }, MAX_MEDIA_PER_CATEGORY)).toContain(
      String(MAX_MEDIA_PER_CATEGORY),
    );
  });
});

describe('priceLabel', () => {
  it('aniq narx oʻzgarmaydi', () => {
    expect(priceLabel('120 000 soʻm', 'FIXED')).toBe('120 000 soʻm');
  });

  it('«shundan boshlab» qoʻshimcha bilan', () => {
    expect(priceLabel('120 000 soʻm', 'FROM')).toBe('120 000 soʻmdan');
  });
});
