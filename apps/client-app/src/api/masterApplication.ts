import { apiRequest } from './client';
import { getAccessToken } from './session';

/**
 * Usta arizasi — serverga.
 *
 * Telefon raqami yuborilmaydi: server uni tokendan oladi. Aks holda
 * ilova begona raqamga ariza yozib qoʻyishi mumkin edi.
 *
 * Kasb, tajriba, sertifikat, tuman va ish vaqti YUBORILMAYDI: server ham
 * ularni ixtiyoriy qilgan (`submit-application.dto.ts`). Ariza ikkita
 * javobdan iborat — kim va nima qila oladi.
 */
export interface SubmitApplicationPayload {
  fullName: string;
  requestedCategoryIds: string[];
  /** Ixtiyoriy tanishtiruv; boʻsh boʻlsa umuman yuborilmaydi. */
  about?: string;
}

export type RemoteApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RemoteApplication {
  id: string;
  status: RemoteApplicationStatus;
  /** Rad etilganda moderator yozgan matn — ekranda soʻzma-soʻz koʻrinadi. */
  rejectionReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

const authed = <T>(path: string, options: Parameters<typeof apiRequest>[1] = {}) =>
  apiRequest<T>(path, { ...options, token: getAccessToken() });

export const submitApplication = (payload: SubmitApplicationPayload): Promise<RemoteApplication> =>
  authed('/api/v1/master/applications', { method: 'POST', body: payload });

/** `null` — foydalanuvchi hali ariza yubormagan (bu xato emas, holat). */
export const fetchMyApplication = (): Promise<RemoteApplication | null> =>
  authed('/api/v1/master/applications/me');
