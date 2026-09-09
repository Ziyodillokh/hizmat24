import { masterById } from './masters';
import type { Master } from './types';

/**
 * Chat mock maʼlumoti.
 *
 * Xabar vaqti MUTLAQ sana emas, "necha daqiqa oldin" sifatida saqlanadi va
 * roʻyxat ochilganda joriy vaqtdan hisoblanadi. Qatʼiy sana yozilsa, mock
 * bir kundan keyin "kecha", bir oydan keyin "5-avgust" boʻlib koʻrinardi va
 * suhbat oʻlik maʼlumotdek taassurot berardi.
 */
export type ChatAuthor = 'client' | 'master';

export interface ChatMessage {
  id: string;
  from: ChatAuthor;
  text: string;
  /** Necha daqiqa oldin yuborilgan. */
  minutesAgo: number;
}

export interface ChatThread {
  id: string;
  masterId: string;
  /** Suhbat qaysi buyurtma yuzasidan — sarlavhada koʻrsatiladi. */
  orderTitle: string;
  messages: ChatMessage[];
  /** Mijoz oʻqimagan xabarlar soni. */
  unreadCount: number;
}

export const CHAT_THREADS: ChatThread[] = [
  {
    id: 't-akmal',
    masterId: 'm-akmal',
    orderTitle: 'Rozetka oʻrnatish',
    unreadCount: 2,
    messages: [
      {
        id: 'm1',
        from: 'client',
        text: 'Assalomu alaykum! Buyurtmani qabul qildingizmi?',
        minutesAgo: 52,
      },
      {
        id: 'm2',
        from: 'master',
        text: 'Vaalaykum assalom. Ha, qabul qildim. 14:00 da boʻlaman.',
        minutesAgo: 48,
      },
      {
        id: 'm3',
        from: 'client',
        text: 'Yaxshi. Rozetka yotoqxonada, devor ichida. Uchqun chiqyapti.',
        minutesAgo: 40,
      },
      {
        id: 'm4',
        from: 'master',
        text: 'Tushundim. Kelib koʻraman — ehtimol kontakt kuygan.',
        minutesAgo: 12,
      },
      {
        id: 'm5',
        from: 'master',
        text: 'Yoʻlga chiqdim, 15 daqiqada yetib boraman.',
        minutesAgo: 4,
      },
    ],
  },
  {
    id: 't-sardor',
    masterId: 'm-sardor',
    orderTitle: 'Gaz plitasi ulash',
    unreadCount: 0,
    messages: [
      {
        id: 'm1',
        from: 'master',
        text: 'Salom! Plita qaysi rusumda? Shlang uzunligini bilishim kerak.',
        minutesAgo: 1500,
      },
      {
        id: 'm2',
        from: 'client',
        text: 'Toʻrt konforkali, oshxona burchagida turadi.',
        minutesAgo: 1480,
      },
      {
        id: 'm3',
        from: 'master',
        text: 'Aniq. Ertaga soat 10 da kelaman, shlang oʻzimda bor.',
        minutesAgo: 1460,
      },
    ],
  },
  {
    id: 't-feruza',
    masterId: 'm-feruza',
    orderTitle: 'Kvartira tozalash',
    unreadCount: 0,
    messages: [
      {
        id: 'm1',
        from: 'client',
        text: 'Ish uchun rahmat, juda ozoda boʻldi.',
        minutesAgo: 4300,
      },
      {
        id: 'm2',
        from: 'master',
        text: 'Rahmat! Yana kerak boʻlsa yozing.',
        minutesAgo: 4280,
      },
    ],
  },
];

/** Suhbat egasini topadi. Usta oʻchirilgan boʻlsa suhbat koʻrsatilmaydi. */
export const threadMaster = (thread: ChatThread): Master | undefined =>
  masterById(thread.masterId);

/** Oxirgi xabar — roʻyxatda koʻrsatiladi. */
export const lastMessage = (thread: ChatThread): ChatMessage =>
  thread.messages[thread.messages.length - 1];

/** Roʻyxat eng yangi suhbat tepada boʻladigan tartibda. */
export const CHAT_LIST: ChatThread[] = [...CHAT_THREADS].sort(
  (a, b) => lastMessage(a).minutesAgo - lastMessage(b).minutesAgo,
);
