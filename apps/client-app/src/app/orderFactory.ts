/**
 * Yangi buyurtma yozuvini yasash va raqamlash.
 *
 * `store.tsx` dan ajratildi: fayl 500 qator chegarasiga tiralgan edi va
 * yozuvni yasash — «kim, qachon» emas, «nima yoziladi» savoli. Sinov
 * buyurtmasi ham AYNAN shu quvurdan oʻtadi: parallel yoʻl bir kun kelib
 * soxta summani hamyonga olib kirardi (TZ 6-boʻlim, 1-qoida).
 */
import { buildInvoice } from '@/lib/pricing';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';
import type { LiveOrder, OrderDraft } from './types';

let orderCounter = 104_900;

/**
 * Hisoblagichni saqlangan buyurtmalardan tiklaydi.
 *
 * Usiz ilova har qayta ochilganda 104_900 dan boshlanardi, tiklangan
 * buyurtmalar esa eski raqamlarini saqlab qolardi — natijada IKKI xil
 * buyurtma bir xil `id` oladi. Keyin `patchOrder` ikkalasini birdan
 * oʻzgartiradi, hamyon esa bitta toʻlovni ikki marta sanaydi.
 */
export function restoreCounter(orders: readonly LiveOrder[]): void {
  for (const order of orders) {
    const digits = Number.parseInt(order.shortId.replace(/\D/g, ''), 10);
    if (Number.isFinite(digits) && digits > orderCounter) orderCounter = digits;
  }
}

/**
 * Qoralamadan buyurtma yozuvi; `null` — qoralama toʻliq emas.
 *
 * Toʻlov usuli ham majburiy: usulsiz buyurtma hamyonda yorliqsiz qator berardi.
 */
export function buildNewOrder(
  draft: OrderDraft,
  discountPercent: number,
  createdAt: Date,
): LiveOrder | null {
  const category = ALL_CATEGORIES.find((item) => item.id === draft.categoryId);
  if (!category || !draft.address || !draft.paymentMethod) return null;

  orderCounter += 1;
  // Rejalashtirilgan buyurtmada navbat maʼnosiz — navbat «hozir» tushunchasi.
  const shouldQueue = !draft.isUrgent && draft.scheduledAt === null && orderCounter % 3 === 0;

  return {
    id: `live-${orderCounter}`,
    shortId: `HZ-${orderCounter}`,
    categoryId: category.id,
    categoryName: category.name,
    categoryIconKey: category.iconKey,
    // Mock rejimida ham tavsif boʻsh: uni soʻraydigan qadam yoʻq.
    description: '',
    quantity: draft.quantity,
    invoice: buildInvoice({
      base: category.basePrice,
      quantity: draft.quantity,
      isUrgent: draft.isUrgent,
      discountPercent,
    }),
    paymentMethod: draft.paymentMethod,
    preferredMasterId: draft.preferredMasterId,
    scheduledAt: draft.scheduledAt,
    isUrgent: draft.isUrgent,
    address: draft.address,
    // Har uchinchi oddiy buyurtma navbatdan boshlanadi — haqiqiy tizimda
    // ustalar band boʻlganda shunday boʻladi. Shoshilinch buyurtma navbatni
    // chetlab oʻtadi (TZ 3.4).
    status: shouldQueue ? ORDER_STATUS.SEARCHING_QUEUED : ORDER_STATUS.SEARCHING,
    master: null,
    etaMinutes: null,
    queuePosition: shouldQueue ? 3 : null,
    createdAt,
    completedAt: null,
    cancelReason: null,
    cancelledBy: null,
    rating: null,
    handledByMaster: false,
    workNote: null,
  };
}

/**
 * Sinov buyurtmasining qoralamasi.
 *
 * Bu SOXTA YOZUV EMAS: tugma bosilganda haqiqiy buyurtma tugʻiladi va u
 * mijoz rejimida ham, hamyonda ham koʻrinadi. Tavsif rost — bu buyurtma
 * aynan usta rejimini tekshirish uchun berilgan.
 */
export const DEMO_DRAFT: OrderDraft = {
  categoryId: 'c-tap',
  quantity: 1,
  isUrgent: false,
  address: { label: 'Demo manzil' },
  preferredMasterId: null,
  scheduledAt: null,
  paymentMethod: 'cash',
};
