import { Info, Robot } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { ChatBubble, TypingBubble } from '@/components/ChatBubble';
import { ChatComposer } from '@/components/ChatComposer';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/formatters';
import { AI_TOPICS } from '@/mocks/aiAssistant';
import { useChat } from '../chat-store';

/**
 * AI yordamchi.
 *
 * Javoblar mock (`src/mocks/aiAssistant.ts`) va bu ekranda OCHIQ aytiladi.
 * Tavsiya chiplari shu sababdan bor: ular mock javob mavjud boʻlgan
 * savollarni koʻrsatadi, yaʼni foydalanuvchi "javob yoʻq" devoriga
 * urilmaydi.
 */
export function AiAssistantScreen() {
  const navigate = useNavigate();
  const { aiMessages, isAiTyping, askAi } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [aiMessages.length, isAiTyping]);

  // Berilgan savol chiplar orasidan chiqadi — bir xil savolni ikki marta
  // taklif qilish yordamchini "eshitmayotgandek" koʻrsatadi.
  const asked = useMemo(
    () => new Set(aiMessages.filter((item) => item.from === 'client').map((item) => item.text)),
    [aiMessages],
  );
  const suggestions = AI_TOPICS.filter((topic) => !asked.has(topic.question));

  return (
    <ScreenShell
      header={
        <Header
          variant="inner"
          title="AI yordamchi"
          onBack={() => navigate('/app/chat')}
          action={
            <span
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-primary-surface text-primary-pressed"
              aria-hidden
            >
              <Icon icon={Robot} size={20} weight="duotone" />
            </span>
          }
        />
      }
      footer={
        <StickyFooter>
          <ChatComposer
            onSend={askAi}
            disabled={isAiTyping}
            placeholder={isAiTyping ? 'Javob yozilmoqda…' : 'Savolingizni yozing'}
          />
        </StickyFooter>
      }
    >
      <Banner variant="info" icon={Info} className="mt-8">
        Yordamchi hozircha demo rejimida: javoblar tayyor matnlardan olinadi.
      </Banner>

      <div className="mt-16 flex flex-col gap-8">
        {aiMessages.map((message) => (
          <ChatBubble
            key={message.id}
            side={message.from === 'client' ? 'own' : 'other'}
            text={message.text}
            time={formatTime(message.sentAt)}
          />
        ))}
        {isAiTyping && <TypingBubble />}
      </div>

      {suggestions.length > 0 && (
        <section className="mt-16">
          <h2 className="px-4 text-overline uppercase text-text-secondary">Tez savollar</h2>
          <ul className="mt-8 flex flex-wrap gap-8">
            {suggestions.map((topic) => (
              <li key={topic.id}>
                <button
                  type="button"
                  onClick={() => askAi(topic.question)}
                  disabled={isAiTyping}
                  className={cn(
                    'min-h-[36px] rounded-full border border-primary/[0.32] bg-primary-surface px-16',
                    'text-button-sm text-primary-pressed',
                    'transition-transform duration-press ease-std active:scale-[0.97]',
                    'disabled:opacity-50 disabled:active:scale-100',
                  )}
                >
                  {topic.chip}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div ref={bottomRef} className="h-12" aria-hidden />
    </ScreenShell>
  );
}
