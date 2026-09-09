import type { OrderStatus } from '@/lib/orderStateMachine';
import type { Master, OrderAddress } from '@/mocks/types';

/** Buyurtma qoralamasi — 08→09→10→11 oqimi davomida toʻldiriladi. */
export interface OrderDraft {
  categoryId: string | null;
  description: string;
  isUrgent: boolean;
  address: OrderAddress | null;
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

/**
 * Chat — ish vaqtidagi shakl.
 *
 * Mockʻda vaqt "necha daqiqa oldin" sifatida saqlanadi (`src/mocks/chats.ts`),
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
