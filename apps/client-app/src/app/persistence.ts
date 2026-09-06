import { ORDER_STATUS, type OrderStatus } from '@/lib/orderStateMachine';
import type { LiveOrder } from './types';

/**
 * Ilova holatini qurilmada saqlash.
 *
 * Haqiqiy ilova yopilib qayta ochilganda foydalanuvchini kirish ekraniga
 * qaytarmaydi va aktiv buyurtmasini yo'qotmaydi. Backend ulanmagunicha
 * shu vazifani `localStorage` bajaradi.
 */
const STORAGE_KEY = 'hizmat24:session:v1';

/** Saqlanadigan shakl — `Date` JSON'da satrga aylanadi, qayta o'qishda tiklanadi. */
interface StoredOrder extends Omit<LiveOrder, 'createdAt' | 'completedAt'> {
  createdAt: string;
  completedAt: string | null;
}

interface StoredSession {
  isAuthenticated: boolean;
  phoneNumber: string;
  orders: StoredOrder[];
  readNotificationIds: string[];
}

export interface RestoredSession {
  isAuthenticated: boolean;
  phoneNumber: string;
  orders: LiveOrder[];
  readNotificationIds: string[];
}

const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === 'string' && value in ORDER_STATUS;

/**
 * O'qishda ma'lumot ishonchsiz deb qaraladi: saqlangan shakl eski versiyadan
 * qolgan yoki buzilgan bo'lishi mumkin, shuning uchun har bir buyurtma
 * tekshiriladi va yaroqsizlari tashlab yuboriladi.
 */
function reviveOrder(raw: unknown): LiveOrder | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const order = raw as Partial<StoredOrder>;
  if (typeof order.id !== 'string' || !isOrderStatus(order.status)) return null;
  if (typeof order.createdAt !== 'string') return null;

  const createdAt = new Date(order.createdAt);
  if (Number.isNaN(createdAt.getTime())) return null;

  return {
    ...(order as StoredOrder),
    createdAt,
    completedAt: order.completedAt ? new Date(order.completedAt) : null,
  };
}

export function loadSession(): RestoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredSession>;

    return {
      isAuthenticated: parsed.isAuthenticated === true,
      phoneNumber: typeof parsed.phoneNumber === 'string' ? parsed.phoneNumber : '',
      orders: Array.isArray(parsed.orders)
        ? parsed.orders.map(reviveOrder).filter((order): order is LiveOrder => order !== null)
        : [],
      readNotificationIds: Array.isArray(parsed.readNotificationIds)
        ? parsed.readNotificationIds.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    // Buzilgan yozuv ilovani qulatmasin — toza holatdan boshlanadi.
    return null;
  }
}

export function saveSession(session: RestoredSession): void {
  try {
    const payload: StoredSession = {
      isAuthenticated: session.isAuthenticated,
      phoneNumber: session.phoneNumber,
      orders: session.orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        completedAt: order.completedAt ? order.completedAt.toISOString() : null,
      })),
      readNotificationIds: session.readNotificationIds,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Xotira to'lgan yoki yopiq bo'lsa ham ilova ishlashda davom etadi.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // e'tiborsiz
  }
}
