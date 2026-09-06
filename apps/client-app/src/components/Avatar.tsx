import { User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon, type IconSize } from './Icon';

/**
 * Avatar — spetsifikatsiya 9.28-bandi.
 * Oʻlchamlar: 44 (header, karta) · 64 (usta kartasi) · 80 (profil) · 120 (usta profili).
 * `radius/full`. Variantlar: `initial` (ism bosh harfi) va `icon` (neytral shaxs ikonasi).
 * `image` varianti chizilmaydi — rasm maydoni mavjud emas (14.4-band, 34-punkt).
 */
export type AvatarSize = 44 | 64 | 80 | 120;

export type AvatarVariant = 'initial' | 'icon';

/** Har bir avatar oʻlchamiga mos ikona oʻlchami (6.4-band shkalasi ichida). */
const ICON_SIZE: Record<AvatarSize, IconSize> = { 44: 24, 64: 32, 80: 40, 120: 64 };

const VARIANT_CLASSES: Record<AvatarVariant, string> = {
  initial: 'bg-primary-surface text-primary-pressed ring-1 ring-inset ring-primary/[0.24] shadow-e1',
  icon: 'bg-surface-sunken text-text-secondary',
};

export interface AvatarProps {
  /** Ism boʻlsa bosh harfi chiziladi; boʻlmasa neytral shaxs ikonasi (8.3-band). */
  name?: string | null;
  size?: AvatarSize;
  /** Variantni majburan belgilash; berilmasa `name` boʻyicha aniqlanadi. */
  variant?: AvatarVariant;
  className?: string;
}

export function Avatar({ name, size = 44, variant, className }: AvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase() ?? '';
  const resolvedVariant: AvatarVariant = variant ?? (initial ? 'initial' : 'icon');

  return (
    <span
      // Ism yonidagi matnda takrorlanadi, shuning uchun avatar dekorativ.
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        VARIANT_CLASSES[resolvedVariant],
        className,
      )}
    >
      {resolvedVariant === 'initial' ? (
        /*
         * Harf oʻlchami diskning 40% i. Ilgari u AYNAN yarmi edi — matematik
         * hosila, optik qaror emas: haqiqiy bosh-harf avatarlarida nisbat
         * 0,38-0,42 atrofida boʻladi, 0,5 esa harfni diskka tiqilib qolgandek
         * koʻrsatadi.
         */
        <span
          style={{
            fontSize: Math.round(size * 0.4),
            fontWeight: 700,
            letterSpacing: '0.01em',
            lineHeight: 1,
          }}
        >
          {initial}
        </span>
      ) : (
        <Icon icon={User} size={ICON_SIZE[size]} />
      )}
    </span>
  );
}
