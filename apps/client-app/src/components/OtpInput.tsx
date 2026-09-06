import { useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * OTP kod kataki — spetsifikatsiya 9.21-bandi (04-ekran).
 * 6 ta katak: w=48 h=56 radius/md, matn `h2` markazda, tabular figures,
 * kataklar orasi 8px. Holatlar: empty · filled · focus · error · disabled.
 */
export type OtpState = 'default' | 'error' | 'disabled';

/** 9.21-band: aynan 6 ta katak. */
const OTP_LENGTH = 6;

type BoxState = 'empty' | 'filled' | 'focus' | 'error' | 'disabled';

const BOX_CLASSES: Record<BoxState, string> = {
  empty: 'border border-border bg-surface-sunken text-text-primary',
  filled: 'border-2 border-border-strong bg-surface-sunken text-text-primary',
  focus: 'border-2 border-primary bg-surface-sunken text-text-primary ring-4 ring-primary/20',
  error: 'border-2 border-danger bg-surface-sunken text-text-primary',
  disabled: 'border border-border bg-surface-sunken text-text-disabled',
};

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  state?: OtpState;
  autoFocus?: boolean;
  className?: string;
}

/** Faqat raqamlar qabul qilinadi — paste qilingan matn ham shu yerda tozalanadi. */
const toDigits = (raw: string): string => raw.replace(/\D/g, '').slice(0, OTP_LENGTH);

function resolveBoxState(
  index: number,
  value: string,
  state: OtpState,
  isFocused: boolean,
): BoxState {
  if (state === 'disabled') return 'disabled';
  if (state === 'error') return 'error';
  // Kursor to'ldirilmagan birinchi katakda turadi; kod to'liq bo'lsa — oxirgisida.
  const caretIndex = Math.min(value.length, OTP_LENGTH - 1);
  if (isFocused && index === caretIndex) return 'focus';
  return value[index] ? 'filled' : 'empty';
}

export function OtpInput({
  value,
  onChange,
  state = 'default',
  autoFocus = false,
  className,
}: OtpInputProps) {
  // Sof UI holati: halqa faqat haqiqiy fokusda ko'rinadi.
  const [isFocused, setIsFocused] = useState(false);
  const isDisabled = state === 'disabled';

  return (
    <div
      className={cn(
        'relative flex justify-center gap-8',
        state === 'error' && 'animate-shake',
        className,
      )}
    >
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            // 6 katak × 48px + 5 × 8px = 328px — bu 360px telefonda kontent
            // kengligidan (320px) oshib ketadi. Shuning uchun katak etalon
            // o'lchamgacha o'sadi, undan tor ekranda esa teng siqiladi.
            'tabular flex h-[56px] min-w-0 flex-1 basis-0 items-center justify-center',
            'max-w-48 rounded-md text-h2',
            BOX_CLASSES[resolveBoxState(index, value, state, isFocused)],
          )}
        >
          {value[index] ?? ''}
        </span>
      ))}

      {/* Bitta ko'rinmas input — klaviatura, paste va SMS avto-to'ldirish shu orqali ishlaydi. */}
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        disabled={isDisabled}
        maxLength={OTP_LENGTH}
        aria-label="Tasdiqlash kodi"
        aria-invalid={state === 'error' || undefined}
        value={value}
        onChange={(event) => onChange(toDigits(event.target.value))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="absolute inset-0 h-full w-full opacity-0"
      />
    </div>
  );
}
