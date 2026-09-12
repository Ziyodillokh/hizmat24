import { describe, expect, it } from 'vitest';
import { formatPhone } from './formatters';
import {
  isSupportOpen,
  nextOpenAt,
  SUPPORT_PHONE,
  SUPPORT_PHONE_LABEL,
  SUPPORT_TELEGRAM_URL,
  supportStatusLine,
} from './support';

const at = (hour: number, minute = 0) => new Date(2026, 8, 12, hour, minute);

describe('isSupportOpen', () => {
  it.each([
    [7, 59, false],
    [8, 0, true],
    [21, 59, true],
    [22, 0, false],
    [23, 30, false],
    [0, 10, false],
  ])('%i:%i → %s', (hour, minute, expected) => {
    expect(isSupportOpen(at(hour, minute))).toBe(expected);
  });
});

describe('nextOpenAt', () => {
  it('kechqurun — ertangi kun ertalabi', () => {
    expect(nextOpenAt(at(23, 30))).toEqual(new Date(2026, 8, 13, 8, 0, 0, 0));
  });

  it('tunda — shu kunning ertalabi', () => {
    expect(nextOpenAt(at(3))).toEqual(new Date(2026, 8, 12, 8, 0, 0, 0));
  });

  it('kirish sanasini oʻzgartirmaydi', () => {
    const now = at(23, 30);
    const copy = new Date(now.getTime());
    nextOpenAt(now);
    expect(now).toEqual(copy);
  });
});

describe('supportStatusLine', () => {
  it('ochiq holat', () => {
    expect(supportStatusLine(at(9))).toBe('Har kuni 08:00 — 22:00 · hozir ochiq');
  });

  it('yopiq holatda qachon ochilishini aytadi', () => {
    expect(supportStatusLine(at(23))).toBe(
      'Har kuni 08:00 — 22:00 · hozir yopiq, 08:00 da ochiladi',
    );
  });
});

describe('kanal konstantalari', () => {
  it('telefon raqami tel: uchun yaroqli', () => {
    expect(SUPPORT_PHONE).toMatch(/^\+\d+$/);
  });

  it('koʻrsatiladigan raqam formatterdan chiqadi', () => {
    expect(SUPPORT_PHONE_LABEL).toBe(formatPhone(SUPPORT_PHONE));
  });

  it('Telegram havolasi toʻliq manzil', () => {
    expect(SUPPORT_TELEGRAM_URL.startsWith('https://t.me/')).toBe(true);
  });
});
