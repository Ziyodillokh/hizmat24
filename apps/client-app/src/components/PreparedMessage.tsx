import { CaretRight, Clock, Copy, PaperPlaneTilt, Phone } from '@phosphor-icons/react';
import { Button } from './Button';
import { Icon } from './Icon';
import { StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { copyText } from '@/lib/clipboard';
import { formatDateTime } from '@/lib/formatters';
import {
  CHANNEL_OPENED_LABELS,
  SUPPORT_PHONE,
  SUPPORT_PHONE_LABEL,
  SUPPORT_TELEGRAM_URL,
  supportStatusLine,
  type SupportChannel,
  type SupportChannelEvent,
} from '@/lib/support';

/**
 * "Tayyorlangan matn" bloklari.
 *
 * Murojaat (5-bosqich) va usta arizasi (7-bosqich) bir xil naqshda ishlaydi:
 * ilova matnni TAYYORLAYDI, foydalanuvchi uni haqiqiy kanal orqali
 * YUBORADI. Ikkala ekran bir xil bloklarni chizadi — nusxalash, Telegram,
 * telefon, kanal jurnali — shuning uchun ular bitta joyda yashaydi.
 *
 * "Yuborildi" HECH QAYERDA yozilmaydi: ilova havola ochilganini biladi,
 * matn qoʻyilganini BILMAYDI.
 */

/** Matnning oʻzi — DOIM ekranda. Nusxalash ishlamasa ham barmoq bilan belgilanadi. */
export function PreparedMessageText({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-transparent bg-surface-elevated p-16 shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        className,
      )}
    >
      <p className="select-text whitespace-pre-wrap break-words text-body-sm text-text-primary">
        {message}
      </p>
    </div>
  );
}

export interface CopyMessageButtonProps {
  message: string;
  /** Natija: `true` — nusxalandi. Ekran toast va holatni shundan oladi. */
  onCopied: (ok: boolean) => void;
  className?: string;
}

export function CopyMessageButton({ message, onCopied, className }: CopyMessageButtonProps) {
  return (
    <div className={className}>
      <Button
        variant="secondary"
        leadingIcon={Copy}
        onClick={() => {
          void copyText(message).then(onCopied);
        }}
      >
        Matnni nusxalash
      </Button>
      <p className="mt-8 text-center text-caption text-text-secondary">
        Nusxalash ishlamasa, yuqoridagi matnni barmoq bilan belgilab oling.
      </p>
    </div>
  );
}

export interface SupportPhoneBlockProps {
  /** Qoʻngʻiroqda aytiladigan identifikator (masalan, buyurtma raqami). */
  sayOnCall?: { label: string; value: string };
  now: Date;
  onOpen: () => void;
  className?: string;
}

/** Telefon kanali: qator, "qoʻngʻiroqda ayting" bloki va jonli ish vaqti. */
export function SupportPhoneBlock({ sayOnCall, now, onOpen, className }: SupportPhoneBlockProps) {
  return (
    <div className={className}>
      <h2 className="px-4 text-overline uppercase text-text-secondary">Yoki qoʻngʻiroq qiling</h2>
      <a
        href={`tel:${SUPPORT_PHONE}`}
        onClick={onOpen}
        className="mt-8 flex min-h-touch w-full items-center gap-12 border-b border-border px-4 py-16 text-left"
      >
        <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-surface-sunken">
          <Icon icon={Phone} size={20} className="text-primary" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body-lg text-text-primary">Qoʻngʻiroq qilish</span>
          <span className="block text-body-sm text-text-secondary">{SUPPORT_PHONE_LABEL}</span>
        </span>
        <Icon icon={CaretRight} size={16} className="shrink-0 text-text-secondary" />
      </a>

      {sayOnCall && (
        <div className="mt-12 rounded-sm bg-surface-sunken p-16">
          <p className="text-caption text-text-secondary">{sayOnCall.label}</p>
          <p className="tabular mt-4 text-body-lg tracking-[0.4px] text-text-primary">
            {sayOnCall.value}
          </p>
        </div>
      )}

      <div className="mt-12 flex items-center gap-8">
        <Icon icon={Clock} size={16} className="text-text-secondary" />
        <p className="text-caption text-text-secondary">{supportStatusLine(now)}</p>
      </div>
    </div>
  );
}

/** Kanal jurnali — faqat hodisa boʻlsa chiziladi. */
export function ChannelLog({
  events,
  now,
  className,
}: {
  events: readonly SupportChannelEvent[];
  now: Date;
  className?: string;
}) {
  if (events.length === 0) return null;
  return (
    <div className={className}>
      <h2 className="px-4 text-overline uppercase text-text-secondary">Nima qilingan</h2>
      <ul className="mt-8 flex flex-col gap-4">
        {events.map((event, index) => (
          <li key={index} className="px-4 text-body-sm text-text-secondary">
            {CHANNEL_OPENED_LABELS[event.channel]} · {formatDateTime(event.openedAt, now)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface TelegramFooterProps {
  /** Matn nusxalanganmi — ishora shunga qarab oʻzgaradi. */
  copied: boolean;
  onOpen: (channel: SupportChannel) => void;
}

/**
 * Asosiy amal HAVOLA, tugma emas: `https:` sxemasini brauzerning oʻzi
 * ochadi, `onClick` esa faqat lokal jurnalga yozadi va sinxron tugaydi.
 */
export function TelegramFooter({ copied, onOpen }: TelegramFooterProps) {
  return (
    <StickyFooter>
      <div className="flex flex-col gap-12">
        <a
          href={SUPPORT_TELEGRAM_URL}
          onClick={() => onOpen('telegram')}
          className="flex h-[52px] w-full items-center justify-center gap-8 rounded-md bg-primary px-16 text-button text-on-primary shadow-primary-lift"
        >
          <Icon icon={PaperPlaneTilt} size={20} weight="fill" />
          Telegramni ochish
        </a>
        <p className="text-center text-caption text-text-secondary">
          {copied
            ? 'Telegram ochilgach matn maydonini bosib turing va «Qoʻyish» ni tanlang.'
            : 'Avval matnni nusxalang — Telegramda uni qoʻyasiz.'}
        </p>
      </div>
    </StickyFooter>
  );
}
