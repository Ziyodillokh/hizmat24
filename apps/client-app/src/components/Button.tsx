import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

/**
 * Tugma — spetsifikatsiya 9.1-bandi.
 * h=52, radius/md, padding 20, matn `button`. `small`: h=36, radius/xs, `button-sm`.
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'destructive'
  | 'destructive-outline';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary active:bg-primary-pressed',
  secondary: 'bg-transparent text-primary border-[1.5px] border-primary active:bg-primary/10',
  ghost: 'bg-transparent text-primary active:bg-primary/10',
  destructive: 'bg-danger-fill text-on-primary-deep active:opacity-90',
  'destructive-outline':
    'bg-transparent text-danger border-[1.5px] border-danger active:bg-danger/10',
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: 'default' | 'small';
  /** Yuklanish holati: spinner + matn; tugma kengligi O'ZGARMAYDI. */
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  leadingIcon?: LucideIcon;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  loadingLabel = 'Yuborilmoqda…',
  fullWidth = true,
  leadingIcon,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-8 transition-transform',
        'active:scale-[0.98] disabled:active:scale-100',
        size === 'default' ? 'h-[52px] rounded-md px-20 text-button' : 'h-[36px] rounded-xs px-16 text-button-sm',
        fullWidth && 'w-full',
        VARIANT_CLASSES[variant],
        // Disabled har doim bir xil ko'rinadi — variantdan qat'i nazar (9.1-band).
        isDisabled && 'bg-border-strong/[0.38] text-text-disabled border-transparent active:bg-border-strong/[0.38]',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <>
          <Spinner size={20} className="text-current" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          {leadingIcon && <Icon icon={leadingIcon} size={20} />}
          <span className="truncate">{children}</span>
        </>
      )}
    </button>
  );
}
