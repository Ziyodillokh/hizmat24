import { describe, expect, it } from 'vitest';
import { formatDateTime, formatNumber, formatPrice } from './format';

const NBSP = ' ';

describe('sonni formatlash', () => {
  it.each([
    [0, '0'],
    [7, '7'],
    [999, '999'],
    [1000, `1${NBSP}000`],
    [100000, `100${NBSP}000`],
    [1234567, `1${NBSP}234${NBSP}567`],
  ])('%i → %s', (value, expected) => {
    expect(formatNumber(value)).toBe(expected);
  });

  it('manfiy sonda ishorani saqlaydi', () => {
    expect(formatNumber(-1500)).toBe(`-1${NBSP}500`);
  });

  it('kasrni yaxlitlaydi — tiyin koʻrsatilmaydi', () => {
    expect(formatNumber(1499.6)).toBe(`1${NBSP}500`);
  });

  it('ajratkich oddiy boʻshliq EMAS — narx satr oxirida boʻlinmaydi', () => {
    expect(formatNumber(1000)).not.toContain(' ');
  });

  it('narxga birlik qoʻshadi', () => {
    expect(formatPrice(100000)).toBe(`100${NBSP}000${NBSP}soʻm`);
  });
});

describe('sanani formatlash', () => {
  it('oyni oʻzbekcha yozadi', () => {
    expect(formatDateTime('2026-09-21T14:05:00.000+05:00')).toMatch(/^21 sentabr, \d{2}:\d{2}$/);
  });

  it('buzuq sanada taxmin qilmaydi', () => {
    expect(formatDateTime('umuman-sana-emas')).toBe('—');
  });

  it('boʻsh satrda ham qulamaydi', () => {
    expect(formatDateTime('')).toBe('—');
  });
});
