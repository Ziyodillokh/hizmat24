import type { Icon as IconGlyph, IconWeight } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

/**
 * Ikona oʻramchisi.
 *
 * Oila — Phosphor. Undan oldin lucide ishlatilardi: bitta ingichka outline
 * uslubi, oʻlchamga qarab shtrix kengligini qoʻlda sozlash talab qilinardi
 * va katta oʻlchamlarda glif "blueprint" boʻlib koʻrinardi. Phosphor oltita
 * OGʻIRLIK beradi va shtrix oʻlchamga bogʻliq emas — optik ogʻirlik barcha
 * oʻlchamda barqaror.
 */
export type IconSize = 14 | 16 | 20 | 24 | 28 | 32 | 40 | 48 | 64 | 72 | 96 | 120;

export interface IconProps {
  icon: IconGlyph;
  size?: IconSize;
  /**
   * `duotone` — tusli plitka ichidagi ikonalar uchun: ikkinchi qatlam
   * `currentColor` ning 20% i bilan chiziladi va glif tekis kontur emas,
   * hajmli shakl boʻlib koʻrinadi.
   * `fill` — aktiv holat uchun (pastki navigatsiya).
   */
  weight?: IconWeight;
  className?: string;
  'aria-hidden'?: boolean;
}

export function Icon({ icon: Glyph, size = 24, weight = 'regular', className, ...rest }: IconProps) {
  return <Glyph size={size} weight={weight} className={cn('shrink-0', className)} {...rest} />;
}
