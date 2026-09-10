import type { OrderStatus } from '@/lib/orderStateMachine';
import type { OrderInvoice } from '@/lib/pricing';
import type { Master, OrderAddress } from '@/mocks/types';

/** Buyurtma qoralamasi — tavsif → manzil → vaqt → toʻlov oqimi davomida toʻldiriladi. */
export interface OrderDraft {
  categoryId: string | null;
  description: string;
  /**
   * `scheduledAt !== null` boʻlganda HAR DOIM `false`.
   *
   * Invariantni `store.setDraftSchedule` normallashtiradi — u shu ikki
   * maydonni yozadigan yagona joy, shuning uchun ikkinchi qorovul kerak emas.
   */
  isUrgent: boolean;
  address: OrderAddress | null;
  /** `null` — "imkon qadar tez". Aks holda tanlangan sana va soat. */
  scheduledAt: Date | null;
  /** Toʻlov ekrani yozadi; tanlanmaguncha `null`. */
  paymentMethod: PaymentMethod | null;
}

/**
 * Foydalanuvchi roli. Usta ilovasi alohida oqim boʻladi; hozircha tanlov
 * saqlanadi va mijoz oqimi ochiladi.
 */
export type UserRole = 'client' | 'master';

export interface LiveOrder {
  id: string;
  shortId: string;
  categoryId: string;
  categoryName: string;
  categoryIconKey: string;
  description: string;
  /**
   * MUZLATILGAN hisob-faktura: buyurtma yaratilganda bir marta hisoblanadi
   * va qayta hisoblanmaydi. Aks holda foydalanuvchi Kumush darajaga
   * koʻtarilgan kuni oʻtmishdagi barcha summalar, oylik statistika va
   * yigʻilgan keshbek jimgina oʻzgarib ketardi.
   */
  invoice: OrderInvoice;
  paymentMethod: PaymentMethod;
  /** `null` — buyurtma darhol yuborilgan. */
  scheduledAt: Date | null;
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
  scheduledAt: null,
  paymentMethod: null,
};

/**
 * Chat — ish vaqtidagi shakl.
 *
 * Mockʼda vaqt "necha daqiqa oldin" sifatida saqlanadi (`src/mocks/chats.ts`),
 * bu yerda esa allaqachon ANIQ sana: ekran vaqtni formatlaydi va har renderda
 * qayta hisoblanadigan nisbiy qiymat xabarlarni sekin "surib" yuborardi.
 */
export interface LiveChatMessage {
  id: string;
  from: 'client' | 'master';
  text: string;
  sentAt: Date;
}

export interface LiveChatThread {
  id: string;
  masterId: string;
  orderTitle: string;
  messages: LiveChatMessage[];
  unreadCount: number;
  /**
   * Suhbat ochilgan vaqt. Xabar yozilmagan yangi suhbat roʻyxatning eng
   * tepasida turishi kerak — bu foydalanuvchining eng oxirgi harakati —
   * lekin uning saralanadigan xabari yoʻq.
   */
  startedAt: Date;
}

/** AI yordamchi xabari — suhbatdoshi usta emas, shuning uchun alohida tip. */
export interface AiMessage {
  id: string;
  from: 'client' | 'assistant';
  text: string;
  sentAt: Date;
}

/**
 * Toʻlov usuli.
 *
 * `escrow` — pul ish tugaguncha platformada saqlanadi (ixtiyoriy kafolat),
 * `cash` — ustaga qoʻlma-qoʻl, `card` — bank kartasi orqali.
 */
export type PaymentMethod = 'escrow' | 'cash' | 'card';

/**
 * Toʻlangan pul yozuvi — "Karta" boʻlimining yagona maʼlumot birligi.
 *
 * Faqat HAQIQATDA toʻlangan pul yoziladi: bekor qilingan buyurtma
 * tranzaksiyaga aylanmaydi. Aks holda buyurtma berib darhol bekor qilish
 * orqali daraja va cashback koʻtarilib ketardi.
 */
export interface WalletTransaction {
  id: string;
  /** Haqiqiy buyurtmadan kelgan boʻlsa uning `id` si; mockʼda `null`. */
  orderId: string | null;
  /** "HZ-104312" — chekdagi bilan bir xil raqam. */
  shortId: string;
  categoryName: string;
  /** `serviceIcon()` kaliti — rasm manzili emas. */
  categoryIconKey: string;
  /** Soha boʻyicha taqsimot shu boʻyicha hisoblanadi. */
  groupId: string;
  groupName: string;
  /** Usta topilmagan boʻlsa `null` — UI da EMPTY_VALUE chiziladi. */
  masterName: string | null;
  amount: number;
  method: PaymentMethod;
  /** Pul haqiqatan koʻchgan payt: buyurtma yaratilgan emas, YAKUNLANGAN vaqt. */
  paidAt: Date;
}
