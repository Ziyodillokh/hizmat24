import { ChatsCircle, Robot } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { ChatListRow } from '@/components/ChatListRow';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { formatChatTime } from '@/lib/formatters';
import { masterById } from '@/mocks/masters';
import { useChat } from '../chat-store';

/** AI qatoridagi avatar — foto emas, shuning uchun tusli plitka. */
function AssistantAvatar() {
  return (
    <span
      className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-primary-surface text-primary-pressed"
      aria-hidden
    >
      <Icon icon={Robot} size={24} weight="duotone" />
    </span>
  );
}

/**
 * Suhbatlar roʻyxati.
 *
 * AI yordamchi eng tepada va roʻyxatdan AJRATILGAN: u vaqt boʻyicha
 * saralanmaydi va hech qachon pastga tushib ketmasligi kerak — bu doimo
 * mavjud yordam kanali, oddiy suhbat emas.
 */
export function ChatListScreen() {
  const navigate = useNavigate();
  const { threads, aiMessages } = useChat();

  const now = new Date();
  const lastAi = aiMessages[aiMessages.length - 1];

  return (
    <ScreenShell header={<Header variant="inner" title="Chat" onBack={() => navigate('/app/home')} />}>
      <section className="mt-8">
        <h2 className="px-4 text-overline uppercase text-text-secondary">Yordamchi</h2>
        <ChatListRow
          className="mt-8"
          avatar={<AssistantAvatar />}
          name="Hizmat24 yordamchi"
          subtitle="Savol-javob · 24/7"
          preview={lastAi ? lastAi.text : ''}
          time={lastAi ? formatChatTime(lastAi.sentAt, now) : ''}
          onSelect={() => navigate('/app/chat/ai')}
        />
      </section>

      <section className="mt-20">
        <h2 className="px-4 text-overline uppercase text-text-secondary">Ustalar</h2>

        {threads.length === 0 ? (
          <EmptyState
            icon={ChatsCircle}
            title="Suhbatlar yoʻq"
            description="Buyurtma bergach, usta bilan shu yerda yozishasiz"
            className="mt-24"
            inline
          />
        ) : (
          <ul className="mt-8 flex flex-col gap-8">
            {threads.map((thread) => {
              const master = masterById(thread.masterId);
              // Usta oʻchirilgan boʻlsa qator ism va fotosiz chizilardi —
              // bunday "arvoh" suhbatni koʻrsatgandan koʻra tashlab ketgan
              // maʼqul.
              if (!master) return null;

              const last = thread.messages[thread.messages.length - 1];
              // Yangi ochilgan suhbatda xabar yoʻq — qator boʻsh qolmasligi
              // uchun holatning oʻzi yoziladi.
              const preview = !last
                ? 'Suhbat boshlanmagan'
                : last.from === 'client'
                  ? `Siz: ${last.text}`
                  : last.text;

              return (
                <li key={thread.id}>
                  <ChatListRow
                    avatar={<Avatar name={master.fullName} src={master.photoUrl} size={48} />}
                    name={master.fullName}
                    subtitle={thread.orderTitle}
                    preview={preview}
                    time={formatChatTime(last ? last.sentAt : thread.startedAt, now)}
                    unreadCount={thread.unreadCount}
                    onSelect={() => navigate(`/app/chat/${thread.id}`)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
