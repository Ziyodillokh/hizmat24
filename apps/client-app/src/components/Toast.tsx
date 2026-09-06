import { useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Toast / snackbar — spetsifikatsiya 9.25-bandi.
 * h=48, radius/sm, e3, kenglik = ekran - 40px (ikki chetdan 20px),
 * tab bar ustida 12px, matn `body-sm`, 3 soniya koʻrinadi.
 */
export type ToastVariant = 'neutral' | 'success' | 'danger';

/** 9.25-band: toast 3 soniyadan keyin yopiladi. */
const TOAST_DURATION_MS = 3000;

/**
 * Variant tusi — tokenning 14% shaffofligi.
 *
 * Shaffoflik Tailwindʼning standart `/[0.NN]` modifikatori orqali beriladi:
 * rang tokenlari RGB kanallari sifatida saqlanadi va `rgb(var(--color-x) / <alpha>)`
 * shaklida ochiladi (tokens/colors.ts, tailwind.config.ts). Yangi rang kiritilmaydi (3.4-band).
 */
const VARIANT_CLASSES: Record<ToastVariant, string> = {
  neutral: 'text-text-primary',
  success: 'bg-success-surface text-success',
  danger: 'bg-danger-surface text-danger',
};

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  /** Chapdagi 20px ikona — ixtiyoriy. */
  icon?: LucideIcon;
  /** Berilsa, `durationMs` tugagach chaqiriladi. */
  onDismiss?: () => void;
  durationMs?: number;
  className?: string;
}

export function Toast({
  message,
  variant = 'neutral',
  icon,
  onDismiss,
  durationMs = TOAST_DURATION_MS,
  className,
}: ToastProps) {
  useEffect(() => {
    if (!onDismiss) return;
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // Pastdan masofa: tab bar 56 + home indicator 34 + 12 (9.25 va 6.1-band).
        'absolute inset-x-20 bottom-[calc(56px_+_34px_+_12px)] z-50',
        // Fon har doim `surface-elevated` — variant tusi uning ustiga qoʻyiladi,
        // shunda toast kontent ustida shaffof boʻlib qolmaydi.
        'overflow-hidden rounded-sm bg-surface-elevated shadow-e3',
        className,
      )}
    >
      <div className={cn('flex h-[48px] items-center gap-8 px-16', VARIANT_CLASSES[variant])}>
        {icon && <Icon icon={icon} size={20} />}
        <span className="truncate text-body-sm">{message}</span>
      </div>
    </div>
  );
}
