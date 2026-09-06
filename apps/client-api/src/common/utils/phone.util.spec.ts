import { isValidUzPhoneNumber, maskPhoneNumber, normalizePhoneNumber } from './phone.util';

describe('normalizePhoneNumber', () => {
  it.each([
    ['901234567', '+998901234567'],
    ['998901234567', '+998901234567'],
    ['+998 90 123 45 67', '+998901234567'],
    ['(90) 123-45-67', '+998901234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhoneNumber(input)).toBe(expected);
  });

  it("tanib bo'lmaydigan qiymatni o'zgartirmasdan qaytaradi", () => {
    expect(normalizePhoneNumber('abc')).toBe('abc');
  });
});

describe('isValidUzPhoneNumber', () => {
  it("to'g'ri O'zbekiston raqamini qabul qiladi", () => {
    expect(isValidUzPhoneNumber('+998901234567')).toBe(true);
  });

  it.each(['+998001234567', '+7901234567', '901234567', ''])('%s ni rad etadi', (value) => {
    expect(isValidUzPhoneNumber(value)).toBe(false);
  });
});

describe('maskPhoneNumber', () => {
  it("raqamning o'rta qismini yashiradi", () => {
    expect(maskPhoneNumber('+998901234567')).toBe('+99890***4567');
  });

  it("qisqa qiymatni to'liq yashiradi", () => {
    expect(maskPhoneNumber('1234')).toBe('***');
  });
});
