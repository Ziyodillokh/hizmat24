import { PaperPlaneRight } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';
import { cn } from '@/lib/cn';
import { FIELD_FOCUS_RING_CLASSES } from './Input';
import { Icon } from './Icon';

/**
 * Xabar yozish qatori — usta bilan suhbatda ham, AI yordamchida ham bir xil.
 *
 * Matn HOLATI shu komponent ichida: yuborilgandan keyin maydon tozalanishi
 * kerak, va bu ekranning ishi emas. Ekran faqat `onSend` ni oladi.
 *
 * `form` ataylab: klaviaturadagi "yuborish" tugmasi (Enter, Androidʻda ⏎)
 * shunda ishlaydi — usiz foydalanuvchi har safar ekrandagi tugmani qidirardi.
 */
export interface ChatComposerProps {
  onSend: (text: string) => void;
  /** Javob kutilayotganda yozishni vaqtincha toʻxtatadi. */
  disabled?: boolean;
  placeholder?: string;
}

/** Bir xabarning eng koʻp uzunligi — SMS emas, lekin cheksiz ham emas. */
const MAX_LENGTH = 1000;

export function ChatComposer({
  onSend,
  disabled = false,
  placeholder = 'Xabar yozing',
}: ChatComposerProps) {
  const [text, setText] = useState('');

  const canSend = text.trim().length > 0 && !disabled;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSend) return;
    onSend(text);
    setText('');
  };

  return (
    <form onSubmit={submit} className="flex items-end gap-8">
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={disabled}
        maxLength={MAX_LENGTH}
        placeholder={placeholder}
        aria-label="Xabar matni"
        enterKeyHint="send"
        className={cn(
          'h-[48px] min-w-0 flex-1 rounded-full border border-border bg-surface-sunken px-16',
          'text-body-lg text-text-primary outline-none transition-colors',
          'placeholder:text-text-secondary',
          'focus:border-primary',
          FIELD_FOCUS_RING_CLASSES,
          disabled && 'cursor-not-allowed text-text-disabled',
        )}
      />

      <button
        type="submit"
        disabled={!canSend}
        aria-label="Yuborish"
        className={cn(
          'flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full',
          'transition-[background-color,transform] duration-press ease-emphasized',
          'active:scale-[0.94] disabled:active:scale-100',
          canSend
            ? 'bg-primary text-on-primary shadow-primary-lift active:bg-primary-pressed'
            : // Oʻchgan tugma YOʻQOLMAYDI: joyi saqlanadi, aks holda maydon
              // kengayib-torayib "sakrardi".
              'bg-surface-sunken text-text-disabled',
        )}
      >
        <Icon icon={PaperPlaneRight} size={20} weight={canSend ? 'fill' : 'regular'} />
      </button>
    </form>
  );
}
