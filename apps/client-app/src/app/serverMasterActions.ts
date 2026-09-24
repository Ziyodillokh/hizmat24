import {
  acceptMasterOrder,
  arriveMasterOrder,
  cancelMasterOrder,
  declineMasterOrder,
  departMasterOrder,
  finishMasterOrder,
} from '@/api/master';
import { ApiError, apiErrorMessage } from '@/api/client';
import type { LiveOrder } from './types';

/**
 * Usta amallari — SERVERGA (B5).
 *
 * `localMasterActions.ts` bilan bir xil vazifa, lekin natijani server
 * hal qiladi. Har amal javobida toʻliq buyurtma qaytadi va u darhol
 * roʻyxatga yoziladi — ekran server bilan bir xil holatni koʻrsatadi.
 *
 * Xato YUTILMAYDI: usta nima uchun boʻlmaganini bilishi kerak
 * («Bu buyurtmani boshqa usta oldi», «Avval ishni qabul qiling»).
 * Matnni server beradi — ikki joyda ikki xil jumla boʻlmasligi uchun.
 */
export interface MasterActionResult {
  ok: boolean;
  /** Xato matni; muvaffaqiyatda `null`. */
  message: string | null;
}

export interface ServerMasterActions {
  masterAccept: (orderId: string) => Promise<MasterActionResult>;
  masterDecline: (orderId: string, reason?: string) => Promise<MasterActionResult>;
  masterDepart: (orderId: string, etaMinutes: number) => Promise<MasterActionResult>;
  masterArrive: (orderId: string) => Promise<MasterActionResult>;
  masterFinish: (orderId: string, workNote: string) => Promise<MasterActionResult>;
  masterCancelOrder: (orderId: string, reason: string) => Promise<MasterActionResult>;
}

export interface ServerMasterActionsInput {
  upsertOrder: (order: LiveOrder) => void;
  /**
   * Rad etilgan ish ustaning roʻyxatidan darhol chiqishi kerak: server
   * uni boshqa ustaga yoʻnaltiradi va bu yerda uni ushlab turish
   * yolgʻon boʻlardi.
   */
  removeOrder: (orderId: string) => void;
}

const FALLBACK = 'Amal bajarilmadi — ulanishni tekshiring';

export function buildServerMasterActions(input: ServerMasterActionsInput): ServerMasterActions {
  const run = async (
    task: () => Promise<LiveOrder>,
    onDone: (order: LiveOrder) => void,
  ): Promise<MasterActionResult> => {
    try {
      onDone(await task());
      return { ok: true, message: null };
    } catch (error) {
      return { ok: false, message: error instanceof ApiError ? apiErrorMessage(error) : FALLBACK };
    }
  };

  const keep = (order: LiveOrder) => input.upsertOrder(order);
  const drop = (order: LiveOrder) => input.removeOrder(order.id);

  return {
    masterAccept: (orderId) => run(() => acceptMasterOrder(orderId), keep),
    masterDecline: (orderId, reason) => run(() => declineMasterOrder(orderId, reason), drop),
    masterDepart: (orderId, etaMinutes) => run(() => departMasterOrder(orderId, etaMinutes), keep),
    masterArrive: (orderId) => run(() => arriveMasterOrder(orderId), keep),
    masterFinish: (orderId, workNote) => run(() => finishMasterOrder(orderId, workNote), keep),
    masterCancelOrder: (orderId, reason) => run(() => cancelMasterOrder(orderId, reason), keep),
  };
}
