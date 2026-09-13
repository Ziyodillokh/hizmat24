import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Bosh sahifadagi xizmat kartasi — gorizontal tasmada: oq karta, ichida
 * RASM KATAKCHASI va ostida ikki satrgacha yorliq.
 *
 * Nega tasma, panjara emas: egasining maketi 3×2 panjara edi, lekin u
 * telefonda sigʻmadi — status bar spaceri bilan ikki boʻlimga ~384px qoladi,
 * panjara oʻzi 195px olardi va sahifa scroll boʻlib qolgan edi. Tasma bitta
 * qator (≈120px), rasm katakchasi esa uch barobar katta — foto uchun joy.
 *
 * Xizmat fotolari repoda hali yoʻq — hozircha vektor glif; `imageUrl`
 * berilsa glif oʻrniga foto chiziladi va layout oʻzgarmaydi.
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
        'flex w-[124px] shrink-0 flex-col items-stretch rounded-md border border-transparent bg-surface-elevated p-8 text-center shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        'transition-transform duration-press ease-emphasized active:scale-[0.97]',
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          'flex h-[80px] w-full items-center justify-center overflow-hidden rounded-sm',
          '[@media(max-height:800px)]:h-[64px]',
          tone === 'neutral'
            ? 'bg-neutral-surface text-text-secondary'
            : 'bg-primary-surface text-accent-water',
        )}
        aria-hidden
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <Icon icon={icon} size={32} weight="duotone" />
        )}
      </span>
      {/* min-h = 2 × body-sm satr (1.1875rem) — har ikki root oʻlchamida aniq. */}
      <span className="mt-4 line-clamp-2 min-h-[2.375rem] w-full text-balance text-body-sm text-text-primary">
        {label}
      </span>
    </button>
  );
}
