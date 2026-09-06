import { cn } from '@/lib/cn';

/**
 * Chiziqli progress bar — spetsifikatsiya 9.23-bandi.
 * h=6, radius/full, fon `border`, to'ldirish `primary`.
 */

/**
 * 15-ekran talabi: progress hech qachon 100% ko'rsatmaydi, chunki yetib kelish
 * vaqti taxminiy. Cheklov komponent ichida — chaqiruvchi tomon buni buzolmaydi.
 */
const MAX_PERCENT = 92;

/** Indeterminate blok kengligi (9.23-band). */
const INDETERMINATE_WIDTH = 'w-[30%]';

const clampPercent = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_PERCENT, Math.max(0, Math.round(value)));
};

export interface ProgressBarProps {
  /** 0–100 oralig'idagi qiymat; komponent ichida 92% bilan cheklanadi. */
  value?: number;
  /** Aniq foiz noma'lum bo'lganda — chapdan o'ngga suriluvchi blok. */
  indeterminate?: boolean;
  className?: string;
}

export function ProgressBar({ value = 0, indeterminate = false, className }: ProgressBarProps) {
  const percent = clampPercent(value);

  return (
    <div
      role="progressbar"
      aria-label="Bajarilish darajasi"
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : 100}
      aria-valuenow={indeterminate ? undefined : percent}
      className={cn('relative h-[6px] w-full overflow-hidden rounded-full bg-border', className)}
    >
      {indeterminate ? (
        <span
          aria-hidden
          className={cn(
            'absolute inset-y-0 left-0 animate-indeterminate rounded-full bg-primary',
            INDETERMINATE_WIDTH,
          )}
        />
      ) : (
        <span
          aria-hidden
          style={{ width: `${percent}%` }}
          className="block h-full rounded-full bg-primary transition-[width] duration-300"
        />
      )}
    </div>
  );
}
