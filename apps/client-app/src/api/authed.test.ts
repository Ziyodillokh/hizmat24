import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authed } from './authed';
import { getAccessToken, setAccessToken, setSessionRefresher } from './session';

const ok = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data, error: null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const unauthorized = () =>
  new Response(JSON.stringify({ success: false, data: null, error: { code: 'x', message: 'x' } }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });

/*
 * Test muhiti `node`, `apiRequest` esa kutish vaqti uchun
 * `window.setTimeout` ni chaqiradi. Ishlab chiqarish kodini test uchun
 * oʻzgartirmaymiz — shu yerda eng kichik qoʻshimcha beriladi.
 */
const withWindow = () => {
  if (!('window' in globalThis)) {
    (globalThis as { window?: unknown }).window = {
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    };
  }
};

describe('authed', () => {
  beforeEach(() => {
    withWindow();
    vi.stubEnv('VITE_API_URL', 'http://test.local');
    setAccessToken('eski-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    setSessionRefresher(null);
    setAccessToken(null);
  });

  it('tokenni soʻrovga qoʻshadi', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(ok({ id: 'o-1' }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    await authed('/api/v1/orders');

    const headers = fetchSpy.mock.calls[0][1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer eski-token');
  });

  /*
   * `access` tokenning umri 15 daqiqa. Usiz ilova ochiq turib 15 daqiqa
   * kutgan foydalanuvchi «usta chaqirish» tugmasini bosganda sababsiz
   * «unauthorized» xatosini koʻrardi.
   */
  it('401 da token yangilanadi va soʻrov QAYTA yuboriladi', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(unauthorized())
      .mockResolvedValueOnce(ok({ id: 'o-1' }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    setSessionRefresher(async () => {
      setAccessToken('yangi-token');
      return true;
    });

    const result = await authed<{ id: string }>('/api/v1/orders');

    expect(result).toEqual({ id: 'o-1' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const retryHeaders = fetchSpy.mock.calls[1][1].headers as Record<string, string>;
    expect(retryHeaders.Authorization).toBe('Bearer yangi-token');
  });

  it('yangilash muvaffaqiyatsiz boʻlsa xato yuqoriga chiqadi', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(unauthorized());
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    setSessionRefresher(async () => false);

    await expect(authed('/api/v1/orders')).rejects.toThrow();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  /* Cheksiz qaytarish faqat kechikish qoʻshardi — yangilash BIR martalik. */
  it('ikkinchi 401 da qayta urinilmaydi', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(unauthorized());
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    setSessionRefresher(async () => {
      setAccessToken('yangi-token');
      return true;
    });

    await expect(authed('/api/v1/orders')).rejects.toThrow();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('401 boʻlmagan xatoda yangilanmaydi', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, data: null, error: { code: 'x', message: 'x' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const refresher = vi.fn(async () => true);
    setSessionRefresher(refresher);

    await expect(authed('/api/v1/orders')).rejects.toThrow();
    expect(refresher).not.toHaveBeenCalled();
  });
});

/*
 * Roʻyxat parallel oʻqiladi (useServerSync). Access token 15 daqiqada
 * eskirgach ikkala soʻrov ham BIRGA 401 oladi. Yangilash birlashtirilmasa,
 * ikkalasi ham AYNI refresh tokenni yuborardi: server birinchisini qabul
 * qilib tokenni almashtiradi, ikkinchisini «qayta ishlatilgan» deb rad
 * etadi — va ilova saqlangan tokenni oʻchirib, foydalanuvchini chiqarib
 * yuborardi.
 */
describe('authed — parallel 401', () => {
  beforeEach(() => {
    withWindow();
    vi.stubEnv('VITE_API_URL', 'http://test.local');
    setAccessToken('eski-token');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    setSessionRefresher(null);
    setAccessToken(null);
  });

  it('bir vaqtdagi ikki 401 uchun yangilash BIR MARTA chaqiriladi', async () => {
    const fetchSpy = vi.fn(async () => (getAccessToken() === 'yangi' ? ok({ id: 'o-1' }) : unauthorized()));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const refresher = vi.fn(async () => {
      // Haqiqiy yangilash kabi — darhol emas, keyingi tikda tugaydi.
      await Promise.resolve();
      setAccessToken('yangi');
      return true;
    });
    setSessionRefresher(refresher);

    const [a, b] = await Promise.all([
      authed<{ id: string }>('/api/v1/orders'),
      authed<{ id: string }>('/api/v1/master/orders'),
    ]);

    expect(a).toEqual({ id: 'o-1' });
    expect(b).toEqual({ id: 'o-1' });
    expect(refresher).toHaveBeenCalledTimes(1);
  });
});
