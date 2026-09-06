import { User } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { Icon, type IconSize } from './Icon';

/**
 * Avatar.
 *
 * Uch variant: `photo` (haqiqiy rasm), `initial` (ism bosh harfi) va `icon`
 * (neytral shaxs ikonasi). Variant avtomatik tanlanadi — rasm bor boʻlsa rasm,
 * yoʻq boʻlsa harf, ism ham yoʻq boʻlsa ikona. Shu tufayli ekranlar rasm
 * bor-yoʻqligini tekshirmaydi va bir usta rasmsiz boʻlsa ham roʻyxat buzilmaydi.
 *
 * Shakl: `circle` (odatiy) yoki `square` — referens maketdagi tavsiya
 * kartalarida foto yumaloqlangan kvadrat koʻrinishida.
 */
export type AvatarSize = 36 | 44 | 48 | 56 | 64 | 80 | 120;

export type AvatarVariant = 'photo' | 'initial' | 'icon';

export type AvatarShape = 'circle' | 'square';

/** Har bir avatar oʻlchamiga mos ikona oʻlchami (6.4-band shkalasi ichida). */
const ICON_SIZE: Record<AvatarSize, IconSize> = {
  36: 20,
  44: 24,
  48: 24,
  56: 28,
  64: 32,
  80: 40,
  120: 64,
};

const VARIANT_CLASSES: Record<AvatarVariant, string> = {
  photo: 'bg-surface-sunken',
  initial: 'bg-primary-surface text-primary-pressed ring-1 ring-inset ring-primary/[0.24] shadow-e1',
  icon: 'bg-surface-sunken text-text-secondary',
};

const SHAPE_CLASSES: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  square: 'rounded-md',
};

export interface AvatarProps {
  /** Ism boʻlsa bosh harfi chiziladi; boʻlmasa neytral shaxs ikonasi (8.3-band). */
  name?: string | null;
  /** Ilova ichiga joylangan rasm. Berilsa harf oʻrniga rasm chiziladi. */
  src?: string | null;
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Variantni majburan belgilash; berilmasa `src`/`name` boʻyicha aniqlanadi. */
  variant?: AvatarVariant;
  className?: string;
}

export function Avatar({
  name,
  src,
  size = 44,
  shape = 'circle',
  variant,
  className,
}: AvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase() ?? '';
  const resolvedVariant: AvatarVariant = variant ?? (src ? 'photo' : initial ? 'initial' : 'icon');

  return (
    <span
      // Ism yonidagi matnda takrorlanadi, shuning uchun avatar dekorativ.
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden',
        SHAPE_CLASSES[shape],
        VARIANT_CLASSES[resolvedVariant],
        className,
      )}
    >
      {resolvedVariant === 'photo' && src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : resolvedVariant === 'initial' ? (
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
