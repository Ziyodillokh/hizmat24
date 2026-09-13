import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Chiziqli (dashed) neytral chip — "Demo · …" va "Tez orada" belgisi.
 *
 * Bitta til: ishlamaydigan yoki namunaviy narsa ilovaning HAMMA joyida shu
 * koʻrinishda. Chip `span` — bajaradigan amali yoʻq, tugma emas. Ikki oʻlcham:
 * `default` 32px (sahifa boʻlimi ostida yolgʻiz turadi), `compact` 24px
 * (sarlavha yoki qator yonida, matn qatoriga sigʻishi kerak).
 */
export interface DashedChipProps {
  size?: 'default' | 'compact';
  className?: string;
  children: ReactNode;
}

const SIZE_CLASSES: Record<NonNullable<DashedChipProps['size']>, string> = {
  default: 'h-[32px] px-12',
  compact: 'h-[24px] px-8',
};

export function DashedChip({ size = 'default', className, children }: DashedChipProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-dashed border-border-strong text-caption text-text-secondary',
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
