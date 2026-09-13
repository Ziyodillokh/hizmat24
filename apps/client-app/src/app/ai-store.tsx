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
import type { AiMessage } from './types';

/**
 * AI yordamchi suhbati.
 *
 * Ilgari bu chat provideri ichida edi; usta bilan yozishish (Chat boʻlimi)
 * olib tashlangach, AI oʻz kichik provideriga koʻchdi. Suhbat sessiya
 * davomida saqlanadi (ekrandan chiqib qaytganda yoʻqolmaydi), lekin
 * qurilmaga yozilmaydi — javoblar mock, saqlashga arzimaydi.
 *
 * DIQQAT: bu haqiqiy AI emas. Backend ulanmagunicha javoblar
 * `mocks/aiAssistant.ts` dagi tayyor matnlardan keladi.
 */

/** AI javobi darhol chiqmaydi — bir zumlik pauza suhbatni tabiiy qiladi. */
const AI_REPLY_DELAY_MS = 600;

const greetingMessage = (): AiMessage => ({
  id: 'greeting',
  from: 'assistant',
  text: AI_GREETING,
  sentAt: new Date(),
});

interface AiContextValue {
  messages: AiMessage[];
  /** AI javob yozayotgan payt — kompozitor bloklanadi. */
  isTyping: boolean;
  ask: (text: string) => void;
}

const AiContext = createContext<AiContextValue | null>(null);

export function useAi(): AiContextValue {
  const value = useContext(AiContext);
  if (!value) throw new Error('useAi faqat AiProvider ichida ishlatiladi');
  return value;
}

export function AiProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<AiMessage[]>(() => [greetingMessage()]);
  const [isTyping, setTyping] = useState(false);
  const replyTimer = useRef<number | null>(null);

  // Komponent yoʻq qilinganda kutilayotgan javob taymeri tozalanadi.
  useEffect(
    () => () => {
      if (replyTimer.current !== null) window.clearTimeout(replyTimer.current);
    },
    [],
  );

  const ask = useCallback((text: string) => {
    const question = text.trim();
    if (!question) return;

    setMessages((prev) => [
      ...prev,
      { id: `q-${prev.length}`, from: 'client', text: question, sentAt: new Date() },
    ]);
    setTyping(true);

    replyTimer.current = window.setTimeout(() => {
      replyTimer.current = null;
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: `a-${prev.length}`, from: 'assistant', text: answerFor(question), sentAt: new Date() },
      ]);
    }, AI_REPLY_DELAY_MS);
  }, []);

  const value = useMemo<AiContextValue>(() => ({ messages, isTyping, ask }), [messages, isTyping, ask]);

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
}
