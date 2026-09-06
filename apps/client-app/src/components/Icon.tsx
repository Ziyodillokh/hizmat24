import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Ikona o'ramchisi — spetsifikatsiya 6.4-bandi.
 * Faqat outline (lucide), fill yo'q, round cap/join.
 * Stroke o'lchamga bog'liq: 20px → 1.5 · 24px → 1.75 · 28px → 2.
 */
export type IconSize = 14 | 16 | 20 | 24 | 28 | 32 | 40 | 48 | 64 | 72 | 96 | 120;

const STROKE_BY_SIZE: Partial<Record<IconSize, number>> = { 20: 1.5, 24: 1.75, 28: 2 };

export interface IconProps {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  'aria-hidden'?: boolean;
}

export function Icon({ icon: Glyph, size = 24, className, ...rest }: IconProps) {
  return (
    <Glyph
      size={size}
      strokeWidth={STROKE_BY_SIZE[size] ?? 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      {...rest}
    />
  );
}
