import type { Master, Order, Rating, ServiceCategory, ServiceGroup } from '@prisma/client';
import { CURRENCY, type ApiPaymentMethod, type Currency } from '@shared/index';
import { toClientZone } from '@client/common/utils/datetime.util';
import { MASTER_PHONE_VISIBLE_STATUSES } from '../domain/order-status.enum';
import { toApiPaymentMethod } from '../domain/payment-method';
import type { OrderInvoice } from '../domain/pricing';

export interface MasterView {
  id: string;
  fullName: string;
  photoUrl: string | null;
  experienceLevel: Master['experienceLevel'];
  hasGovCertificate: boolean;
  ratingAvg: number;
  completedOrdersCount: number;
  /** Faqat ASSIGNED…IN_PROGRESS holatlarida toʻldiriladi (6.2), aks holda null. */
  phoneNumber: string | null;
}

export interface OrderCategoryView {
  id: string;
  name: string;
  /** Ilova ikonani va xizmat fotosini shu kalit boʻyicha tanlaydi. */
  iconKey: string | null;
  basePrice: number;
}

export interface OrderRatingView {
  stars: number;
  comment: string | null;
  /**
   * Teglar hozircha saqlanmaydi (`ratings` jadvalida ustun yoʻq), shuning
   * uchun maydon umuman yuborilmaydi — boʻsh massiv "teg tanlanmagan" degan
   * YOLGʻON maʼnoni berardi.
   */
  tags?: string[];
}

export interface OrderView {
  id: string;
  /** Mijoz koʻradigan qisqa raqam, masalan "HZ-104901". */
  shortId: string;
  status: Order['status'];
  description: string;
  /** Nechta xuddi shu ish. Usta nima kutishini bilishi kerak. */
  quantity: number;
  attachmentUrls: string[];
  isUrgent: boolean;
  /** Toʻlanadigan yakuniy summa — `invoice.total` bilan bir xil. */
  price: number;
  /** Biznes-qoida 5.1 — har doim va faqat "UZS". */
  currency: Currency;
  /** Narx tafsiloti — chek va hamyon shundan quriladi. */
  invoice: OrderInvoice;
  /** Eski buyurtmada tanlanmagan boʻlishi mumkin — taxmin yozilmaydi. */
  paymentMethod: ApiPaymentMethod | null;
  /** `null` — buyurtma darhol yuborilgan. */
  scheduledAt: string | null;
  /** Mijoz soʻragan usta — SOʻROV, kafolat emas. */
  preferredMasterId: string | null;
  queuePosition: number | null;
  etaMinutes: number | null;
  clientAddress: unknown;
  category: OrderCategoryView | null;
  /** Biznes-qoida 5.2 — bitta obyekt yoki null. Hech qachon nomzodlar ro'yxati emas. */
  master: MasterView | null;
  /** Ustaning yakunlashdagi izohi; boʻsh izoh `null`. */
  workNote: string | null;
  /** Buyurtmani usta rejimi yuritadimi — ilova taymerini shu bayroq oʻchiradi. */
  handledByMaster: boolean;
  cancelReason: string | null;
  cancelledBy: Order['cancelledBy'];
  rating: OrderRatingView | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export type OrderCategoryWithGroup = ServiceCategory & { group?: ServiceGroup | null };

export type OrderWithRelations = Order & {
  master?: Master | null;
  category?: OrderCategoryWithGroup | null;
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

/**
 * Kategoriyaning oʻz ikonasi boʻlmasa guruhniki ishlatiladi — sxemadagi
 * `icon_key` izohidagi qoidaning aynan oʻzi. Ikkalasi ham boʻsh boʻlsa `null`:
 * ilova oʻz zaxira ikonasini chizadi.
 */
function presentCategory(category: OrderCategoryWithGroup): OrderCategoryView {
  return {
    id: category.id,
    name: category.name,
    iconKey: category.iconKey ?? category.group?.iconKey ?? null,
    basePrice: category.basePrice,
  };
}

/**
 * Narx tafsiloti buyurtma yaratilganda MUZLATILADI va qayta hisoblanmaydi:
 * mijoz Kumush darajaga koʻtarilgan kuni oʻtmishdagi barcha summalar jimgina
 * oʻzgarib ketmasligi kerak.
 */
export function presentInvoice(order: Order): OrderInvoice {
  /*
   * Bir dona narxi ustunda saqlanmaydi — u `priceBase / quantity` dan
   * ANIQ chiqadi, chunki `priceBase` aynan shu koʻpaytma sifatida
   * yozilgan. Ortiqcha ustun ikki manba yaratardi.
   */
  // `Math.max(1, undefined)` NaN beradi va u butun chekni buzardi —
  // shuning uchun qiymat AVVAL son ekani tekshiriladi.
  const quantity =
    Number.isFinite(order.quantity) && order.quantity > 0 ? Math.round(order.quantity) : 1;

  return {
    unitPrice: Math.round(order.priceBase / quantity),
    quantity,
    base: order.priceBase,
    urgentFee: order.priceUrgentFee,
    discountPercent: order.discountPercent,
    discount: order.discountAmount,
    total: order.price,
  };
}

export function presentOrder(order: OrderWithRelations): OrderView {
  return {
    id: order.id,
    shortId: order.shortId,
    status: order.status,
    description: order.description,
    quantity: Math.max(1, order.quantity ?? 1),
    attachmentUrls: order.attachmentUrls,
    isUrgent: order.isUrgent,
    price: order.price,
    currency: CURRENCY,
    invoice: presentInvoice(order),
    paymentMethod: toApiPaymentMethod(order.paymentMethod),
    scheduledAt: toClientZone(order.scheduledAt),
    preferredMasterId: order.preferredMasterId,
    queuePosition: order.queuePosition,
    etaMinutes: order.etaMinutes,
    clientAddress: order.clientAddress,
    category: order.category ? presentCategory(order.category) : null,
    master: order.master ? presentMaster(order.master, order.status) : null,
    workNote: order.workNote,
    handledByMaster: order.handledByMaster,
    cancelReason: order.cancelReason,
    cancelledBy: order.cancelledBy,
    rating: order.rating ? { stars: order.rating.stars, comment: order.rating.comment } : null,
    createdAt: toClientZone(order.createdAt),
    updatedAt: toClientZone(order.updatedAt),
    completedAt: toClientZone(order.completedAt),
  };
}
