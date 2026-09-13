import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Bosh sahifadagi 3×2 panjara kartasi (egasining maketi): oq karta, ichida
 * RASM va ostida ikki satrgacha yorliq.
 *
 * Rasm — egasi bergan haqiqiy foto (`SERVICE_IMAGES`), yoʻq boʻlsa soha
 * ikonasi och koʻk katakchada — layout ikkalasida bir xil.
 *
 * Balandlik byudjeti: telefonda status bar spaceri bilan ikki boʻlimga
 * ~390px qoladi. Ixcham rejimda (≤800px) rasm 16:9 va karta 4px hoshiyali —
 * panjara 200px; oddiy rejimda rasm 3:2 (manba nisbati) va 8px hoshiya.
 */
export type ServiceTileTone = 'default' | 'neutral';

export interface ServiceTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  icon: IconGlyph;
  /** Haqiqiy xizmat fotosi. Berilsa glif chizilmaydi. */
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
        '[@media(max-height:800px)]:p-4',
        'transition-transform duration-press ease-emphasized active:scale-[0.97]',
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          'flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-sm',
          '[@media(max-height:800px)]:aspect-[16/9]',
          tone === 'neutral'
            ? 'bg-neutral-surface text-text-secondary'
            : 'bg-primary-surface text-accent-water',
        )}
        aria-hidden
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <Icon icon={icon} size={32} weight="duotone" />
        )}
      </span>
      {/* min-h = 2 × body-sm satr (1.1875rem) — bir satrli "Barcha xizmatlar"
          qoʻshnisidan past boʻlmasin. */}
      <span className="mt-4 line-clamp-2 min-h-[2.375rem] w-full text-balance text-body-sm text-text-primary">
        {label}
      </span>
    </button>
  );
}
