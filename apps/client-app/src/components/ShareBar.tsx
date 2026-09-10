import { cn } from '@/lib/cn';

/**
 * Ulush chizigʻi — butundan qancha ulush ekanini koʻrsatadi.
 *
 * Nega `ProgressBar` EMAS: u JARAYON semantikasiga ega (`role="progressbar"`,
 * `aria-label` "Bajarilish darajasi") va 92% bilan cheklangan — yetib kelish
 * vaqti hech qachon toʻlmasligi uchun ataylab. Ulush esa jarayon emas: eng
 * katta soha shkalani belgilaydi, demak u 100% ga YETISHI shart. Ikki maʼnoni
 * bitta komponentga boolean prop bilan tiqish — ikkalasini ham buzish.
 *
 * `aria-hidden`: yonidagi summa maʼnoni toʻliq tashiydi, chiziq esa uni faqat
 * takrorlaydi.
 */
export interface ShareBarProps {
  /** 0…100. Diapazondan tashqari qiymat kesiladi. */
  value: number;
  className?: string;
}

export function ShareBar({ value, className }: ShareBarProps) {
  const percent = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

  return (
    <span
      aria-hidden
      className={cn('block h-[6px] w-full overflow-hidden rounded-full bg-border', className)}
    >
      <span style={{ width: `${percent}%` }} className="block h-full rounded-full bg-primary" />
    </span>
  );
}
