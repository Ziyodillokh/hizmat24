import type { Master, Order, Rating, ServiceCategory } from '@prisma/client';
import { CURRENCY, type Currency } from '@shared/index';
import { toClientZone } from '@client/common/utils/datetime.util';
import { MASTER_PHONE_VISIBLE_STATUSES } from '../domain/order-status.enum';

export interface MasterView {
  id: string;
  fullName: string;
  photoUrl: string | null;
  experienceLevel: Master['experienceLevel'];
  hasGovCertificate: boolean;
  ratingAvg: number;
  completedOrdersCount: number;
  /** Faqat ASSIGNED…IN_PROGRESS holatlarida to'ldiriladi (6.2), aks holda null. */
  phoneNumber: string | null;
}

export interface OrderView {
  id: string;
  status: Order['status'];
  description: string;
  attachmentUrls: string[];
  isUrgent: boolean;
  price: number;
  /** Biznes-qoida 5.1 — har doim va faqat "UZS". */
  currency: Currency;
  queuePosition: number | null;
  etaMinutes: number | null;
  clientAddress: unknown;
  category: { id: string; name: string; basePrice: number } | null;
  /** Biznes-qoida 5.2 — bitta obyekt yoki null. Hech qachon nomzodlar ro'yxati emas. */
  master: MasterView | null;
  cancelReason: string | null;
  cancelledBy: Order['cancelledBy'];
  rating: { stars: number; comment: string | null } | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export type OrderWithRelations = Order & {
  master?: Master | null;
  category?: ServiceCategory | null;
  rating?: Rating | null;
};

function presentMaster(master: Master, orderStatus: Order['status']): MasterView {
  return {
    id: master.id,
    fullName: master.fullName,
    photoUrl: master.photoUrl,
    experienceLevel: master.experienceLevel,
    hasGovCertificate: master.hasGovCertificate,
    ratingAvg: Number(master.ratingAvg),
    completedOrdersCount: master.completedOrdersCount,
    phoneNumber: MASTER_PHONE_VISIBLE_STATUSES.includes(orderStatus) ? master.phoneNumber : null,
  };
}

export function presentOrder(order: OrderWithRelations): OrderView {
  return {
    id: order.id,
    status: order.status,
    description: order.description,
    attachmentUrls: order.attachmentUrls,
    isUrgent: order.isUrgent,
    price: order.price,
    currency: CURRENCY,
    queuePosition: order.queuePosition,
    etaMinutes: order.etaMinutes,
    clientAddress: order.clientAddress,
    category: order.category
      ? { id: order.category.id, name: order.category.name, basePrice: order.category.basePrice }
      : null,
    master: order.master ? presentMaster(order.master, order.status) : null,
    cancelReason: order.cancelReason,
    cancelledBy: order.cancelledBy,
    rating: order.rating ? { stars: order.rating.stars, comment: order.rating.comment } : null,
    createdAt: toClientZone(order.createdAt),
    updatedAt: toClientZone(order.updatedAt),
    completedAt: toClientZone(order.completedAt),
  };
}
