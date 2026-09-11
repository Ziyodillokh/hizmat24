import { describe, expect, it } from 'vitest';
import {
  canSubmitRating,
  isNegativeRating,
  NEGATIVE_TAGS,
  normalizeRating,
  POSITIVE_TAGS,
  RATING_LABELS,
  ratingLabel,
  ratingTagsFor,
  requiresReasonTag,
  shouldResetTags,
  submitHint,
} from './rating';

/** Oʻzbek tipografiyasi: ASCII apostrof (U+0027) taqiqlanadi. */
const ASCII_APOSTROPHE = /'/;

describe('RATING_LABELS', () => {
  it('beshta yorliq va hech biri boʻsh emas', () => {
    expect(RATING_LABELS).toHaveLength(5);
    expect(RATING_LABELS.every((label) => label.length > 0)).toBe(true);
  });

  it('shkala monoton: 2-yulduzda ijobiy yorliq yoʻq', () => {
    expect(ratingLabel(1)).toBe('Juda yomon');
    expect(ratingLabel(2)).toBe('Yomon');
    expect(ratingLabel(3)).toBe('Oʻrtacha');
    expect(ratingLabel(4)).toBe('Yaxshi');
    expect(ratingLabel(5)).toBe('Ajoyib');
  });

  it('diapazondan tashqarida yorliq yoʻq', () => {
    expect(ratingLabel(0)).toBeNull();
    expect(ratingLabel(6)).toBeNull();
    expect(ratingLabel(2.5)).toBeNull();
  });

  it('yorliqlarda ASCII apostrof yoʻq', () => {
    for (const label of RATING_LABELS) expect(ASCII_APOSTROPHE.test(label)).toBe(false);
  });
});

describe('isNegativeRating', () => {
  it.each([
    [0, false],
    [1, true],
    [2, true],
    [3, false],
    [4, false],
    [5, false],
  ])('%i → %s', (stars, expected) => {
    expect(isNegativeRating(stars)).toBe(expected);
  });
});

describe('ratingTagsFor', () => {
  it('yulduz tanlanmaganda teg yoʻq', () => {
    expect(ratingTagsFor(0)).toEqual([]);
  });

  it('past bahoda salbiy, yuqorisida ijobiy teglar', () => {
    expect(ratingTagsFor(1)).toBe(NEGATIVE_TAGS);
    expect(ratingTagsFor(2)).toBe(NEGATIVE_TAGS);
    expect(ratingTagsFor(3)).toBe(POSITIVE_TAGS);
    expect(ratingTagsFor(5)).toBe(POSITIVE_TAGS);
  });

  it('bir toʻplam ichida havola BARQAROR — behuda tozalash boʻlmaydi', () => {
    expect(ratingTagsFor(4)).toBe(ratingTagsFor(5));
    expect(ratingTagsFor(1)).not.toBe(ratingTagsFor(3));
  });

  it('ikkala toʻplamda beshtadan teg, takrorlanmaydi va kesishmaydi', () => {
    expect(POSITIVE_TAGS).toHaveLength(5);
    expect(NEGATIVE_TAGS).toHaveLength(5);
    expect(new Set(POSITIVE_TAGS).size).toBe(5);
    expect(new Set(NEGATIVE_TAGS).size).toBe(5);
    expect(POSITIVE_TAGS.some((tag) => NEGATIVE_TAGS.includes(tag as never))).toBe(false);
  });

  it('teglarda ASCII apostrof yoʻq', () => {
    for (const tag of [...POSITIVE_TAGS, ...NEGATIVE_TAGS]) {
      expect(ASCII_APOSTROPHE.test(tag)).toBe(false);
    }
  });
});

describe('canSubmitRating va submitHint', () => {
  it('past bahoda sabab majburiy', () => {
    expect(requiresReasonTag(1)).toBe(true);
    expect(requiresReasonTag(3)).toBe(false);

    expect(canSubmitRating(1, [])).toBe(false);
    expect(canSubmitRating(2, [])).toBe(false);
    expect(canSubmitRating(1, ['Kech keldi'])).toBe(true);
  });

  it('yuqori bahoda teg shart emas', () => {
    expect(canSubmitRating(3, [])).toBe(true);
    expect(canSubmitRating(5, [])).toBe(true);
  });

  it('yaroqsiz yulduz yuborilmaydi', () => {
    expect(canSubmitRating(0, [])).toBe(false);
    expect(canSubmitRating(0, ['Kech keldi'])).toBe(false);
    expect(canSubmitRating(6, [])).toBe(false);
    expect(canSubmitRating(2.5, ['x'])).toBe(false);
  });

  it('tugma oʻchiq boʻlsa sababi aytiladi', () => {
    expect(submitHint(0, [])).toBe('Yulduz tanlang');
    expect(submitHint(2, [])).toBe('Kamida bitta sabab tanlang');
    expect(submitHint(2, ['Kech keldi'])).toBeNull();
    expect(submitHint(4, [])).toBeNull();
  });

  it('ikki funksiya kelishgan: izoh yoʻq boʻlsa yuborish ochiq', () => {
    for (const stars of [0, 1, 2, 3, 4, 5]) {
      for (const tags of [[], ['Kech keldi']]) {
        if (submitHint(stars, tags) === null) {
          expect(canSubmitRating(stars, tags)).toBe(true);
        }
      }
    }
  });
});

describe('shouldResetTags', () => {
  it('toʻplam almashganda tozalanadi', () => {
    expect(shouldResetTags(5, 2)).toBe(true);
    expect(shouldResetTags(2, 5)).toBe(true);
  });

  it('bir toʻplam ichida tozalanmaydi', () => {
    expect(shouldResetTags(4, 5)).toBe(false);
    expect(shouldResetTags(1, 2)).toBe(false);
  });

  it('birinchi tanlovda tozalash kerak emas', () => {
    expect(shouldResetTags(0, 3)).toBe(false);
  });
});

describe('normalizeRating', () => {
  it('yozuv yoʻq yoki notoʻgʻri turda boʻlsa null', () => {
    expect(normalizeRating(null)).toBeNull();
    expect(normalizeRating(undefined)).toBeNull();
    expect(normalizeRating('x')).toBeNull();
    expect(normalizeRating({ comment: 'x' })).toBeNull();
  });

  it('eski yozuvda teglar boʻlmasa boʻsh massiv beradi', () => {
    expect(normalizeRating({ stars: 5 })).toEqual({ stars: 5, comment: null, tags: [] });
  });

  it('boʻsh izoh null ga aylanadi', () => {
    expect(normalizeRating({ stars: 4, comment: '', tags: ['a'] })).toEqual({
      stars: 4,
      comment: null,
      tags: ['a'],
    });
  });

  it('teglar ichidagi begona qiymatlar filtrlanadi', () => {
    expect(normalizeRating({ stars: 3, tags: ['a', 7, null] })?.tags).toEqual(['a']);
    expect(normalizeRating({ stars: 3, tags: 'a' })?.tags).toEqual([]);
  });

  it('buzilgan yulduz TUZATILMAYDI — butun baho tashlanadi', () => {
    expect(normalizeRating({ stars: 9 })).toBeNull();
    expect(normalizeRating({ stars: 0 })).toBeNull();
    expect(normalizeRating({ stars: 'koʻp' })).toBeNull();
  });
});
