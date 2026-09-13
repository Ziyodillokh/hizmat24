import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Bosh sahifadagi 3×2 panjara kartasi (egasining maketi): oq karta, ichida
 * RASM KATAKCHASI va ostida ikki satrgacha yorliq.
 *
 * Katakcha balandligi QATʼIY (kvadrat emas): 3 ustunda kvadrat katakcha
 * 85px boʻlib, 360×730 da ikki boʻlim birinchi ekranga sigʻmasdi.
 * Xizmat fotolari repoda yoʻq — hozircha vektor glif; `imageUrl` berilsa
 * glif oʻrniga foto chiziladi va layout oʻzgarmaydi.
 *
 * Yorliqda `min-h` bor (ServiceGroupTile dan farqli): bu yerda kartalar
 * quti, bir satrli "Barcha xizmatlar" qoʻshnisidan past boʻlmasligi kerak.
 */
export type ServiceTileTone = 'default' | 'neutral';

export interface ServiceTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  icon: IconGlyph;
  /** Haqiqiy xizmat fotosi (egasi bergach). Berilsa glif chizilmaydi. */
  imageUrl?: string | null;
  /** `neutral` — xizmat emas, roʻyxatga yoʻl ("Barcha xizmatlar"). */
  tone?: ServiceTileTone;
}

export function ServiceTile({
  label,
  icon,
  imageUrl,
  tone = 'default',
  className,
  type = 'button',
  ...rest
}: ServiceTileProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex w-full flex-col items-stretch rounded-md border border-transparent bg-surface-elevated p-8 text-center shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        'transition-transform duration-press ease-emphasized active:scale-[0.97]',
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          'flex h-[56px] w-full items-center justify-center overflow-hidden rounded-sm',
          '[@media(max-height:800px)]:h-[36px]',
          tone === 'neutral'
            ? 'bg-neutral-surface text-text-secondary'
            : 'bg-primary-surface text-accent-water',
        )}
        aria-hidden
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <Icon
            icon={icon}
            size={28}
            weight="duotone"
            className="[@media(max-height:800px)]:h-[24px] [@media(max-height:800px)]:w-[24px]"
          />
        )}
      </span>
      {/* min-h = 2 × body-sm satr (1.1875rem) — har ikki root oʻlchamida aniq. */}
      <span className="mt-4 line-clamp-2 min-h-[2.375rem] w-full text-balance text-body-sm text-text-primary">
        {label}
      </span>
    </button>
  );
}
