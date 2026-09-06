import type { OrderStatus } from '@/lib/orderStateMachine';
import type { Master, OrderAddress } from '@/mocks/types';

/** Buyurtma qoralamasi — 08→09→10→11 oqimi davomida to'ldiriladi. */
export interface OrderDraft {
  categoryId: string | null;
  description: string;
  isUrgent: boolean;
  address: OrderAddress | null;
}

export interface LiveOrder {
  id: string;
  shortId: string;
  categoryId: string;
  categoryName: string;
  categoryIconKey: string;
  description: string;
  price: number;
  isUrgent: boolean;
  address: OrderAddress;
  status: OrderStatus;
  master: Master | null;
  etaMinutes: number | null;
  queuePosition: number | null;
  createdAt: Date;
  completedAt: Date | null;
  cancelReason: string | null;
  cancelledBy: 'CLIENT' | 'MASTER' | 'SYSTEM' | null;
  rating: { stars: number; comment: string | null } | null;
}

export const EMPTY_DRAFT: OrderDraft = {
  categoryId: null,
  description: '',
  isUrgent: false,
  address: null,
};
