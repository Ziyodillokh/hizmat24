import { ORDER_STATUS, type OrderStatus } from '@/lib/orderStateMachine';
import { MASTERS } from './masters';
import type { Master, Order } from './types';

const BASE_DATE = new Date(2026, 8, 5, 14, 30);

const address = {
  label: "Toshkent, Chilonzor 9-kvartal, 42-uy",
  entrance: '2-kirish',
  floor: '5',
  apartment: '17',
};

/** Telefon faqat 4 holatda koʻrinadi (1-boʻlim, 3-qoida) — mock ham shu qoidaga boʻysunadi. */
function withPhoneVisibility(master: Master | null, status: OrderStatus): Master | null {
  if (!master) return null;

  const visible: readonly OrderStatus[] = [
    ORDER_STATUS.ASSIGNED,
    ORDER_STATUS.MASTER_EN_ROUTE,
    ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION,
    ORDER_STATUS.IN_PROGRESS,
  ];

  return visible.includes(status) ? master : { ...master, phoneNumber: null };
}

interface OrderSeed {
  id: string;
  shortId: string;
  status: OrderStatus;
  categoryName: string;
  categoryIconKey: string;
  price: number;
  master: Master | null;
  etaMinutes?: number | null;
  queuePosition?: number | null;
  isEscalated?: boolean;
  isUrgent?: boolean;
  daysAgo?: number;
  cancelReason?: string | null;
  cancelledBy?: Order['cancelledBy'];
  rating?: Order['rating'];
}

const SEEDS: OrderSeed[] = [
  {
    id: 'o-searching', shortId: 'HZ-104857', status: ORDER_STATUS.SEARCHING,
    categoryName: "Kran taʼmirlash", categoryIconKey: 'plumber', price: 100_000, master: null,
  },
  {
    id: 'o-queued', shortId: 'HZ-104858', status: ORDER_STATUS.SEARCHING_QUEUED,
    categoryName: 'Gaz plitasi ulash', categoryIconKey: 'gas', price: 350_000, master: null,
    queuePosition: 3,
  },
  {
    id: 'o-assigned', shortId: 'HZ-104859', status: ORDER_STATUS.ASSIGNED,
    categoryName: "Kran taʼmirlash", categoryIconKey: 'plumber', price: 100_000,
    master: MASTERS.akmal, etaMinutes: 15,
  },
  {
    id: 'o-enroute', shortId: 'HZ-104860', status: ORDER_STATUS.MASTER_EN_ROUTE,
    categoryName: "Rozetka oʻrnatish", categoryIconKey: 'electrician', price: 80_000,
    master: MASTERS.dilshod, etaMinutes: 15,
  },
  {
    id: 'o-arrived', shortId: 'HZ-104861', status: ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION,
    categoryName: "Lyustra oʻrnatish", categoryIconKey: 'electrician', price: 120_000,
    master: MASTERS.dilshod,
  },
  {
    id: 'o-progress', shortId: 'HZ-104862', status: ORDER_STATUS.IN_PROGRESS,
    categoryName: 'Kanalizatsiya tozalash', categoryIconKey: 'plumber', price: 200_000,
    master: MASTERS.akmal, isUrgent: true,
  },
  {
    id: 'o-completed', shortId: 'HZ-104863', status: ORDER_STATUS.COMPLETED_BY_MASTER,
    categoryName: "Unitaz oʻrnatish", categoryIconKey: 'plumber', price: 250_000,
    master: MASTERS.akmal,
  },
  {
    id: 'o-closed', shortId: 'HZ-104790', status: ORDER_STATUS.CLOSED,
    categoryName: "Konditsioner oʻrnatish", categoryIconKey: 'appliance', price: 400_000,
    master: MASTERS.dilshod, daysAgo: 4, rating: { stars: 5, comment: 'Tez va sifatli ishladi' },
  },
  {
    id: 'o-cancelled', shortId: 'HZ-104712', status: ORDER_STATUS.CANCELLED,
    categoryName: 'Avtomat almashtirish', categoryIconKey: 'electrician', price: 150_000,
    master: null, daysAgo: 11, cancelReason: "Muammo oʻzi hal boʻldi", cancelledBy: 'CLIENT',
  },
  {
    id: 'o-flagged', shortId: 'HZ-104655', status: ORDER_STATUS.SAFETY_FLAGGED,
    categoryName: "Mebel yigʻish", categoryIconKey: 'carpenter', price: 180_000,
    master: MASTERS.bekzod, daysAgo: 20,
  },
];

function build(seed: OrderSeed): Order {
  const createdAt = new Date(BASE_DATE);
  createdAt.setDate(BASE_DATE.getDate() - (seed.daysAgo ?? 0));

  return {
    id: seed.id,
    shortId: seed.shortId,
    status: seed.status,
    categoryName: seed.categoryName,
    categoryIconKey: seed.categoryIconKey,
    description: "Oshxonadagi kran oqmoqda, tagida suv toʻplanyapti. Ertalabdan beri davom etyapti.",
    price: seed.price,
    isUrgent: seed.isUrgent ?? false,
    address,
    master: withPhoneVisibility(seed.master, seed.status),
    etaMinutes: seed.etaMinutes ?? null,
    queuePosition: seed.queuePosition ?? null,
    isEscalated: seed.isEscalated ?? false,
    createdAt,
    completedAt: seed.status === 'CLOSED' || seed.status === 'COMPLETED_BY_MASTER' ? createdAt : null,
    cancelReason: seed.cancelReason ?? null,
    cancelledBy: seed.cancelledBy ?? null,
    rating: seed.rating ?? null,
  };
}

export const ORDERS: Order[] = SEEDS.map(build);

export const ORDERS_BY_ID: Record<string, Order> = Object.fromEntries(
  ORDERS.map((order) => [order.id, order]),
);

export const findOrder = (status: OrderStatus): Order =>
  ORDERS.find((order) => order.status === status) ?? ORDERS[0];

/** Tarix uchun — yangi-dan-eski (24-ekran, UI qayta saralamaydi). */
export const ORDER_HISTORY = [...ORDERS].sort(
  (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
);

/** Demo sana — `Date.now()` oʻrniga, maketlar barqaror boʻlishi uchun. */
export const NOW = BASE_DATE;
