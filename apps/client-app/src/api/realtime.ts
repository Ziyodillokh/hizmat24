import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './client';
import { getAccessToken } from './session';
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

export interface RealtimeHandlers {
  onOrder: (order: LiveOrder) => void;
  onReconnect?: () => void;
}

export function connectRealtime(handlers: RealtimeHandlers): () => void {
  const token = getAccessToken();
  if (!API_BASE_URL || !token) return () => undefined;

  const socket: Socket = io(`${API_BASE_URL}/ws/client`, {
    transports: ['websocket'],
    auth: { token },
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
  });

  socket.on(WS_ORDER_UPDATED, (payload: ServerOrder) => {
    try {
      handlers.onOrder(toLiveOrder(payload));
    } catch {
      // Notanish shakldagi hodisa ekranni buzmasligi kerak: keyingi
      // roʻyxat soʻrovi holatni baribir toʻgʻrilaydi.
    }
  });

  socket.io.on('reconnect', () => handlers.onReconnect?.());

  return () => {
    socket.off(WS_ORDER_UPDATED);
    socket.disconnect();
  };
}
