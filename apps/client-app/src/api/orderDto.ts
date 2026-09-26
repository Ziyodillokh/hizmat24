import type { LiveOrder, OrderDraft, PaymentMethod } from '@/app/types';
import type { OrderInvoice } from '@/lib/pricing';
import { ORDER_STATUS, type OrderStatus } from '@/lib/orderStateMachine';
import { isServerMasterId } from '@/lib/orderList';
import type { ExperienceLevel, Master, OrderAddress } from '@/mocks/types';
import { MASTER_PROFESSION } from '@/lib/masterProfile';

/**
 * Server buyurtmasi ↔ ilova buyurtmasi — SOF oʻgirish.
 *
 * Ikki model bir xil emas va bir xil boʻlishi ham shart emas: server
 * `RATED` holatini biladi, ilova esa bilmaydi; server sanani ISO satr
 * qilib beradi, ilova `Date` bilan ishlaydi. Shu farqlar BITTA faylda
 * yashaydi — maydon nomi oʻzgarsa bitta test yiqiladi.
 */
export interface ServerOrder {
  id: string;
  shortId: string;
  status: string;
  description: string;
  quantity?: number;
  isUrgent: boolean;
  invoice: OrderInvoice;
  paymentMethod: PaymentMethod | null;
  scheduledAt: string | null;
  preferredMasterId: string | null;
  queuePosition: number | null;
  etaMinutes: number | null;
  clientAddress: OrderAddress;
  category: { id: string; name: string; iconKey: string | null; basePrice: number } | null;
  master: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    experienceLevel: ExperienceLevel;
    hasGovCertificate: boolean;
    ratingAvg: number;
    completedOrdersCount: number;
    phoneNumber: string | null;
  } | null;
  workNote: string | null;
  handledByMaster: boolean;
  cancelReason: string | null;
  cancelledBy: 'CLIENT' | 'MASTER' | 'SYSTEM' | null;
  rating: { stars: number; comment: string | null; tags?: string[] } | null;
  createdAt: string;
  completedAt: string | null;
}

/**
 * Serverdagi `RATED` — ilovada `CLOSED`.
 *
 * Ilovaning holat mashinasida `RATED` yoʻq: baho berilgan buyurtma yopilgan
 * hisoblanadi (chek, tarix, daromad hammasi `CLOSED` ga tayanadi). Yangi
 * holat qoʻshish oʻrniga chegarada oʻgiramiz — 10 ta holat bitta manbada
 * qoladi.
 */
export function toAppStatus(raw: string): OrderStatus {
  if (raw === 'RATED') return ORDER_STATUS.CLOSED;
  // Notanish holat (server yangilanib, ilova eskirgan) — buyurtmani
  // yoʻqotmaymiz, uni qidiruvda deb koʻrsatamiz va keyingi yangilanishda
  // toʻgʻrilanadi.
  return (Object.values(ORDER_STATUS) as string[]).includes(raw)
    ? (raw as OrderStatus)
    : ORDER_STATUS.SEARCHING;
}

const toDate = (raw: string | null): Date | null => {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Usta yozuvi.
 *
 * Kasb serverda YOʻQ ustun emas — platformada u yagona: santexnik.
 * Ilgari bu yerda tajriba darajasidan «Yangi usta» / «Tajribali usta»
 * degan yorliq yasalardi. Bu TOʻQILGAN maʼlumot edi: ustadan tajriba
 * soʻralmaydi va har kimda «Yangi usta» chiqib turardi.
 */
function toMaster(raw: NonNullable<ServerOrder['master']>): Master {
  return {
    id: raw.id,
    fullName: raw.fullName,
    profession: MASTER_PROFESSION,
    experienceLevel: raw.experienceLevel,
    hasGovCertificate: raw.hasGovCertificate,
    ratingAvg: raw.ratingAvg,
    completedOrdersCount: raw.completedOrdersCount,
    photoUrl: raw.photoUrl ?? undefined,
    phoneNumber: raw.phoneNumber,
  };
}

export function toLiveOrder(raw: ServerOrder): LiveOrder {
  const createdAt = toDate(raw.createdAt) ?? new Date();

  return {
    id: raw.id,
    shortId: raw.shortId,
    categoryId: raw.category?.id ?? '',
    categoryName: raw.category?.name ?? 'Xizmat',
    // Ikona ham, xizmat fotosi ham shu kalit boʻyicha topiladi.
    categoryIconKey: raw.category?.iconKey ?? 'plumber',
    description: raw.description,
    // Eski server bu maydonni yubormaydi — bitta ish deb qaraladi.
    quantity: Math.max(1, raw.quantity ?? 1),
    invoice: raw.invoice,
    // Eski buyurtmalarda usul yozilmagan boʻlishi mumkin — naqd eng xavfsiz
    // taxmin emas, balki HAQIQAT: ilova boshqa usulni hali qabul qilmaydi.
    paymentMethod: raw.paymentMethod ?? 'cash',
    preferredMasterId: raw.preferredMasterId,
    scheduledAt: toDate(raw.scheduledAt),
    isUrgent: raw.isUrgent,
    address: raw.clientAddress,
    status: toAppStatus(raw.status),
    master: raw.master ? toMaster(raw.master) : null,
    etaMinutes: raw.etaMinutes,
    queuePosition: raw.queuePosition,
    createdAt,
    completedAt: toDate(raw.completedAt),
    cancelReason: raw.cancelReason,
    cancelledBy: raw.cancelledBy,
    rating: raw.rating
      ? { stars: raw.rating.stars, comment: raw.rating.comment ?? '', tags: raw.rating.tags ?? [] }
      : null,
    handledByMaster: raw.handledByMaster,
    workNote: raw.workNote,
  };
}

export interface CreateOrderPayload {
  categoryId: string;
  /** Nechta xuddi shu ish. Server chegarani oʻzi ham tekshiradi. */
  quantity: number;
  isUrgent: boolean;
  paymentMethod: PaymentMethod;
  scheduledAt?: string;
  preferredMasterId?: string;
  clientAddress: OrderAddress;
}

/**
 * Qoralamadan server soʻrovi.
 *
 * NARX YUBORILMAYDI: uni server kategoriya narxi va foydalanuvchi darajasi
 * boʻyicha oʻzi hisoblaydi. Ilova hisoblagan summa faqat KOʻRSATISH uchun.
 */
export function toCreatePayload(draft: OrderDraft): CreateOrderPayload | null {
  // Toʻlov usuli tanlanmagan qoralama yuborilmaydi: server uni talab qiladi
  // va «naqd» deb taxmin qilish foydalanuvchi tanlamagan narsani yozardi.
  if (!draft.categoryId || !draft.address || !draft.paymentMethod) return null;

  return {
    categoryId: draft.categoryId,
    // Tavsif YUBORILMAYDI: oqimda uni soʻraydigan qadam yoʻq. Server uni
    // ixtiyoriy qabul qiladi va boʻsh satr yozadi.
    quantity: draft.quantity,
    isUrgent: draft.isUrgent,
    paymentMethod: draft.paymentMethod,
    ...(draft.scheduledAt ? { scheduledAt: draft.scheduledAt.toISOString() } : {}),
    /*
     * Server `@IsUUID('4')` talab qiladi. Ustalar katalogi hali mock va
     * uning identifikatorlari `m-sardor` koʻrinishida: shundayicha
     * yuborilsa server 400 qaytarar va BUTUN buyurtma yaratilmasdi —
     * mijoz ekranda inglizcha texnik matnni koʻrardi. Soʻralgan usta —
     * ixtiyoriy maydon, shuning uchun uni tushirib qoldirish buyurtmani
     * saqlab qoladi.
     */
    ...(isServerMasterId(draft.preferredMasterId)
      ? { preferredMasterId: draft.preferredMasterId as string }
      : {}),
    clientAddress: draft.address,
  };
}
