import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AI_GREETING, answerFor } from '@/mocks/aiAssistant';
import { CHAT_THREADS } from '@/mocks/chats';
import { clearChat, loadChat, saveChat } from './chat-persistence';
import { useApp } from './store';
import type { AiMessage, LiveChatMessage, LiveChatThread } from './types';

/**
 * Chat holati.
 *
 * `AppProvider` dan ALOHIDA turadi: buyurtma holati serverdagi oʻtishlarni
 * taqlid qiladigan taymerlarga toʻla, chat esa sof foydalanuvchi kiritmasi.
 * Ikkalasini bitta providerga tiqish faylni 500 qatordan oshirar va har bir
 * yozilgan harf butun buyurtma daraxtini qayta chizishga majbur qilardi.
 *
 * Yozilgan xabarlar qurilmada saqlanadi (`chat-persistence.ts`) — ilova
 * yopilib qayta ochilganda suhbat yoʻqolmasligi kerak.
 */
const MINUTE_MS = 60_000;

/** AI javobi darhol chiqmaydi — bir zumlik pauza suhbatni tabiiy qiladi. */
const AI_REPLY_DELAY_MS = 600;

const greetingMessage = (): AiMessage => ({
  id: 'greeting',
  from: 'assistant',
  text: AI_GREETING,
  sentAt: new Date(),
});

interface ChatContextValue {
  /** Oxirgi xabari eng yangi boʻlgan suhbat birinchi. */
  threads: LiveChatThread[];
  /** Barcha suhbatlar boʻyicha oʻqilmagan xabarlar soni. */
  unreadTotal: number;
  findThread: (threadId: string) => LiveChatThread | undefined;
  /**
   * Usta bilan suhbatni ochadi va uning `id` sini QAYTARADI.
   *
   * Suhbat boʻlmasa — boʻsh suhbat yaratiladi. Aks holda "Yozish" tugmasi
   * faqat mockʻda suhbati bor uchta usta uchun ishlardi, qolganlarida esa
   * jimgina hech narsa qilmasdi.
   */
  openThread: (masterId: string, orderTitle: string) => string;
  /** Ustaga xabar yozish. Boʻsh matn yuborilmaydi. */
  sendMessage: (threadId: string, text: string) => void;
  markThreadRead: (threadId: string) => void;
  aiMessages: AiMessage[];
  /** AI javob yozayotgan payt — kompozitor bloklanadi. */
  isAiTyping: boolean;
  askAi: (text: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat(): ChatContextValue {
  const value = useContext(ChatContext);
  if (!value) throw new Error('useChat faqat ChatProvider ichida ishlatiladi');
  return value;
}

/** Nisbiy mock vaqtini ilova ochilgan paytga nisbatan aniq sanaga aylantiradi. */
function seedThreads(openedAt: number): LiveChatThread[] {
  return CHAT_THREADS.map((thread) => ({
    id: thread.id,
    masterId: thread.masterId,
    orderTitle: thread.orderTitle,
    unreadCount: thread.unreadCount,
    startedAt: new Date(openedAt),
    messages: thread.messages.map((message) => ({
      id: message.id,
      from: message.from,
      text: message.text,
      sentAt: new Date(openedAt - message.minutesAgo * MINUTE_MS),
    })),
  }));
}

/**
 * Saqlangan suhbatlarni mock roʻyxati bilan birlashtiradi.
 *
 * Mockʻga yangi usta qoʻshilsa, u saqlangan yozuvda boʻlmaydi — ilova esa
 * eski nusxani koʻrsatib, yangi suhbatni yashirib qoʻyardi. Shuning uchun
 * saqlangan suhbatlar ustuvor, qolgan mock suhbatlar esa ustiga qoʻshiladi.
 */
function mergeWithSeeds(stored: LiveChatThread[] | null, seeds: LiveChatThread[]): LiveChatThread[] {
  if (!stored) return seeds;

  const known = new Set(stored.map((thread) => thread.masterId));
  return [...stored, ...seeds.filter((seed) => !known.has(seed.masterId))];
}

const lastSentAt = (thread: LiveChatThread): number =>
  thread.messages[thread.messages.length - 1]?.sentAt.getTime() ?? thread.startedAt.getTime();

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useApp();

  const [threads, setThreads] = useState<LiveChatThread[]>(() =>
    mergeWithSeeds(loadChat(), seedThreads(Date.now())),
  );
  const [aiMessages, setAiMessages] = useState<AiMessage[]>(() => [greetingMessage()]);
  const [isAiTyping, setAiTyping] = useState(false);

  // Har oʻzgarishda yoziladi: xabar yuborish ham, oʻqilgan deb belgilash ham.
  // Kirmagan holatda esa yozuv OʻCHIRILADI — chiqqandan keyin qurilmada
  // oldingi foydalanuvchining suhbati qolib ketmasligi kerak.
  useEffect(() => {
    if (!isAuthenticated) {
      clearChat();
      return;
    }
    saveChat(threads);
  }, [threads, isAuthenticated]);

  // Chiqishda xotiradagi suhbat ham tozalanadi.
  useEffect(() => {
    if (isAuthenticated) return;
    setThreads(seedThreads(Date.now()));
    setAiMessages([greetingMessage()]);
  }, [isAuthenticated]);

  const replyTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (replyTimer.current !== null) window.clearTimeout(replyTimer.current);
    },
    [],
  );

  const sendMessage = useCallback((threadId: string, text: string) => {
    const body = text.trim();
    if (!body) return;

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread;

        const message: LiveChatMessage = {
          id: `own-${thread.messages.length}-${body.length}`,
          from: 'client',
          text: body,
          sentAt: new Date(),
        };

        return { ...thread, messages: [...thread.messages, message] };
      }),
    );
  }, []);

  const openThread = useCallback(
    (masterId: string, orderTitle: string): string => {
      const existing = threads.find((thread) => thread.masterId === masterId);
      if (existing) return existing.id;

      const id = `t-new-${masterId}`;
      setThreads((prev) =>
        prev.some((thread) => thread.masterId === masterId)
          ? prev
          : [
              ...prev,
              { id, masterId, orderTitle, messages: [], unreadCount: 0, startedAt: new Date() },
            ],
      );

      return id;
    },
    [threads],
  );

  const markThreadRead = useCallback((threadId: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === threadId && thread.unreadCount > 0
          ? { ...thread, unreadCount: 0 }
          : thread,
      ),
    );
  }, []);

  const askAi = useCallback((text: string) => {
    const question = text.trim();
    if (!question) return;

    setAiMessages((prev) => [
      ...prev,
      { id: `q-${prev.length}`, from: 'client', text: question, sentAt: new Date() },
    ]);
    setAiTyping(true);

    replyTimer.current = window.setTimeout(() => {
      replyTimer.current = null;
      setAiTyping(false);
      setAiMessages((prev) => [
        ...prev,
        { id: `a-${prev.length}`, from: 'assistant', text: answerFor(question), sentAt: new Date() },
      ]);
    }, AI_REPLY_DELAY_MS);
  }, []);

  const value = useMemo<ChatContextValue>(() => {
    const sorted = [...threads].sort((a, b) => lastSentAt(b) - lastSentAt(a));

    return {
      threads: sorted,
      unreadTotal: threads.reduce((sum, thread) => sum + thread.unreadCount, 0),
      findThread: (threadId) => threads.find((thread) => thread.id === threadId),
      openThread,
      sendMessage,
      markThreadRead,
      aiMessages,
      isAiTyping,
      askAi,
    };
  }, [threads, aiMessages, isAiTyping, openThread, sendMessage, markThreadRead, askAi]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
