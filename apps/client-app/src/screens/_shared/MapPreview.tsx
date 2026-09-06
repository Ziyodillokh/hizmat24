import { MapPin } from '@phosphor-icons/react';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';

/**
 * Mock xarita — haqiqiy xarita kutubxonasi ulanmagan, shuning uchun koʻcha
 * toʻri CSS bilan chiziladi. Yangi rang kiritilmaydi: faqat `surface-sunken`,
 * `border` va `border-strong` tokenlari (3.4-band).
 *
 * Uchta ekranda kerak (09, 10, 11, 23), shuning uchun bitta joyda —
 * takrorlanmasin.
 */
export interface MapPreviewProps {
  /** Toʻliq ekran (09) yoki karta ichidagi preview (10, 11, 23). */
  size?: 'preview' | 'full';
  /** 09-ekranda xarita yuklanayotganda yoki ruxsat yoʻq boʻlganda pin chizilmaydi. */
  showPin?: boolean;
  className?: string;
}

const GRID: Record<'preview' | 'full', { cols: string; cells: number; road: string }> = {
  preview: { cols: 'grid-cols-4 grid-rows-2', cells: 8, road: 'top-[62%]' },
  full: { cols: 'grid-cols-4 grid-rows-6', cells: 24, road: 'top-[38%]' },
};

/** Pin uchi xarita markazida turadi, shakli tepaga qarab oʻsadi. */
function CenterPin({ size }: { size: 32 | 48 }) {
  return (
    <Icon
      icon={MapPin}
      size={size}
      aria-hidden
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full text-primary"
    />
  );
}

export function MapPreview({ size = 'preview', showPin = true, className }: MapPreviewProps) {
  const grid = GRID[size];

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-sunken',
        size === 'preview' ? 'h-[120px] rounded-lg border border-border' : 'absolute inset-0',
        className,
      )}
    >
      <div aria-hidden className={cn('grid h-full w-full', grid.cols)}>
        {Array.from({ length: grid.cells }, (_, index) => (
          <span key={index} className="border-b border-r border-border" />
        ))}
      </div>

      {/* Asosiy koʻchalar — toʻr bir tekis panjara boʻlib qolmasligi uchun. */}
      <span aria-hidden className={cn('absolute left-0 h-4 w-full bg-border-strong', grid.road)} />
      {size === 'full' && (
        <span aria-hidden className="absolute left-[62%] top-0 h-full w-4 bg-border-strong" />
      )}

      {showPin && <CenterPin size={size === 'full' ? 48 : 32} />}
    </div>
  );
}
