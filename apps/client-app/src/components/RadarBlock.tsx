import { Headset, Radar, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Radar animatsiya bloki — spetsifikatsiya 9.29-bandi (12-ekran).
 * 88px doira, 3 ta kengayuvchi `primary` halqa, markazda 32px ikona.
 * `static` varianti — "Operator koʻrib chiqmoqda" holati uchun:
 * animatsiya yoʻq, 64px operator ikonasi.
 */
export type RadarVariant = 'animated' | 'static';

// Halqalar bir-biridan 0.6s siljish bilan boshlanadi (9.29-band).
const RING_DELAYS = ['0s', '0.6s', '1.2s'];

const ICON_SIZE: Record<RadarVariant, 32 | 64> = {
  animated: 32,
  static: 64,
};

const DEFAULT_ICON: Record<RadarVariant, LucideIcon> = {
  animated: Radar,
  static: Headset,
};

export interface RadarBlockProps {
  variant?: RadarVariant;
  /** Markaziy ikona; berilmasa variantga mos standart ikona olinadi. */
  icon?: LucideIcon;
  className?: string;
}

/**
 * Blok dekorativ: holat matni ("Usta qidirilmoqda…") yonidagi `h2` orqali
 * oʻqiladi, shuning uchun bu yerda `aria-hidden`.
 */
export function RadarBlock({ variant = 'animated', icon, className }: RadarBlockProps) {
  const centerIcon = icon ?? DEFAULT_ICON[variant];

  return (
    <div
      aria-hidden
      className={cn(
        'relative flex h-[88px] w-[88px] items-center justify-center rounded-full bg-primary/[0.12]',
        className,
      )}
    >
      {variant === 'animated' &&
        RING_DELAYS.map((delay) => (
          <span
            key={delay}
            // `backwards` — siljish (delay) davomida halqa birinchi kadr
            // qiymatlarini (scale 0.6, opacity 24%) ushlab turadi. Busiz halqa
            // kutish paytida toʻliq shaffofmas `primary` disk boʻlib koʻrinardi
            // va 9.29-banddagi 24% → 0% oraligʻi buzilardi.
            style={{ animationDelay: delay, animationFillMode: 'backwards' }}
            className="absolute inset-0 animate-radar-ping rounded-full bg-primary"
          />
        ))}
      <Icon icon={centerIcon} size={ICON_SIZE[variant]} className="relative text-primary" />
    </div>
  );
}
