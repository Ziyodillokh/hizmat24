import { cn } from '@/lib/cn';

/**
 * Segment control — spetsifikatsiya 9.22-bandi.
 * h=40, radius/full, fon `surface-sunken`. Tanlangan segment `surface-elevated`
 * + e1, matn `body-sm`/600 `text-primary`; tanlanmagan `text-secondary`/400.
 *
 * Qator HAR DOIM gorizontal scroll qiladi. Ilgari "4 tagacha segment sig'adi"
 * deb hisoblanardi va ular `flex-1` bilan cho'zilardi, lekin `whitespace-nowrap`
 * elementni o'z matnidan tor qila olmaydi: 390px ekranda "Barchasi · Aktiv ·
 * Yakunlangan · Bekor qilingan" qatori konteynerdan oshib ketib, oxirgi
 * segment kesilib qolardi. Yorliq uzunligi tilga bog'liq, shuning uchun
 * sig'ish-sig'masligini sanoq bo'yicha taxmin qilib bo'lmaydi.
 */
export interface SegmentOption<T extends string> {
  value: T;
  /** Yorliq matni 8.2-band jadvalidan olinadi. */
  label: string;
}

export interface SegmentControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentControlProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex h-40 items-stretch gap-2 rounded-full bg-surface-sunken p-2',
        // Scroll paneli ilovada ko'rinmaydi — u sahifa ritmini buzadi.
        'overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full px-16 text-body-sm transition-colors',
              isSelected
                ? 'bg-surface-elevated font-semibold text-text-primary shadow-e1'
                : 'text-text-secondary',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
