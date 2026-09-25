import { describe, expect, it } from 'vitest';
import { isRestoreSettled, shouldSignOut, toReadyFlag } from './sessionGuard';

describe('shouldSignOut', () => {
  /*
   * Asosiy xato: token yoʻq boʻlsa ham ilova «kirgan» deb koʻrsatardi va
   * har bir soʻrov 401 qaytarardi.
   */
  it('sessiya yaroqsiz va token yoʻq boʻlsa chiqariladi', () => {
    expect(shouldSignOut('expired', true, false)).toBe(true);
  });

  /*
   * REGRESSIYA: `outcome` ishga tushganda BIR MARTA hisoblanadi va
   * kirish tugagach ham `expired` boʻlib qoladi. Token esa kirish
   * paytida oʻrnatiladi — usiz foydalanuvchi SMS kodini kiritishi bilan
   * darhol chiqarib yuborilardi.
   */
  it('token bor boʻlsa chiqarilmaydi — kirish endi tugagan boʻlishi mumkin', () => {
    expect(shouldSignOut('expired', true, true)).toBe(false);
  });

  /* Bir lahzalik uzilish uchun odamni chiqarib, qaytadan SMS soʻrash — eng yomon javob. */
  it('tarmoq uzilishi chiqarishga sabab boʻlmaydi', () => {
    expect(shouldSignOut('offline', true, false)).toBe(false);
  });

  it('sessiya joyida yoki hali tekshirilayotgan boʻlsa tegilmaydi', () => {
    expect(shouldSignOut('active', true, true)).toBe(false);
    expect(shouldSignOut('pending', true, false)).toBe(false);
  });

  it('allaqachon chiqqan foydalanuvchi qayta chiqarilmaydi', () => {
    expect(shouldSignOut('expired', false, false)).toBe(false);
  });
});

describe('isRestoreSettled', () => {
  it('faqat `pending` da soʻrov yuborilmaydi', () => {
    expect(isRestoreSettled('pending')).toBe(false);
    for (const outcome of ['active', 'expired', 'offline'] as const) {
      expect(isRestoreSettled(outcome)).toBe(true);
    }
  });
});

describe('toReadyFlag', () => {
  it('eski shartnomaga oʻgiradi', () => {
    expect(toReadyFlag('pending')).toBeNull();
    expect(toReadyFlag('active')).toBe(true);
    expect(toReadyFlag('expired')).toBe(false);
    expect(toReadyFlag('offline')).toBe(false);
  });
});
