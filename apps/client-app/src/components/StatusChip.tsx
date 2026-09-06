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

export interface StatusChipProps {
  status: OrderStatus;
  className?: string;
}

export function StatusChip({ status, className }: StatusChipProps) {
  const { label, tone } = STATUS_CHIPS[status];
  const classes = TONE_CLASSES[tone];

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
