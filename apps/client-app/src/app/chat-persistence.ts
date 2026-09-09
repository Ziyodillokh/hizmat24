import type { LiveChatMessage, LiveChatThread } from './types';

/**
 * Suhbatlarni qurilmada saqlash.
 *
 * Sessiyadan (`persistence.ts`) ALOHIDA kalit: chat mock maʼlumot ustiga
 * quriladi va backend ulanganda butunlay yoʻqoladi — sessiya sxemasini
 * shu vaqtinchalik maʼlumot bilan ifloslantirmaslik kerak.
 *
 * Nega umuman saqlanadi: usiz foydalanuvchi xabar yozib, ilovani yopib
 * qayta ochsa, xabari yoʻqolardi. Demoʻda bu "ilova buzuq" degan taassurot
 * beradi.
 */
const STORAGE_KEY = 'hizmat24:chat:v1';

interface StoredMessage {
  id: string;
  from: 'client' | 'master';
  text: string;
  sentAt: string;
}

interface StoredThread {
  id: string;
  masterId: string;
  orderTitle: string;
  unreadCount: number;
  startedAt: string;
  messages: StoredMessage[];
}

/** Sana satri ishonchsiz: eski yoki buzilgan yozuv `Invalid Date` berishi mumkin. */
function reviveDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function reviveMessage(raw: unknown): LiveChatMessage | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const message = raw as Partial<StoredMessage>;
  const sentAt = reviveDate(message.sentAt);

  if (typeof message.id !== 'string' || typeof message.text !== 'string' || !sentAt) return null;
  if (message.from !== 'client' && message.from !== 'master') return null;

  return { id: message.id, from: message.from, text: message.text, sentAt };
}

function reviveThread(raw: unknown): LiveChatThread | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const thread = raw as Partial<StoredThread>;
  const startedAt = reviveDate(thread.startedAt);

  if (typeof thread.id !== 'string' || typeof thread.masterId !== 'string') return null;
  if (typeof thread.orderTitle !== 'string' || !startedAt) return null;

  return {
    id: thread.id,
    masterId: thread.masterId,
    orderTitle: thread.orderTitle,
    unreadCount: typeof thread.unreadCount === 'number' ? thread.unreadCount : 0,
    startedAt,
    messages: Array.isArray(thread.messages)
      ? thread.messages
          .map(reviveMessage)
          .filter((message): message is LiveChatMessage => message !== null)
      : [],
  };
}

/** Saqlangan suhbatlar; yozuv yoʻq yoki buzilgan boʻlsa `null`. */
export function loadChat(): LiveChatThread[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const threads = parsed
      .map(reviveThread)
      .filter((thread): thread is LiveChatThread => thread !== null);

    return threads.length > 0 ? threads : null;
  } catch {
    return null;
  }
}

export function saveChat(threads: LiveChatThread[]): void {
  try {
    const payload: StoredThread[] = threads.map((thread) => ({
      id: thread.id,
      masterId: thread.masterId,
      orderTitle: thread.orderTitle,
      unreadCount: thread.unreadCount,
      startedAt: thread.startedAt.toISOString(),
      messages: thread.messages.map((message) => ({
        id: message.id,
        from: message.from,
        text: message.text,
        sentAt: message.sentAt.toISOString(),
      })),
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Xotira toʻlgan boʻlsa ham suhbat ishlashda davom etadi.
  }
}

/** Chiqishda chaqiriladi: keyingi foydalanuvchi oldingisining xabarlarini koʻrmasligi kerak. */
export function clearChat(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // eʼtiborsiz
  }
}
