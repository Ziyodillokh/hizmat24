import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Taymer/ma'lumot chipi — spetsifikatsiya 9.19-bandi.
 * h=32, radius/full, padding 12px, chapda 16px ikona, matn `body-sm`/600.
 * Ishlatilishi: "Taxminiy vaqt: 15 daqiqa", "~3-o'rin", "Shoshilinch".
 */
export type InfoChipTone = 'neutral' | 'primary' | 'warning';

// Fon = rang 14% opacity, matn = to'liq rang — status chipi bilan bir xil
// mexanizm (9.9-band), shuning uchun yangi rang kiritilmaydi.
const TONE_CLASSES: Record<InfoChipTone, string> = {
  neutral: 'bg-surface-sunken text-text-secondary',
  primary: 'bg-primary/[0.14] text-primary',
  warning: 'bg-warning/[0.14] text-warning',
};

export interface InfoChipProps {
  icon?: LucideIcon;
  tone?: InfoChipTone;
  /** Matn 8.2/8.5-bandlar bo'yicha formatlangan holda uzatiladi. */
  children: ReactNode;
  className?: string;
}

export function InfoChip({ icon, tone = 'neutral', children, className }: InfoChipProps) {
  return (
    <span
      className={cn(
        'inline-flex h-32 items-center gap-8 rounded-full px-12 text-body-sm font-semibold',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon && <Icon icon={icon} size={16} aria-hidden />}
      {children}
    </span>
  );
}
