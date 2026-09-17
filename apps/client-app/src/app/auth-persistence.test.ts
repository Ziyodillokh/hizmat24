import { describe, expect, it } from 'vitest';
import { reviveAuth } from './auth-persistence';

describe('reviveAuth', () => {
  it('toʻliq yozuv tiklanadi', () => {
    expect(
      reviveAuth({ refreshToken: 'abc123', userId: 'u1', phoneNumber: '+998901234567' }),
    ).toEqual({ refreshToken: 'abc123', userId: 'u1', phoneNumber: '+998901234567' });
  });

  it('tokensiz yoki foydalanuvchisiz yozuv rad etiladi', () => {
    expect(reviveAuth({ userId: 'u1' })).toBeNull();
    expect(reviveAuth({ refreshToken: 'abc' })).toBeNull();
    expect(reviveAuth({ refreshToken: '   ', userId: 'u1' })).toBeNull();
  });

  it('obyekt boʻlmagan qiymat rad etiladi', () => {
    expect(reviveAuth(null)).toBeNull();
    expect(reviveAuth('token')).toBeNull();
    expect(reviveAuth(42)).toBeNull();
  });

  it('raqamsiz yozuv ham qabul qilinadi — raqam serverdan qayta keladi', () => {
    expect(reviveAuth({ refreshToken: 'abc', userId: 'u1' })?.phoneNumber).toBe('');
  });
});
