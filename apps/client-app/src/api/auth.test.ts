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
