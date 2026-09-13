import { PencilSimple } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';

/** Chek-qator: plitka/avatar, yorliq, qiymat, ixtiyoriy 44px amal tugmasi. `<Card className="divide-y divide-border py-4">` ichida ishlatiladi. */
export interface DetailRowProps {
  icon: IconGlyph;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  /** Ikona plitkasi oʻrniga (masalan usta avatari). */
  leading?: ReactNode;
  onAction?: () => void;
  actionIcon?: IconGlyph;
  actionLabel?: string;
  className?: string;
}

export function DetailRow({
  icon, label, value, detail, leading, onAction, actionIcon = PencilSimple, actionLabel, className,
}: DetailRowProps) {
  return (
    <div className={cn('flex items-start gap-12 py-12', className)}>
      {leading ?? (
        <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md bg-primary-surface text-primary-pressed" aria-hidden>
          <Icon icon={icon} size={20} weight="duotone" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-caption text-text-secondary">{label}</p>
        <p className="mt-2 break-words text-body text-text-primary">{value}</p>
        {detail && <p className="mt-2 text-body-sm text-text-secondary">{detail}</p>}
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          aria-label={actionLabel ?? `${label}ni oʻzgartirish`}
          className="-my-8 -mr-8 flex h-touch w-touch shrink-0 items-center justify-center rounded-full text-primary transition-colors duration-press ease-std active:bg-surface-sunken"
        >
          <Icon icon={actionIcon} size={20} />
        </button>
      )}
    </div>
  );
}
