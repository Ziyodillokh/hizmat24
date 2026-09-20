import { describe, expect, it } from 'vitest';
import { ApiError, apiRequest } from './client';

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

describe('xato matnini tanlash', () => {
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
