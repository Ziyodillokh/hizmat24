import { apiRequest } from './client';
import { getAccessToken } from './session';
import { toLiveOrder, type ServerOrder } from './orderDto';
import type { LiveOrder } from '@/app/types';

/**
 * Usta tomoni — serverga (B5).
 *
 * Har amal javobida TOʻLIQ buyurtma qaytadi va ekran oʻsha javobdan
 * yangilanadi: mahalliy taxmin yasab, keyin serverdan boshqa natija
 * kelishi ekranda sakrash boʻlib koʻrinardi.
 */
const authed = <T>(path: string, options: Parameters<typeof apiRequest>[1] = {}) =>
  apiRequest<T>(path, { ...options, token: getAccessToken() });

/** Ish ustaning ekranida qaysi roʻyxatga tushadi — serverdagi nom bilan bir xil. */
export type MasterBucket = 'offer' | 'active' | 'history';

interface ServerMasterOrder extends ServerOrder {
  bucket: MasterBucket;
  /** Faqat qabul qilingan ishda — taklif bosqichida begona raqam berilmaydi. */
  client: { fullName: string | null; phoneNumber: string } | null;
}

export interface MasterShift {
  isOpen: boolean;
  since: string | null;
}

export const fetchMasterShift = (): Promise<MasterShift> => authed('/api/v1/master/shift');

export const setMasterShift = (isOpen: boolean): Promise<MasterShift> =>
  authed('/api/v1/master/shift', { method: 'PUT', body: { isOpen } });

export async function fetchMasterOrders(): Promise<LiveOrder[]> {
  const rows = await authed<ServerMasterOrder[]>('/api/v1/master/orders');
  return rows.map(toMasterOrder);
}

const act = async (orderId: string, action: string, body?: unknown): Promise<LiveOrder> =>
  toMasterOrder(
    await authed<ServerMasterOrder>(`/api/v1/master/orders/${orderId}/${action}`, {
      method: 'POST',
      body: body ?? {},
    }),
  );

export const acceptMasterOrder = (orderId: string): Promise<LiveOrder> => act(orderId, 'accept');

export const declineMasterOrder = (orderId: string, reason?: string): Promise<LiveOrder> =>
  act(orderId, 'decline', reason ? { reason } : {});

export const departMasterOrder = (orderId: string, etaMinutes: number): Promise<LiveOrder> =>
  act(orderId, 'depart', { etaMinutes });

export const arriveMasterOrder = (orderId: string): Promise<LiveOrder> => act(orderId, 'arrive');

export const finishMasterOrder = (orderId: string, workNote: string): Promise<LiveOrder> =>
  act(orderId, 'finish', workNote.trim() ? { workNote: workNote.trim() } : {});

export const cancelMasterOrder = (orderId: string, reason: string): Promise<LiveOrder> =>
  act(orderId, 'cancel', { reason });

/**
 * Serverdagi usta yozuvi → ilova buyurtmasi.
 *
 * `masterBucket` AYNAN shu yerda qoʻyiladi: u buyurtma ustaning
 * roʻyxatidan kelganini bildiradi. Mijozning oʻz buyurtmalarida bu
 * maydon boʻlmaydi va shu farq ikkala roʻyxatni aralashib ketishidan
 * saqlaydi — aks holda mijozning qidiruvdagi buyurtmasi oʻziga taklif
 * boʻlib koʻrinardi.
 */
function toMasterOrder(raw: ServerMasterOrder): LiveOrder {
  return {
    ...toLiveOrder(raw),
    masterBucket: raw.bucket,
    clientContact: raw.client,
  };
}
