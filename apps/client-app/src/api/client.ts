/**
 * Server bilan gaplashadigan YAGONA joy.
 *
 * `src/api` dan tashqarida birorta `fetch` boʻlmaydi: manzil, sarlavhalar,
 * xato modeli va kutish vaqti bitta joyda turadi. Ekranlar hech qachon HTTP
 * haqida bilmaydi — ular provayderlar orqali oʻqiydi.
 *
 * Server javobi doim bitta shaklda: `{ success, data, error }`. Shu qobiqni
 * yechish sof funksiya (`unwrap`) va u test bilan qoplangan.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
}

export type ApiErrorKind =
  /** Manzil sozlanmagan — ilova mock rejimda ishlayapti. */
  | 'not-configured'
  /** Tarmoq yoki kutish vaqti — server javob bermadi. */
  | 'offline'
  /** Server javob berdi, lekin xato bilan. */
  | 'server';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly code: string | null = null,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Foydalanuvchiga koʻrsatiladigan matn — texnik tafsilotsiz. */
export const apiErrorMessage = (error: ApiError): string => {
  switch (error.kind) {
    case 'not-configured':
      return 'Server manzili kiritilmagan';
    case 'offline':
      return 'Ulanish yoʻq';
    case 'server':
      return error.message;
  }
};

/**
 * SOF: qobiqni yechadi. `success: false` — serverning oʻz xatosi, uni
 * tarmoq xatosidan ajratamiz: birinchisida qayta urinish maʼnosiz.
 */
/**
 * Server matnini foydalanuvchi tiliga tarjima qilib boʻlmaydi — u allaqachon
 * oʻzbekcha. Lekin ikkita holat TEXNIK matn beradi va ular ekranga chiqmasligi
 * kerak: soʻrov chegarasi (`ThrottlerException: Too Many Requests`) va
 * kutilmagan server xatosi.
 */
const STATUS_MESSAGES: Record<number, string> = {
  429: 'Juda koʻp urinish. Bir necha daqiqadan keyin qayta urinib koʻring.',
  500: 'Serverda xatolik. Keyinroq qayta urinib koʻring.',
  502: 'Server javob bermayapti. Keyinroq qayta urinib koʻring.',
  503: 'Server javob bermayapti. Keyinroq qayta urinib koʻring.',
};

export function unwrap<T>(envelope: ApiEnvelope<T>, status: number): T {
  // Muvaffaqiyatli javobda `data: null` — haqiqiy qiymat, xato emas:
  // masalan «hali ariza yubormagansiz». Ilgari u xato deb tashlanardi va
  // ekranda «Server xatosi» chiqardi — mavjud boʻlmagan xato haqida.
  // Obyekt kutgan chaqiruvchi maydonga murojaat qilganda baribir yiqiladi;
  // `null` ni qabul qiladigan chaqiruvchi esa uni oʻzi hal qiladi.
  if (envelope.success) return envelope.data as T;

  const error = envelope.error;
  throw new ApiError(
    'server',
    STATUS_MESSAGES[status] ?? error?.message ?? 'Server xatosi',
    error?.code ?? null,
    status,
  );
}

/** SOF: `VITE_API_URL` dan tozalangan asos manzil; sozlanmagan boʻlsa `null`. */
export function resolveBaseUrl(raw: string | undefined): string | null {
  const value = (raw ?? '').trim();
  if (value.length === 0) return null;
  return value.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveBaseUrl(import.meta.env.VITE_API_URL);

/** Server ulanganmi — mock yoʻl shu bayroq boʻyicha tanlanadi. */
export const isApiEnabled = (): boolean => API_BASE_URL !== null;

/** Sekin tarmoqda ham ekran muzlab qolmasin. */
const TIMEOUT_MS = 8000;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  /** Qoʻshimcha sarlavhalar — masalan `Idempotency-Key`. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError('not-configured', 'Server manzili kiritilmagan');
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  options.signal?.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const envelope = (await response.json()) as ApiEnvelope<T>;
    return unwrap(envelope, response.status);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // `AbortError`, tarmoq uzilishi va JSON boʻlmagan javob — hammasi bitta
    // maʼnoni beradi: server bilan gaplasha olmadik.
    throw new ApiError('offline', 'Server javob bermadi');
  } finally {
    window.clearTimeout(timer);
  }
}
