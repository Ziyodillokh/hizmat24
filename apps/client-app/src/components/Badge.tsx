import { Shield } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Badge — spetsifikatsiya 9.12-bandi.
 * h=24, radius/full, padding 10px, matn 11/14/600.
 * "Yangi" — `border-strong` fon · "Tajribali" — `success` 14% fon ·
 * "Sertifikatli" — `primary` 14% fon + 14px shield ikona.
 */
export type BadgeVariant = 'new' | 'experienced' | 'certified';

/** Yorliqlar 8.2-jadvaldan olinadi — boshqa matn ishlatilmaydi. */
const VARIANT_LABELS: Record<BadgeVariant, string> = {
  new: 'Yangi',
  experienced: 'Tajribali',
  certified: 'Sertifikatli',
};

/**
 * 9.12-band: fon — tokenning 14% shaffofligi.
 *
 * Shaffoflik Tailwindʼning standart `/[0.NN]` modifikatori orqali beriladi:
 * rang tokenlari RGB kanallari sifatida saqlanadi va `rgb(var(--color-x) / <alpha>)`
 * shaklida ochiladi (tokens/colors.ts, tailwind.config.ts). Yangi rang kiritilmaydi (3.4-band).
 *
 * Klass nomlari toʻliq yozilgan — Tailwind kontentni matn sifatida skanerlaydi,
 * shuning uchun bu satrlarni funksiya bilan yigʻish mumkin emas.
 */
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  new: 'bg-border-strong text-text-secondary',
  experienced: 'bg-neutral-surface text-text-secondary',
  certified: 'bg-primary-surface text-primary-pressed',
};

export interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

export function Badge({ variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[28px] items-center gap-8 rounded-full px-12',
        // Matn 11/14/600 — bu oʻlcham/qalinlik shkalada faqat `overline` da bor,
        // lekin badge CAPS emas, shuning uchun tracking nolga qaytariladi (9.12-band).
        'text-badge',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {variant === 'certified' && <Icon icon={Shield} size={14} />}
      {VARIANT_LABELS[variant]}
    </span>
  );
}
