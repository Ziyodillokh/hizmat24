import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Inline banner — spetsifikatsiya 9.18-bandi.
 * radius/sm, chapda 4px vertikal chiziq, fon = rang 12% opacity, padding 16px.
 */
export type BannerVariant = 'info' | 'warning' | 'danger';

/**
 * 9.18-band: fon = variant rangi 12% shaffoflikda.
 * Shaffoflik Tailwindʼning standart `/[0.NN]` modifikatori orqali beriladi:
 * rang tokenlari RGB kanallari sifatida saqlanadi va `rgb(var(--color-x) / <alpha>)`
 * shaklida ochiladi (tokens/colors.ts, tailwind.config.ts). Yangi rang kiritilmaydi (3.4-band).
 */
const VARIANT_CLASSES: Record<BannerVariant, { wrap: string; icon: string }> = {
  info: {
    wrap: 'border-primary bg-primary-surface',
    icon: 'text-primary',
  },
  warning: {
    wrap: 'border-warning bg-warning-surface',
    icon: 'text-warning',
  },
  danger: {
    wrap: 'border-danger bg-danger-surface',
    icon: 'text-danger',
  },
};

export interface BannerProps {
  variant?: BannerVariant;
  /** Chapdagi 20px ikona — ixtiyoriy, rangi variantdan olinadi. */
  icon?: IconGlyph;
  className?: string;
  children: ReactNode;
}

export function Banner({ variant = 'info', icon, className, children }: BannerProps) {
  const classes = VARIANT_CLASSES[variant];

  return (
    <div
      role="status"
      className={cn(
        // Chiziq chapda: 4px chegara, radius/sm.
        'flex gap-8 rounded-sm border-l-4 p-16 text-text-primary',
        classes.wrap,
        className,
      )}
    >
      {icon && <Icon icon={icon} size={20} className={classes.icon} />}
      <div className="text-body">{children}</div>
    </div>
  );
}
