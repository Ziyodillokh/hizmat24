import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Input — spetsifikatsiya 9.2-bandi.
 * h=52, radius/md, padding 16. Holatlar: `empty`/`filled` (fon `surface-sunken`,
 * 1px `border`, placeholder `text-secondary`) · `focus` (2px `primary` border +
 * tashqi 4px `primary` 20% halqa) · `error` (2px `danger` border, ostida 6px
 * pastda `body-sm` `danger` matn) · `disabled`.
 */
export type FieldState = 'default' | 'error' | 'disabled';

/** Input va Textarea 9.2-bandda bitta komponent sifatida taʼriflangan — uslub umumiy. */
export const FIELD_BASE_CLASSES =
  'w-full rounded-md bg-surface-sunken px-16 text-body-lg text-text-primary outline-none transition-colors placeholder:text-text-secondary';

/**
 * Fokus halqasi — 9.2-band: "tashqi 4px `primary` 20% halqa".
 *
 * `ring-primary/20` YOZIB BOʻLMAYDI: rang tokenlari `var(--color-*)` shaklida
 * berilgani uchun Tailwind opacity modifikatorini hisoblab chiqara olmaydi va
 * Halqa rangi ANIQ berilishi shart: berilmasa `--tw-ring-color` Tailwindʼning
 * standart `blue-500` qiymatiga tushib qoladi, yaʼni token jadvalida yoʻq rang
 * (3.4-band, 14.7-band 47-punkt).
 */
export const FIELD_FOCUS_RING_CLASSES =
  'focus:ring-4 focus:ring-primary/[0.20]';

export const FIELD_STATE_CLASSES: Record<FieldState, string> = {
  default: `border border-border focus:border-2 focus:border-primary ${FIELD_FOCUS_RING_CLASSES}`,
  error: 'border-2 border-danger',
  disabled: 'cursor-not-allowed border border-border text-text-disabled placeholder:text-text-disabled',
};

export function resolveFieldState(isDisabled?: boolean, hasError?: boolean): FieldState {
  if (isDisabled) return 'disabled';
  // Disabled maydon xatoni koʻrsatmaydi — u tahrirlanmaydi, shuning uchun tartib shu.
  if (hasError) return 'error';
  return 'default';
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Xato matni — berilsa maydon `error` holatiga oʻtadi va matn ostida chiziladi. */
  error?: string;
}

export function Input({ error, disabled, className, id, ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const state = resolveFieldState(disabled, Boolean(error));

  return (
    <div className="w-full">
      <input
        id={inputId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(FIELD_BASE_CLASSES, 'h-[52px]', FIELD_STATE_CLASSES[state], className)}
        {...rest}
      />
      {error && (
        <p id={errorId} className="mt-[6px] text-body-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
