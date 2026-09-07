import { cn } from '@/lib/cn';
import { COUNTRY_CODE, formatPhoneDigits, toPhoneDigits } from '@/lib/phone';
import { FIELD_FOCUS_RING_CLASSES } from './Input';

/**
 * Telefon raqami maydoni.
 *
 * Mamlakat kodi ALOHIDA, oʻzgarmas boʻlakda turadi va tahrirlanmaydi.
 * Ilgari u maydon ichida `+998` matni sifatida chizilardi: kursor uning
 * ustiga tushib qolishi, foydalanuvchi esa kodni tasodifan oʻchirib
 * yuborishi mumkin edi.
 *
 * Raqam kiritish paytida guruhlanadi (90 123 45 67) — uzluksiz toʻqqizta
 * raqamni koʻz bilan tekshirib boʻlmaydi.
 */
export interface PhoneFieldProps {
  /** Faqat raqamlar, mamlakat kodisiz. */
  value: string;
  onChange: (digits: string) => void;
  /** Klaviaturadagi "Enter" bosilganda. */
  onSubmit?: () => void;
  label?: string;
  className?: string;
}

export function PhoneField({ value, onChange, onSubmit, label, className }: PhoneFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor="phone-field" className="block text-title text-text-primary">
          {label}
        </label>
      )}

      <div className={cn('flex items-stretch gap-12', label && 'mt-8')}>
        <span
          className="flex h-[56px] shrink-0 items-center rounded-md border border-border bg-surface-sunken px-16 text-body-lg text-text-primary"
          aria-hidden
        >
          {COUNTRY_CODE}
        </span>

        <input
          id="phone-field"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="90 123 45 67"
          value={formatPhoneDigits(value)}
          onChange={(event) => onChange(toPhoneDigits(event.target.value))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit?.();
          }}
          aria-label={label ?? 'Telefon raqam'}
          className={cn(
            'h-[56px] min-w-0 flex-1 rounded-md border border-border bg-surface-sunken px-16',
            'text-body-lg text-text-primary outline-none placeholder:text-text-secondary',
            'focus:border-primary',
            FIELD_FOCUS_RING_CLASSES,
          )}
        />
      </div>
    </div>
  );
}
