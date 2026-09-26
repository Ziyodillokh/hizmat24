import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './client';
import { getAccessToken, refreshAccessToken } from './session';
import { toLiveOrder, type ServerOrder } from './orderDto';
import type { LiveOrder } from '@/app/types';

/**
 * Jonli yangilanish — server holatni oʻzgartirganda ekran oʻzi yangilanadi.
 *
 * Soʻrov takrorlash (polling) YOʻQ: u batareyani yeydi va baribir kechikadi.
 * Server `order.updated` hodisasini faqat OʻSHA mijozning xonasiga yuboradi
 * (`notifications.gateway.ts`), shuning uchun boshqa foydalanuvchining
 * buyurtmasi hech qachon kelmaydi.
 *
 * Ulanish uzilsa `socket.io` oʻzi qayta ulanadi; ulanish tiklanganda ekran
 * eskirgan boʻlishi mumkin, shuning uchun chaqiruvchi roʻyxatni qayta
 * oʻqiydi (`onReconnect`).
 */
export const WS_ORDER_UPDATED = 'order.updated';

/**
 * Ustaning ish roʻyxati oʻzgardi.
 *
 * `order.updated` — MIJOZ koʻrinishi va unda ustaning boʻlimi
 * (taklif/faol/tarix) yoʻq. Shuning uchun ustaga qisqa signal keladi va
 * ilova roʻyxatni qayta oʻqiydi: boʻlimni hisoblash mantigʻi faqat
 * serverda qoladi va ikki joyda ikki xil natija chiqmaydi.
 */
export const WS_MASTER_ORDERS_CHANGED = 'master.orders.changed';

export interface RealtimeHandlers {
  onOrder: (order: LiveOrder) => void;
  /** Ustaning roʻyxatini qayta oʻqish kerak. */
  onMasterOrders?: () => void;
  onReconnect?: () => void;
}

export function connectRealtime(handlers: RealtimeHandlers): () => void {
  if (!API_BASE_URL || !getAccessToken()) return () => undefined;

  const socket: Socket = io(`${API_BASE_URL}/ws/client`, {
    transports: ['websocket'],
    /*
     * `auth` FUNKSIYA sifatida beriladi: socket.io uni HAR BIR
     * ulanishda qaytadan chaqiradi. Ilgari token bir marta olinardi va
     * 15 daqiqadan keyin u eskirar — qayta ulanish oʻsha eski token
     * bilan ketib, jonli yangilanish butunlay toʻxtardi. Ekran esa
     * «ulangan» koʻrinishda qolaverardi.
     */
    auth: (cb: (data: { token: string | null }) => void) => cb({ token: getAccessToken() }),
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
  });

  /*
   * Server ulanishni rad etsa — token eskirgan boʻlishi mumkin. Uni
   * yangilab, socket.io ning oʻz qayta urinishiga yaroqli token bilan
   * kirishiga imkon beramiz.
   */
  socket.on('connect_error', () => {
    void refreshAccessToken();
  });

  socket.on(WS_ORDER_UPDATED, (payload: ServerOrder) => {
    try {
      handlers.onOrder(toLiveOrder(payload));
    } catch {
      // Notanish shakldagi hodisa ekranni buzmasligi kerak: keyingi
      // roʻyxat soʻrovi holatni baribir toʻgʻrilaydi.
    }
  });

  socket.on(WS_MASTER_ORDERS_CHANGED, () => handlers.onMasterOrders?.());

  socket.io.on('reconnect', () => handlers.onReconnect?.());

  return () => {
    socket.off(WS_ORDER_UPDATED);
    socket.off(WS_MASTER_ORDERS_CHANGED);
    socket.disconnect();
  };
}
