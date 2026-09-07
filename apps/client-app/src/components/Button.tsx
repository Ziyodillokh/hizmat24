import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
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

/**
 * Bosilganda FILL ham, SIYOH ham almashadi. Ilgari faqat fon toʻqlashardi va
 * `on-primary` (#04302F) `primary-pressed` (#0B7C7B) ustida 2,85:1 berardi —
 * yaʼni tugma bosilgan zahoti OʻQILMAYDIGAN boʻlib qolardi. Oq siyoh 5,02:1.
 */
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary shadow-primary-lift active:bg-primary-pressed active:text-on-primary-deep active:shadow-e1',
  secondary: 'bg-transparent text-primary border-[1.5px] border-primary active:bg-primary/10',
  ghost: 'bg-transparent text-primary active:bg-primary/10',
  destructive:
    'bg-danger-fill text-on-primary-deep shadow-danger-lift active:opacity-90 active:shadow-e1',
  'destructive-outline':
    'bg-transparent text-danger border-[1.5px] border-danger active:bg-danger/10',
};

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: 'default' | 'small';
  /** Yuklanish holati: spinner + matn; tugma kengligi OʻZGARMAYDI. */
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  leadingIcon?: IconGlyph;
  /**
   * Yorliqdan keyingi ikona. Ikonani `children` ichiga qoʻyib boʻlmaydi:
   * yorliq matni oʻralishi mumkin boʻlgan `span` ichida turadi va ikona
   * matndan ajralib, alohida qatorga tushib ketardi.
   */
  trailingIcon?: IconGlyph;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'default',
  loading = false,
  loadingLabel = 'Yuborilmoqda…',
  fullWidth = true,
  leadingIcon,
  trailingIcon,
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
        'inline-flex items-center justify-center gap-8',
        'transition-[transform,background-color,color,box-shadow] duration-press ease-emphasized',
        'active:scale-[0.97] disabled:active:scale-100',
        // `min-h`: uzun oʻzbekcha yorliq ikki satrga sigʻsa tugma oʻssin,
        // matn kesilmasin.
        size === 'default'
          ? 'min-h-[52px] rounded-md px-20 py-12 text-button'
          : 'min-h-[36px] rounded-xs px-16 py-8 text-button-sm',
        fullWidth && 'w-full',
        VARIANT_CLASSES[variant],
        // Disabled har doim bir xil koʻrinadi — variantdan qatʼi nazar (9.1-band).
        // Oʻchirilgan holat: ilgari `border-strong/[0.38]` toʻldirilgan kulrang
        // plastinka edi va yorligʻi 2,05:1 — boʻsh quti boʻlib koʻrinardi.
        isDisabled &&
          'border border-border bg-surface-sunken text-text-disabled shadow-none active:bg-surface-sunken active:text-text-disabled active:shadow-none',
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
          {/* `truncate` EMAS: uzun oʻzbekcha chaqiriq ("Qoʻllab-quvvatlashga
              murojaat") 360px ekranda uch nuqta bilan kesilardi. */}
          <span className="text-center leading-tight">{children}</span>
          {trailingIcon && <Icon icon={trailingIcon} size={20} />}
        </>
      )}
    </button>
  );
}
