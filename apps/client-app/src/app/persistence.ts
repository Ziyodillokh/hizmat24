import { ORDER_STATUS, type OrderStatus } from '@/lib/orderStateMachine';
import { buildInvoice, type OrderInvoice } from '@/lib/pricing';
import type { LiveOrder, PaymentMethod, UserRole } from './types';

/**
 * 3-bosqichdan OLDIN saqlangan buyurtmalarda toʻlov usuli yozilmagan.
 * 2-bosqich ularni "Kafolatli" deb koʻrsatgan edi — tarix qayta yozilmaydi.
 *
 * Yagona isteʼmolchisi shu fayl: `wallet.ts` endi usulni TAXMIN QILMAYDI.
 */
const LEGACY_PAYMENT_METHOD: PaymentMethod = 'escrow';

/**
 * Ilova holatini qurilmada saqlash.
 *
 * Haqiqiy ilova yopilib qayta ochilganda foydalanuvchini kirish ekraniga
 * qaytarmaydi va aktiv buyurtmasini yoʻqotmaydi. Backend ulanmagunicha
 * shu vazifani `localStorage` bajaradi.
 */
const STORAGE_KEY = 'hizmat24:session:v1';

/** Saqlanadigan shakl — `Date` JSONʼda satrga aylanadi, qayta oʻqishda tiklanadi. */
interface StoredOrder extends Omit<LiveOrder, 'createdAt' | 'completedAt' | 'scheduledAt'> {
  createdAt: string;
  completedAt: string | null;
  scheduledAt: string | null;
}

/** 3-bosqichdan oldingi yozuvda hisob-faktura oʻrniga shu maydon turardi. */
interface LegacyOrderFields {
  price?: number;
}

const isPaymentMethod = (value: unknown): value is PaymentMethod =>
  value === 'escrow' || value === 'cash' || value === 'card';

const isInvoice = (value: unknown): value is OrderInvoice => {
  if (typeof value !== 'object' || value === null) return false;
  const invoice = value as Record<string, unknown>;
  return (['base', 'urgentFee', 'discountPercent', 'discount', 'total'] as const).every((key) =>
    Number.isFinite(invoice[key]),
  );
};

interface StoredSession {
  isAuthenticated: boolean;
  phoneNumber: string;
  /** Tanishtiruv oqimi bir marta koʻrsatiladi. */
  hasOnboarded: boolean;
  /** Tanlangan rol; hali tanlanmagan boʻlsa `null`. */
  role: UserRole | null;
  orders: StoredOrder[];
  readNotificationIds: string[];
}

export interface RestoredSession {
  isAuthenticated: boolean;
  phoneNumber: string;
  hasOnboarded: boolean;
  role: UserRole | null;
  orders: LiveOrder[];
  readNotificationIds: string[];
}

const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === 'string' && value in ORDER_STATUS;

/**
 * Oʻqishda maʼlumot ishonchsiz deb qaraladi: saqlangan shakl eski versiyadan
 * qolgan yoki buzilgan boʻlishi mumkin, shuning uchun har bir buyurtma
 * tekshiriladi va yaroqsizlari tashlab yuboriladi.
 */
function reviveOrder(raw: unknown): LiveOrder | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const order = raw as Partial<StoredOrder>;
  if (typeof order.id !== 'string' || !isOrderStatus(order.status)) return null;
  if (typeof order.createdAt !== 'string') return null;

  const createdAt = new Date(order.createdAt);
  if (Number.isNaN(createdAt.getTime())) return null;

  const legacyPrice = (order as LegacyOrderFields).price;

  return {
    ...(order as StoredOrder),
    createdAt,
    completedAt: order.completedAt ? new Date(order.completedAt) : null,
    // `scheduledAt` spread orqali SATR boʻlib oʻtardi, tipi esa `Date` deb
    // turardi — birinchi formatlashda ilova qulardi.
    scheduledAt: order.scheduledAt ? new Date(order.scheduledAt) : null,
    paymentMethod: isPaymentMethod(order.paymentMethod)
      ? order.paymentMethod
      : LEGACY_PAYMENT_METHOD,
    // Eski buyurtmada chegirma HAQIQATAN boʻlmagan, demak yakuniy summa
    // aynan eski `price` ga teng — bu toʻqima emas.
    invoice: isInvoice(order.invoice)
      ? order.invoice
      : buildInvoice({
          base: typeof legacyPrice === 'number' ? legacyPrice : 0,
          isUrgent: false,
          discountPercent: 0,
        }),
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
      hasOnboarded: parsed.hasOnboarded === true,
      // Notoʻgʻri qiymat saqlangan boʻlsa rol tanlanmagan deb qaraladi.
      role: parsed.role === 'client' || parsed.role === 'master' ? parsed.role : null,
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
      hasOnboarded: session.hasOnboarded,
      role: session.role,
      orders: session.orders.map((order) => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        completedAt: order.completedAt ? order.completedAt.toISOString() : null,
        scheduledAt: order.scheduledAt ? order.scheduledAt.toISOString() : null,
      })),
      readNotificationIds: session.readNotificationIds,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Xotira toʻlgan yoki yopiq boʻlsa ham ilova ishlashda davom etadi.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // eʼtiborsiz
  }
}
