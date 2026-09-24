import type { OrderStatus } from '@/lib/orderStateMachine';
import type { OrderInvoice } from '@/lib/pricing';
import type { OrderRating } from '@/lib/rating';
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
  /**
   * Foydalanuvchi sevimli roʻyxatidan tanlagan usta; tanlanmagan boʻlsa `null`.
   *
   * Bu SOʻROV, kafolat emas: haqiqiy tizimda usta band boʻlishi yoki rad
   * etishi mumkin. Hozir backend yoʻq, shuning uchun ilova soʻrovni
   * buyurtmaga yozadi va aynan shu ustani tayinlaydi — ekranlar buni ochiq
   * aytadi.
   */
  preferredMasterId: string | null;
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

/** Ish ustaning ekranida qaysi roʻyxatga tushadi (server aytadi). */
export type MasterBucket = 'offer' | 'active' | 'history';

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
  /**
   * Buyurtma berilganda soʻralgan usta.
   *
   * Qoralamadan buyurtmaga KOʻCHIRILADI: usta `SEARCHING` dan keyin
   * tayinlanadi, qoralama esa bunga qadar tozalanadi.
   */
  preferredMasterId: string | null;
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
  rating: OrderRating | null;
  /**
   * Buyurtma USTANING serverdagi roʻyxatidan kelganmi va u yerda qaysi
   * boʻlimga tushadi.
   *
   * Mijozning oʻz buyurtmalarida bu maydon YOʻQ. Farq shart: ikkala
   * roʻyxat bitta massivda yashaydi va usta ekrani mijozning qidiruvdagi
   * buyurtmasini oʻziga taklif qilib koʻrsatib qoʻyardi.
   */
  masterBucket?: MasterBucket;
  /** Mijozning bogʻlanish maʼlumoti — faqat qabul qilingan ishda. */
  clientContact?: { fullName: string | null; phoneNumber: string } | null;
  /**
   * Buyurtmani shu qurilmadagi usta rejimi yuritadimi.
   *
   * `true` boʻlgach hech qanday `SERVER_STEPS` taymeri rejalashtirilmaydi va
   * mijoz ekranidagi uzuq chegarali «Demo ·» chip chizilmaydi: bitta
   * buyurtmani ikki aktyor surmaydi.
   */
  handledByMaster: boolean;
  /**
   * Usta yakunlashda yozgan izoh. Mijoz uni `/app/order/:id/proof` da koʻradi.
   * Boʻsh izoh `null` — «izoh yoʻq» bitta koʻrinishda.
   */
  workNote: string | null;
}

export const EMPTY_DRAFT: OrderDraft = {
  categoryId: null,
  description: '',
  isUrgent: false,
  address: null,
  preferredMasterId: null,
  scheduledAt: null,
  paymentMethod: null,
};

/** AI yordamchi xabari — javoblar mock; suhbat qurilmaga yozilmaydi. */
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
  /** Katalog kaliti — `ServicePhoto` rasmni shu boʻyicha topadi. */
  categoryId: string;
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

/** Baholash ekrani yuboradigan shakl — `OrderRating` dan farqi: izoh doim satr. */
export interface RatingInput {
  stars: number;
  comment: string;
  tags: readonly string[];
}
