import { Shield } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Badge — spetsifikatsiya 9.12-bandi.
 * h=24, radius/full, padding 10px, matn 11/14/600.
 * "Sertifikatli" — `primary` 14% fon + 14px shield ikona.
 *
 * «Yangi» va «Tajribali» yorliqlari 2026-09-22 da OLIB TASHLANDI. Usta
 * roʻyxatdan oʻtishda tajriba darajasi soʻralmaydi (platforma faqat
 * santexnikaga qaratildi), demak har bir ustada «Yangi» chiqib turardi —
 * yigirma yillik ustaga ham. Platforma bilmaydigan narsani yorliq qilib
 * chizish — toʻqilgan maʼlumot.
 */
export type BadgeVariant = 'certified';

/** Yorliqlar 8.2-jadvaldan olinadi — boshqa matn ishlatilmaydi. */
const VARIANT_LABELS: Record<BadgeVariant, string> = {
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
