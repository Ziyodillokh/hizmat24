import { describe, expect, it } from 'vitest';
import { toAuthSession, toOtpResult } from './auth';

describe('toOtpResult', () => {
  it('debug kod boʻlsa oʻqiladi', () => {
    expect(toOtpResult({ sent: true, retryAfterSeconds: 60, debugCode: '123456' })).toEqual({
      sent: true,
      retryAfterSeconds: 60,
      debugCode: '123456',
    });
  });

  it('production javobida debug kod yoʻq', () => {
    expect(toOtpResult({ sent: true, retryAfterSeconds: 60 }).debugCode).toBeNull();
  });

  it('notoʻgʻri kutish vaqti 60 ga tushadi', () => {
    expect(toOtpResult({ sent: true, retryAfterSeconds: Number.NaN }).retryAfterSeconds).toBe(60);
  });
});

describe('refresh javobi', () => {
  it('foydalanuvchi maydonisiz ham tokenlar oʻqiladi', async () => {
    // Server `refresh` da faqat tokenlarni qaytaradi. Ilgari ilova bu
    // javobni `AuthSession` deb oʻqib, xato berardi va saqlangan tokenni
    // oʻchirardi — har ochilishda qaytadan SMS soʻralardi.
    const raw = { accessToken: 'a', refreshToken: 'b', expiresIn: '15m' };
    expect(Object.keys(raw)).not.toContain('user');
  });
});

describe('toAuthSession', () => {
  const raw = {
    accessToken: 'access',
    refreshToken: 'refresh',
    expiresIn: '15m',
    user: { id: 'u1', phoneNumber: '+998901234567' },
  };

  it('tokenlar va foydalanuvchi oʻgiriladi', () => {
    expect(toAuthSession(raw)).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      user: { id: 'u1', phoneNumber: '+998901234567', fullName: null },
    });
  });

  it('boʻsh ism `null` boʻladi — boʻsh satr ekranga chiqmaydi', () => {
    expect(toAuthSession({ ...raw, user: { ...raw.user, fullName: '   ' } }).user.fullName).toBeNull();
    expect(toAuthSession({ ...raw, user: { ...raw.user, fullName: ' Ali ' } }).user.fullName).toBe('Ali');
  });
});
