import { ArrowLeft, Phone } from '@phosphor-icons/react';
import { useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { ChatBubble, ChatDayDivider } from '@/components/ChatBubble';
import { ChatComposer } from '@/components/ChatComposer';
import { Icon } from '@/components/Icon';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatDayLabel, formatTime } from '@/lib/formatters';
import { isMasterPhoneVisible } from '@/lib/orderStateMachine';
import { masterById } from '@/mocks/masters';
import { useChat } from '../chat-store';
import { useApp } from '../store';

/** Suhbat sarlavhasi — avatar, ism va kasb; bosilganda usta profili ochiladi. */
interface ThreadHeaderProps {
  name: string;
  profession: string;
  photoUrl?: string;
  phoneNumber?: string | null;
  onBack: () => void;
  onOpenProfile: () => void;
}

function ThreadHeader({
  name,
  profession,
  photoUrl,
  phoneNumber,
  onBack,
  onOpenProfile,
}: ThreadHeaderProps) {
  return (
    <header className="flex h-header w-full items-center gap-8 px-20">
      <button
        type="button"
        onClick={onBack}
        aria-label="Orqaga"
        className="flex h-touch w-touch shrink-0 items-center justify-start"
      >
        <Icon icon={ArrowLeft} size={24} className="text-text-secondary" />
      </button>

      <button
        type="button"
        onClick={onOpenProfile}
        className="flex min-w-0 flex-1 items-center gap-12 text-left"
      >
        <Avatar name={name} src={photoUrl} size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-title text-text-primary">{name}</span>
          <span className="block truncate text-caption text-text-secondary">{profession}</span>
        </span>
      </button>

      {/*
        Qoʻngʻiroq faqat buyurtma aktiv boʻlganda: usta raqami ish tugagach
        yopiladi (`isMasterPhoneVisible`). Chatda uni doim koʻrsatish shu
        qoidani aylanib oʻtish boʻlardi.
      */}
      {phoneNumber && (
        <a
          href={`tel:${phoneNumber}`}
          aria-label="Qoʻngʻiroq qilish"
          className="flex h-touch w-touch shrink-0 items-center justify-end text-primary-pressed"
        >
          <Icon icon={Phone} size={20} weight="fill" />
        </a>
      )}
    </header>
  );
}

export function ChatThreadScreen() {
  const navigate = useNavigate();
  const { threadId } = useParams<{ threadId: string }>();
  const { findThread, sendMessage, markThreadRead } = useChat();
  const { activeOrder } = useApp();

  const thread = threadId ? findThread(threadId) : undefined;
  const master = masterById(thread?.masterId);

  const bottomRef = useRef<HTMLDivElement>(null);
  const messageCount = thread?.messages.length ?? 0;

  // Suhbat ochilganda oʻqilmagan belgisi olib tashlanadi.
  useEffect(() => {
    if (threadId) markThreadRead(threadId);
  }, [threadId, markThreadRead]);

  // Chat oxirgi xabardan ochiladi — yuqoridan emas. Yangi xabar qoʻshilganda
  // ham pastga suriladi, aks holda oʻz xabaringiz koʻrinmay qolardi.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messageCount]);

  if (!thread || !master) return <Navigate to="/app/chat" replace />;

  const canCall =
    activeOrder !== null &&
    activeOrder.master?.id === master.id &&
    isMasterPhoneVisible(activeOrder.status)
      ? master.phoneNumber
      : null;

  const now = new Date();

  return (
    <ScreenShell
      header={
        <ThreadHeader
          name={master.fullName}
          profession={master.profession}
          photoUrl={master.photoUrl}
          phoneNumber={canCall}
          onBack={() => navigate('/app/chat')}
          onOpenProfile={() => navigate(`/app/master/${master.id}`)}
        />
      }
      footer={
        <StickyFooter>
          <ChatComposer onSend={(text) => sendMessage(thread.id, text)} />
        </StickyFooter>
      }
    >
      {/* Suhbat qaysi buyurtma yuzasidan ekani — ish tafsiloti yodda qolmaydi. */}
      <p className="pt-8 text-center text-caption text-text-secondary">{thread.orderTitle}</p>

      {/*
        Demo eslatmasi. Xabar ekranda paydo boʻladi, lekin hech qayerga
        yuborilmaydi — buni aytmaslik foydalanuvchini javob kutishga
        majbur qilardi.
      */}
      <p className="mt-8 rounded-md bg-surface-sunken px-12 py-8 text-center text-caption text-text-secondary">
        Demo rejimi: xabarlar qurilmada qoladi va ustaga yetib bormaydi.
      </p>

      {thread.messages.length === 0 && (
        <p className="mt-32 text-center text-body-sm text-text-secondary">
          Suhbat hali boshlanmagan. Birinchi xabarni yozing.
        </p>
      )}

      <div className="mt-12 flex flex-col gap-8">
        {thread.messages.map((message, index) => {
          // Ajratkich faqat kun ALMASHGANDA chiziladi. Solishtirish oldingi
          // xabar bilan boʻladi — render paytida oʻzgaruvchi saqlash render
          // funksiyasini nopok qilardi.
          const day = formatDayLabel(message.sentAt, now);
          const previous = thread.messages[index - 1];
          const showDivider = !previous || formatDayLabel(previous.sentAt, now) !== day;

          return (
            <div key={message.id} className="flex flex-col gap-8">
              {showDivider && <ChatDayDivider label={day} />}
              <ChatBubble
                side={message.from === 'client' ? 'own' : 'other'}
                text={message.text}
                time={formatTime(message.sentAt)}
              />
            </div>
          );
        })}
      </div>

      <div ref={bottomRef} className="h-12" aria-hidden />
    </ScreenShell>
  );
}
