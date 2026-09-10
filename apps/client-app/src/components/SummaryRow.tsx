import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Chek uslubidagi qator: chapda yorliq, oʻngda qiymat.
 *
 * `items-start` (`items-center` EMAS): uzun yorliq ikki satrga sinsa, raqam
 * yuqori satr bilan tekislanib qoladi. Yorliq `shrink-0`, qiymat `min-w-0
 * text-right` — uzun summa yorliqni siqmaydi, aksincha.
 *
 * Nuqtali yetakchi chiziq ("Xizmat ..... 150 000") YOʻQ: ilovada bunday
 * naqsh hech qayerda ishlatilmagan, chek hissini esa punktir AJRATKICH
 * beradi.
 */
export interface SummaryRowProps {
  label: string;
  /** Matn yoki kichik komponent (masalan yulduzli baho). */
  value: ReactNode;
  tone?: 'success' | 'muted';
  /** Identifikator (buyurtma raqami) uchun kengaytirilgan harf oraligʻi. */
  mono?: boolean;
  className?: string;
}

const TONE_CLASSES = {
  success: 'text-success',
  muted: 'text-text-secondary',
} as const;

export function SummaryRow({ label, value, tone, mono = false, className }: SummaryRowProps) {
  return (
    <div className={cn('flex items-start justify-between gap-16 py-12', className)}>
      <p className="shrink-0 text-body-sm text-text-secondary">{label}</p>
      <p
        className={cn(
          'tabular min-w-0 text-right text-body-lg',
          mono && 'tracking-[0.4px]',
          tone ? TONE_CLASSES[tone] : 'text-text-primary',
        )}
      >
        {value}
      </p>
    </div>
  );
}
