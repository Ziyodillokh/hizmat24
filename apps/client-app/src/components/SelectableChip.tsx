import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Tanlanadigan chip — spetsifikatsiya 9.27-bandi (28-ekrandagi bekor qilish
 * sabab chiplari). h=36, radius/full, padding 16px, matn `body-sm`.
 * default (1px `border`, `text-secondary`) · selected (2px `primary`,
 * `primary` 12% fon, `primary` matn) · pressed.
 */
export interface SelectableChipProps {
  selected?: boolean;
  onSelect: () => void;
  disabled?: boolean;
  /** Yorliq matni 8.2-band jadvalidan olinadi. */
  children: ReactNode;
  className?: string;
}

const STATE_CLASSES: Record<'default' | 'selected', string> = {
  default: 'border border-border text-text-secondary',
  selected: 'border-2 border-primary bg-primary/[0.12] text-primary',
};

export function SelectableChip({
  selected = false,
  onSelect,
  disabled = false,
  children,
  className,
}: SelectableChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'inline-flex h-[36px] items-center rounded-full px-16 text-body-sm',
        // pressed holati — bosilganda yengil siqilish (9.27-band).
        'transition-transform active:scale-[0.98] disabled:active:scale-100',
        STATE_CLASSES[selected ? 'selected' : 'default'],
        disabled && 'border-border text-text-disabled',
        className,
      )}
    >
      {children}
    </button>
  );
}
