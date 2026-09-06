import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Ikona oʻramchisi — spetsifikatsiya 6.4-bandi.
 * Faqat outline (lucide), fill yoʻq, round cap/join.
 * Stroke oʻlchamga bogʻliq: 20px → 1.5 · 24px → 1.75 · 28px → 2.
 */
export type IconSize = 14 | 16 | 20 | 24 | 28 | 32 | 40 | 48 | 64 | 72 | 96 | 120;

/**
 * Lucide `viewBox="0 0 24 24"` ni saqlaydi, yaʼni `strokeWidth` QUTI bilan
 * birga masshtablanadi: 96px da 1.75 — bu 7px lik shtrix. Shuning uchun katta
 * ikonalarda qiymat kamayishi, kichiklarida esa oshishi kerak.
 *
 * Ilgari jadval {20:1.5, 24:1.75, 28:2} edi va qolganiga 1.75 tushardi —
 * natijada 32px ikona 28px likdan INGICHKA chizilib, ogʻirlik rampasi
 * teskari yoʻnalishda ketardi.
 *
 * Chizilgan shtrix = strokeWidth × (size / 24).
 */
const STROKE_BY_SIZE: Record<IconSize, number> = {
  14: 2.5,
  16: 2.25,
  20: 1.9,
  24: 1.75,
  28: 1.7,
  32: 1.6,
  40: 1.4,
  48: 1.25,
  64: 1.0,
  72: 0.95,
  96: 0.75,
  120: 0.65,
};

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
      strokeWidth={STROKE_BY_SIZE[size]}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      {...rest}
    />
  );
}
