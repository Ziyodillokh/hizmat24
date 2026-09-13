import { describe, expect, it } from 'vitest';
import { REVIEW_COMMENT_MAX, reviewDate, SAMPLE_REVIEWS } from './reviews';

/** Oʻzbek tipografiyasi: ASCII apostrof (U+0027) taqiqlanadi. */
const ASCII_APOSTROPHE = /'/;

const NOW = new Date(2026, 8, 13, 12, 0);

describe('reviewDate', () => {
  it('daysAgo kunini ayiradi va `now` ni oʻzgartirmaydi', () => {
    const before = NOW.getTime();
    const date = reviewDate({ ...SAMPLE_REVIEWS[0], daysAgo: 3 }, NOW);
    expect(date.getDate()).toBe(10);
    expect(date.getMonth()).toBe(8);
    expect(NOW.getTime()).toBe(before);
  });

  it('oy chegarasidan oʻtadi', () => {
    const date = reviewDate({ ...SAMPLE_REVIEWS[0], daysAgo: 20 }, NOW);
    expect(date.getMonth()).toBe(7);
    expect(date.getDate()).toBe(24);
  });
});

describe('SAMPLE_REVIEWS', () => {
  it('idlar takrorlanmaydi', () => {
    expect(new Set(SAMPLE_REVIEWS.map((r) => r.id)).size).toBe(SAMPLE_REVIEWS.length);
  });

  it('har bir matn kartaga ikki satrda sigʻadi', () => {
    for (const review of SAMPLE_REVIEWS) {
      expect(review.comment.length).toBeLessThanOrEqual(REVIEW_COMMENT_MAX);
    }
  });

  it('yulduzlar 1–5 oraligʻida, layk manfiy emas', () => {
    for (const review of SAMPLE_REVIEWS) {
      expect(review.stars).toBeGreaterThanOrEqual(1);
      expect(review.stars).toBeLessThanOrEqual(5);
      expect(review.likeCount).toBeGreaterThanOrEqual(0);
    }
  });

  it('ASCII apostrof yoʻq', () => {
    for (const review of SAMPLE_REVIEWS) {
      expect(ASCII_APOSTROPHE.test(review.customerName)).toBe(false);
      expect(ASCII_APOSTROPHE.test(review.comment)).toBe(false);
    }
  });
});
