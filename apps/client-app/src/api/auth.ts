import { apiRequest } from './client';

/**
 * Kirish oqimi — server shartnomasi.
 *
 * Kod SMS orqali keladi, lekin ishlab chiqishda server uni javobda ham
 * qaytaradi (`debugCode`). Bu FAQAT `SMS_PROVIDER=console` va
 * `OTP_DEBUG_RETURN_CODE=true` boʻlganda boʻladi — production muhitida
 * server bunday sozlama bilan umuman koʻtarilmaydi.
 */
export interface OtpRequestResult {
  sent: boolean;
  /** Qayta yuborishgacha kutish — taymer aynan shu raqamdan boshlanadi. */
  retryAfterSeconds: number;
  /** Faqat ishlab chiqishda; production serverida hech qachon kelmaydi. */
  debugCode: string | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: { id: string; phoneNumber: string; fullName: string | null };
}

interface RawOtpResponse {
  sent: boolean;
  retryAfterSeconds: number;
  debugCode?: string;
}

interface RawAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
  user: { id: string; phoneNumber: string; fullName?: string | null };
}

/** SOF: server javobini ilova shakliga oʻgiradi. */
export const toOtpResult = (raw: RawOtpResponse): OtpRequestResult => ({
  sent: raw.sent,
  retryAfterSeconds: Number.isFinite(raw.retryAfterSeconds) ? raw.retryAfterSeconds : 60,
  debugCode: typeof raw.debugCode === 'string' ? raw.debugCode : null,
});

/** SOF: sessiya javobini oʻgiradi; ism boʻsh boʻlsa `null`. */
export const toAuthSession = (raw: RawAuthResponse): AuthSession => ({
  accessToken: raw.accessToken,
  refreshToken: raw.refreshToken,
  user: {
    id: raw.user.id,
    phoneNumber: raw.user.phoneNumber,
    fullName: raw.user.fullName?.trim() ? raw.user.fullName.trim() : null,
  },
});

export const requestOtp = async (phoneNumber: string): Promise<OtpRequestResult> =>
  toOtpResult(
    await apiRequest<RawOtpResponse>('/api/v1/auth/request-otp', {
      method: 'POST',
      body: { phoneNumber },
    }),
  );

export const verifyOtp = async (phoneNumber: string, otpCode: string): Promise<AuthSession> =>
  toAuthSession(
    await apiRequest<RawAuthResponse>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: { phoneNumber, otpCode },
    }),
  );

export const refreshSession = async (refreshToken: string): Promise<AuthSession> =>
  toAuthSession(
    await apiRequest<RawAuthResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),
  );

/** Serverdagi refresh tokenni bekor qiladi; xato boʻlsa ham chiqish davom etadi. */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await apiRequest<unknown>('/api/v1/auth/logout', { method: 'POST', body: { refreshToken } });
  } catch {
    // Qurilmadagi token baribir oʻchiriladi — foydalanuvchi chiqishi kerak.
  }
}
