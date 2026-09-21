import { describe, expect, it } from 'vitest';
import { ApiError, apiErrorMessage, resolveBaseUrl, unwrap } from './client';

describe('resolveBaseUrl', () => {
  it('boʻsh qiymat — server sozlanmagan', () => {
    expect(resolveBaseUrl(undefined)).toBeNull();
    expect(resolveBaseUrl('')).toBeNull();
    expect(resolveBaseUrl('   ')).toBeNull();
  });

  it('oxiridagi slash olib tashlanadi', () => {
    expect(resolveBaseUrl('http://localhost:3100/')).toBe('http://localhost:3100');
    expect(resolveBaseUrl('http://localhost:3100///')).toBe('http://localhost:3100');
    expect(resolveBaseUrl(' http://10.0.2.2:3100 ')).toBe('http://10.0.2.2:3100');
  });
});

describe('unwrap', () => {
  it('muvaffaqiyatli javobdan maʼlumot chiqadi', () => {
    expect(unwrap({ success: true, data: { id: 'x' }, error: null }, 200)).toEqual({ id: 'x' });
  });

  it('server xatosi ApiError boʻlib chiqadi', () => {
    expect(() =>
      unwrap({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Kirish yoʻq' } }, 401),
    ).toThrowError(ApiError);

    try {
      unwrap({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Kirish yoʻq' } }, 401);
    } catch (error) {
      const api = error as ApiError;
      expect(api.kind).toBe('server');
      expect(api.code).toBe('UNAUTHORIZED');
      expect(api.status).toBe(401);
    }
  });

  it('texnik matn oʻrniga oʻzbekcha jumla', () => {
    // Server chegarasi `ThrottlerException: Too Many Requests` deb qaytaradi —
    // bu ekranga chiqmasligi kerak.
    try {
      unwrap(
        { success: false, data: null, error: { code: 'TOO_MANY', message: 'ThrottlerException: Too Many Requests' } },
        429,
      );
    } catch (error) {
      const api = error as ApiError;
      expect(api.message).toContain('Juda koʻp urinish');
      expect(api.message).not.toContain('Throttler');
    }
  });

  it('muvaffaqiyatli `data: null` — qiymat, xato emas («hali ariza yoʻq» kabi)', () => {
    expect(unwrap({ success: true, data: null, error: null }, 200)).toBeNull();
  });
});

describe('apiErrorMessage', () => {
  it('har bir tur uchun oʻzbekcha matn', () => {
    expect(apiErrorMessage(new ApiError('not-configured', 'x'))).toBe('Server manzili kiritilmagan');
    expect(apiErrorMessage(new ApiError('offline', 'x'))).toBe('Ulanish yoʻq');
    expect(apiErrorMessage(new ApiError('server', 'Kod notoʻgʻri'))).toBe('Kod notoʻgʻri');
  });

  it('ASCII apostrof yoʻq', () => {
    [
      apiErrorMessage(new ApiError('not-configured', 'x')),
      apiErrorMessage(new ApiError('offline', 'x')),
    ].forEach((text) => expect(text).not.toMatch(/[a-zA-Z]'[a-zA-Z]/));
  });
});
