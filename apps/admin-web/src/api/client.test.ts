import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest, resolveBaseUrl, setUnauthorizedHandler } from './client';

describe('ApiError', () => {
  it('turini va matnini saqlaydi', () => {
    const error = new ApiError('forbidden', 'Ruxsat yoʻq', 403);

    expect(error.kind).toBe('forbidden');
    expect(error.status).toBe(403);
    expect(error.message).toBe('Ruxsat yoʻq');
  });

  it('Error avlodi — `instanceof` ishlaydi', () => {
    expect(new ApiError('offline', 'x')).toBeInstanceOf(Error);
  });
});

describe('asos manzilini aniqlash', () => {
  it.each([
    ['boʻsh satr', '', null],
    ['faqat boʻshliq', '   ', null],
    ['oddiy manzil', 'http://localhost:3100', 'http://localhost:3100'],
    ['oxiridagi slesh', 'http://localhost:3100/', 'http://localhost:3100'],
    ['bir nechta slesh', 'http://localhost:3100///', 'http://localhost:3100'],
    ['atrofida boʻshliq', '  http://localhost:3100  ', 'http://localhost:3100'],
  ])('%s → %s', (_name, raw, expected) => {
    expect(resolveBaseUrl(raw)).toBe(expected);
  });

  it('argumentsiz chaqirilganda muhitdan oʻqiydi', () => {
    vi.stubEnv('VITE_API_URL', 'http://muhitdan.local/');
    expect(resolveBaseUrl()).toBe('http://muhitdan.local');

    vi.stubEnv('VITE_API_URL', '');
    expect(resolveBaseUrl()).toBeNull();

    vi.unstubAllEnvs();
  });
});

describe('xato matnini tanlash', () => {
  // Manzil SHU YERDA beriladi: testlar `.env.local` ga bogʻlanmasligi
  // kerak — u `.gitignore` da va CI da umuman yoʻq.
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'http://test.local');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const respondWith = (status: number, message?: string) => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ success: false, data: null, error: { message } }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch;

    return apiRequest('/test').then(
      () => {
        throw new Error('soʻrov xato qaytarishi kerak edi');
      },
      (error: unknown) => error as ApiError,
    );
  };

  it('bizning oʻzbekcha matnimizni saqlaydi', async () => {
    const error = await respondWith(400, 'Parol kamida 10 belgidan iborat boʻlsin');
    expect(error.message).toBe('Parol kamida 10 belgidan iborat boʻlsin');
  });

  it('429 da server matnini EMAS, oʻzimiznikini koʻrsatadi', async () => {
    const error = await respondWith(429, 'ThrottlerException: Too many requests');
    expect(error.message).toContain('Juda koʻp urinish');
  });

  it('500 da ham ichki matn chiqmaydi', async () => {
    const error = await respondWith(500, 'Internal Server Error: column does not exist');
    expect(error.message).toBe('Serverda xato. Biroz kutib qayta urinib koʻring');
  });

  it('matn umuman boʻlmasa holat kodidan oladi', async () => {
    expect((await respondWith(404)).message).toBe('Soʻralgan maʼlumot topilmadi');
  });

  it('401 ni unauthorized deb belgilaydi — panel chiqarib yuborishi uchun', async () => {
    expect((await respondWith(401, 'Sessiya tugadi')).kind).toBe('unauthorized');
  });

  it('403 ni forbidden deb belgilaydi', async () => {
    expect((await respondWith(403, 'Ruxsat yoʻq')).kind).toBe('forbidden');
  });
});

describe('sozlanmagan server', () => {
  it('manzil boʻlmasa soʻrov YUBORILMAYDI', async () => {
    vi.stubEnv('VITE_API_URL', '');
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const error = await apiRequest('/test').then(
      () => {
        throw new Error('soʻrov xato qaytarishi kerak edi');
      },
      (cause: unknown) => cause as ApiError,
    );

    expect(error.kind).toBe('not-configured');
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});

/*
 * Sessiya ish paytida tugaganda admin CHIQARILISHI kerak. Ilgari 401
 * faqat ilova ochilganda tekshirilardi va admin xato bannerlariga qarab
 * qolar, nima boʻlganini tushunmasdi.
 */
describe('sessiya tugaganini bildirish', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'http://test.local');
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ success: false, data: null, error: {} }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })) as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    setUnauthorizedHandler(null);
  });

  it('token bilan yuborilgan soʻrov 401 qaytarsa ishlov chaqiriladi', async () => {
    // Arrange
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    // Act
    await apiRequest('/test', { token: 'seans-tokeni' }).catch(() => undefined);

    // Assert
    expect(handler).toHaveBeenCalledTimes(1);
  });

  /* Kirish soʻrovi ham 401 qaytaradi — parol notoʻgʻri. U «sessiya tugadi» emas. */
  it('tokensiz soʻrov (kirish) chiqarishga sabab boʻlmaydi', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await apiRequest('/admin/auth/login', { method: 'POST', body: {} }).catch(() => undefined);

    expect(handler).not.toHaveBeenCalled();
  });

  it('ishlov olib tashlansa chaqirilmaydi', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    setUnauthorizedHandler(null);

    await apiRequest('/test', { token: 'seans-tokeni' }).catch(() => undefined);

    expect(handler).not.toHaveBeenCalled();
  });
});
