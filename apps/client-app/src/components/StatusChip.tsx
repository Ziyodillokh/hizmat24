import { cn } from '@/lib/cn';
import { STATUS_CHIPS, type ChipTone, type OrderStatus } from '@/lib/orderStateMachine';

/**
 * Status chipi — spetsifikatsiya 9.9-bandi.
 * h=28, radius/full, padding 12, matn 12/16/500, chapda 6px nuqta.
 * Fon = rang 14% opacity, matn = toʻliq rang.
 */
const TONE_CLASSES: Record<ChipTone, { wrap: string; dot: string }> = {
  primary: { wrap: 'bg-primary-surface text-primary-pressed', dot: 'bg-primary' },
  warning: { wrap: 'bg-warning-surface text-warning', dot: 'bg-warning' },
  success: { wrap: 'bg-success-surface text-success', dot: 'bg-success' },
  danger: { wrap: 'bg-danger-surface text-danger', dot: 'bg-danger' },
  neutral: { wrap: 'bg-neutral-surface text-text-secondary', dot: 'bg-text-secondary' },
};

/** Faqat matn rangi — `inline` variantida fon chizilmaydi. */
const TONE_TEXT: Record<ChipTone, string> = {
  primary: 'text-primary-pressed',
  warning: 'text-warning',
  success: 'text-success',
  danger: 'text-danger',
  neutral: 'text-text-secondary',
};

export interface StatusChipProps {
  status: OrderStatus;
  /**
   * `inline` — fonsiz variant: nuqta + rangli matn.
   *
   * Roʻyxat qatorlarida toʻldirilgan tabletka nomdan koʻra baland kontrast
   * beradi va eʼtiborni oʻgʻirlaydi; har bir qatorda takrorlanganda esa
   * roʻyxat rang-barang boʻlib ketadi.
   */
  inline?: boolean;
  className?: string;
}

export function StatusChip({ status, inline = false, className }: StatusChipProps) {
  const { label, tone } = STATUS_CHIPS[status];
  const classes = TONE_CLASSES[tone];

  if (inline) {
    return (
      <span className={cn('inline-flex items-center gap-4 text-caption', TONE_TEXT[tone], className)}>
        <span className={cn('h-[6px] w-[6px] shrink-0 rounded-full', classes.dot)} aria-hidden />
        {label}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex h-[28px] items-center gap-8 rounded-full px-12 text-caption',
        classes.wrap,
        className,
      )}
    >
      <span className={cn('h-[6px] w-[6px] shrink-0 rounded-full', classes.dot)} aria-hidden />
      {label}
    </span>
  );
}
