import { Star } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { formatRating } from '@/lib/formatters';
import { Icon, type IconSize } from './Icon';

/**
 * Yulduzli reyting — spetsifikatsiya 9.11-bandi.
 * Read-only: roʻyxatda 14px (`sm`), usta profilida 18px (`md`).
 * Interaktiv (19-ekran): 40px (`lg`), oraliq 8px.
 * Toʻldirilgan = `star`, boʻsh = `star-empty` — ikkalasi ham TOʻLDIRILGAN, kontur emas.
 */
export type StarRatingSize = 'sm' | 'md' | 'lg';

const MAX_STARS = 5;

const STAR_VALUES = [1, 2, 3, 4, 5];

/**
 * `md` uchun 18px kerak, lekin Icon shkalasida 18 yoʻq (6.4-band) — shuning uchun
 * eng yaqin shkala qiymati beriladi va aniq oʻlcham klass orqali qotiriladi.
 */
const SIZE_CLASSES: Record<StarRatingSize, { icon: IconSize; box: string; gap: string }> = {
  sm: { icon: 14, box: '', gap: 'gap-2' },
  md: { icon: 20, box: 'h-[18px] w-[18px]', gap: 'gap-2' },
  lg: { icon: 40, box: '', gap: 'gap-4' },
};

export interface StarRatingProps {
  /** Reyting qiymati (0–5). Interaktiv rejimda — tanlangan yulduzlar soni. */
  value: number;
  size?: StarRatingSize;
  /** Reyting raqamini yulduzlar yonida koʻrsatish (faqat read-only rejimda). */
  showValue?: boolean;
  /** Berilsa komponent interaktiv boʻladi (19-ekran, 40px yulduzlar). */
  onChange?: (value: number) => void;
  className?: string;
}

export function StarRating({ value, size = 'sm', showValue = false, onChange, className }: StarRatingProps) {
  const { icon, box, gap } = SIZE_CLASSES[size];
  const filledCount = Math.round(value);

  const renderStar = (star: number) => (
    <Icon
      key={star}
      icon={Star}
      size={icon}
      // Boʻsh yulduz ham TOʻLDIRILGAN, faqat rangi boshqa (9.11-band).
      // Phosphor'da toʻldirish `fill-current` utilitasi bilan emas, ogʻirlik
      // orqali beriladi — aks holda glif ikki qatlam boʻlib chiziladi.
      weight="fill"
      className={cn(box, star <= filledCount ? 'text-star' : 'text-star-empty')}
    />
  );

  if (onChange) {
    return (
      <div role="radiogroup" className={cn('inline-flex items-center', gap, className)}>
        {STAR_VALUES.map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === filledCount}
            aria-label={`${star} yulduz`}
            onClick={() => onChange(star)}
            // p-2 bilan teginish maydoni 44x44 boʻladi, yulduzlar orasidagi
            // koʻrinadigan oraliq esa 8px boʻlib qoladi (6.1 va 9.11-bandlar).
            className="inline-flex p-2 transition-transform active:scale-[0.92]"
          >
            {renderStar(star)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <span
      className={cn('inline-flex items-center', className)}
      aria-label={`${MAX_STARS} balldan ${formatRating(value)}`}
    >
      <span className={cn('inline-flex items-center', gap)} aria-hidden>
        {STAR_VALUES.map(renderStar)}
      </span>
      {/* Reyting raqami yulduz rangida EMAS — `text-primary` (9.11-band). */}
      {showValue && <span className="ml-4 text-numeric-sm text-text-primary">{formatRating(value)}</span>}
    </span>
  );
}
