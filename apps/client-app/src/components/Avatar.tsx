import { User } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon, type IconSize } from './Icon';

/**
 * Avatar — spetsifikatsiya 9.28-bandi.
 * O'lchamlar: 44 (header, karta) · 64 (usta kartasi) · 80 (profil) · 120 (usta profili).
 * `radius/full`. Variantlar: `initial` (ism bosh harfi) va `icon` (neytral shaxs ikonasi).
 * `image` varianti chizilmaydi — rasm maydoni mavjud emas (14.4-band, 34-punkt).
 */
export type AvatarSize = 44 | 64 | 80 | 120;

export type AvatarVariant = 'initial' | 'icon';

/** Har bir avatar o'lchamiga mos ikona o'lchami (6.4-band shkalasi ichida). */
const ICON_SIZE: Record<AvatarSize, IconSize> = { 44: 24, 64: 32, 80: 40, 120: 64 };

const VARIANT_CLASSES: Record<AvatarVariant, string> = {
  initial: 'bg-primary text-on-primary',
  icon: 'bg-surface-sunken text-text-secondary',
};

export interface AvatarProps {
  /** Ism bo'lsa bosh harfi chiziladi; bo'lmasa neytral shaxs ikonasi (8.3-band). */
  name?: string | null;
  size?: AvatarSize;
  /** Variantni majburan belgilash; berilmasa `name` bo'yicha aniqlanadi. */
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
        // 9.28-band: shrift = o'lcham/2, weight 600 — tipografika shkalasidan
        // tashqaridagi hosila qiymat, shuning uchun inline style bilan beriladi.
        <span style={{ fontSize: size / 2, lineHeight: 1, fontWeight: 600 }}>{initial}</span>
      ) : (
        <Icon icon={User} size={ICON_SIZE[size]} />
      )}
    </span>
  );
}
