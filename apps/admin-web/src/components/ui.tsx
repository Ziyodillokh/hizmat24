import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

/**
 * Panelning asosiy qurilish bloklari.
 *
 * Ular bitta faylda turadi: har biri oʻn qatordan kam va alohida fayllarga
 * boʻlinsa, import qatorlari komponentlarning oʻzidan uzun boʻlib qolardi.
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-pressed',
  secondary:
    'bg-surface-elevated text-text-primary border border-border hover:border-border-strong',
  ghost: 'text-text-secondary hover:bg-neutral-surface hover:text-text-primary',
  danger: 'bg-danger text-on-primary hover:opacity-90',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex h-40 items-center justify-center gap-8 rounded-md px-20 text-body-strong',
        'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        fullWidth && 'w-full',
        BUTTON_STYLES[variant],
        className,
      )}
    >
      {loading ? 'Kuting…' : children}
    </button>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | null;
}

export function Field({ label, hint, error, className, id, ...rest }: FieldProps) {
  const inputId = id ?? `field-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor={inputId} className="text-caption-strong text-text-secondary">
        {label}
      </label>
      <input
        id={inputId}
        {...rest}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={clsx(
          'h-40 rounded-md border bg-surface-elevated px-12 text-body text-text-primary',
          'placeholder:text-text-disabled',
          error ? 'border-danger' : 'border-border',
          className,
        )}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-caption text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="text-caption text-text-secondary">{hint}</p>
      ) : null}
    </div>
  );
}

export const Card = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div
    className={clsx(
      'rounded-lg border border-border bg-surface-elevated shadow-e1',
      className,
    )}
  >
    {children}
  </div>
);

type ToneName = 'success' | 'warning' | 'danger' | 'neutral';

const TONE_STYLES: Record<ToneName, string> = {
  success: 'bg-success-surface text-success',
  warning: 'bg-warning-surface text-warning',
  danger: 'bg-danger-surface text-danger',
  neutral: 'bg-neutral-surface text-text-secondary',
};

export const Pill = ({ tone = 'neutral', children }: { tone?: ToneName; children: ReactNode }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-8 py-2 text-caption-strong',
      TONE_STYLES[tone],
    )}
  >
    {children}
  </span>
);

/** Xato — hech qachon jim yutilmaydi, har doim matn bilan koʻrsatiladi. */
export const Notice = ({ tone = 'danger', children }: { tone?: ToneName; children: ReactNode }) => (
  <div className={clsx('rounded-md px-12 py-8 text-body', TONE_STYLES[tone])} role="alert">
    {children}
  </div>
);

export const PageTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <header className="mb-24">
    <h1 className="text-h1 text-text-primary">{title}</h1>
    {subtitle && <p className="mt-4 text-body text-text-secondary">{subtitle}</p>}
  </header>
);
