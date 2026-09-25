/**
 * HTTP qobiq — barcha soʻrovlar shu yerdan oʻtadi.
 *
 * Uch narsani bitta joyda hal qiladi: manzil, token va XATO MATNI.
 * Oxirgisi eng muhimi — server ingliz tilidagi texnik xabar qaytarishi
 * mumkin (`ThrottlerException`, `Internal Server Error`) va u ekranga
 * shundayligicha chiqib ketmasligi kerak.
 */
export type ApiErrorKind = 'not-configured' | 'offline' | 'unauthorized' | 'forbidden' | 'server';

export class ApiError extends Error {
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface Envelope<T> {
  success: boolean;
  data: T | null;
  error: { code?: string; message?: string } | null;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

/** Serverning texnik javoblari uchun oʻzbekcha matn. */
const STATUS_MESSAGES: Record<number, string> = {
  401: 'Sessiya tugadi — qaytadan kiring',
  403: 'Bu boʻlimga ruxsatingiz yoʻq',
  404: 'Soʻralgan maʼlumot topilmadi',
  429: 'Juda koʻp urinish. Bir necha daqiqadan keyin qayta urinib koʻring',
  500: 'Serverda xato. Biroz kutib qayta urinib koʻring',
  502: 'Server javob bermayapti',
  503: 'Server vaqtincha ishlamayapti',
};

const KINDS: Record<number, ApiErrorKind> = { 401: 'unauthorized', 403: 'forbidden' };

/**
 * Sessiya oʻlganda chaqiriladigan ishlov.
 *
 * TanStack Query keshiga emas, SHU YERGA ulanadi: har bir soʻrov shu
 * funksiyadan oʻtadi, shuning uchun bitta joyda ushlash yetarli va
 * yangi ekran qoʻshilganda uni ulashni unutib boʻlmaydi.
 *
 * Ilgari 401 faqat ilova ochilganda tekshirilardi: admin ishlab
 * turganda sessiya tugasa, u chiqarilmasdan xato bannerlariga qarab
 * qolardi va nima boʻlganini tushunmasdi.
 */
type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

/**
 * SOF: `VITE_API_URL` dan tozalangan asos manzil; sozlanmagan boʻlsa `null`.
 *
 * Har soʻrovda qaytadan oʻqiladi, modul yuklanganda BIR MARTA emas.
 * Modul konstantasi boʻlganida testlar `.env.local` ga bogʻlanib qolgandi:
 * u `.gitignore` da, shuning uchun CI da manzil boʻsh chiqib, har bir
 * soʻrov `not-configured` bilan tugardi.
 */
export function resolveBaseUrl(raw: string | undefined = import.meta.env.VITE_API_URL): string | null {
  const value = (raw ?? '').trim();
  return value.length === 0 ? null : value.replace(/\/+$/, '');
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = resolveBaseUrl();
  if (!baseUrl) {
    throw new ApiError('not-configured', 'Server manzili sozlanmagan (VITE_API_URL)');
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('offline', 'Serverga ulanib boʻlmadi — tarmoqni tekshiring');
  }

  if (response.status === 204) return undefined as T;

  const envelope = (await response.json().catch(() => null)) as Envelope<T> | null;

  if (!response.ok || !envelope?.success) {
    /*
     * Faqat TOKEN BILAN yuborilgan soʻrov chiqarishga sabab boʻladi.
     * Kirish soʻrovi ham 401 qaytaradi (parol notoʻgʻri) — u «sessiya
     * tugadi» degani emas va foydalanuvchini chalgʻitardi.
     */
    if (response.status === 401 && options.token) onUnauthorized?.();

    throw new ApiError(
      KINDS[response.status] ?? 'server',
      pickMessage(envelope?.error?.message, response.status),
      response.status,
    );
  }

  return envelope.data as T;
}

/**
 * Qaysi matn koʻrsatiladi — TILNI taxmin qilmasdan hal qilinadi.
 *
 * Bizning endpointlarimiz 400/401/403/404 da oʻzbekcha, aniq matn
 * qaytaradi ("Parol kamida 10 belgidan iborat boʻlsin") — uni almashtirish
 * maʼlumotni yoʻqotish boʻlardi. 429 va 5xx esa Nest va infratuzilmadan
 * keladi va ingliz tilida ("ThrottlerException: Too many requests"); bu
 * matnlar ekranga chiqmasligi kerak.
 *
 * Ilgari bu yerda matn oʻzbekchami-yoʻqmi deb regex tekshirardi — har
 * ikkala tomonga ham xato ishlaydigan taxmin.
 */
const FRAMEWORK_STATUS_THRESHOLD = 500;
const THROTTLED = 429;

function pickMessage(message: string | undefined, status: number): string {
  const fromFramework = status === THROTTLED || status >= FRAMEWORK_STATUS_THRESHOLD;
  if (!fromFramework && message) return message;

  return STATUS_MESSAGES[status] ?? 'Kutilmagan xato';
}
