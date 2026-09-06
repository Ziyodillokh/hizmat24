import { useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { FIELD_BASE_CLASSES, FIELD_STATE_CLASSES, resolveFieldState } from './Input';

/**
 * Textarea — spetsifikatsiya 9.2-bandi.
 * Min balandlik 120px, ichida pastki oʻngda belgilar hisoblagichi
 * (`caption`, `text-secondary`). Maksimumga yetganda hisoblagich `danger`
 * rangga oʻtadi (08-ekran holatlari: "2000/2000, hisoblagich danger").
 */
export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value'> {
  /** Boshqariladigan qiymat — hisoblagich aynan shundan sanaladi. */
  value: string;
  /** Berilsa, pastki oʻngda "N/maksimum" hisoblagichi chiziladi. */
  maxLength?: number;
  /** Xato matni — berilsa maydon `error` holatiga oʻtadi (9.2-band). */
  error?: string;
}

export function Textarea({ value, maxLength, error, disabled, className, id, ...rest }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const errorId = `${textareaId}-error`;
  const state = resolveFieldState(disabled, Boolean(error));
  const isAtMax = maxLength !== undefined && value.length >= maxLength;

  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          id={textareaId}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            FIELD_BASE_CLASSES,
            // Pastki padding hisoblagich uchun joy qoldiradi (16 padding + 16 hisoblagich + 8 boʻshliq).
            'block min-h-[120px] resize-none py-16 pb-40',
            FIELD_STATE_CLASSES[state],
            className,
          )}
          {...rest}
        />
        {maxLength !== undefined && (
          <span
            className={cn(
              'pointer-events-none absolute bottom-16 right-16 text-caption text-text-secondary',
              isAtMax && 'text-danger',
            )}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-[6px] text-body-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
