import { cn } from '@/lib/cn';

/**
 * Skeleton — spetsifikatsiya 9.20 va 12.1-bandlari.
 * Kontent shakli takrorlanadi: `surface-sunken` toʻldirish, `radius/xs`,
 * shimmer chapdan oʻngga. Roʻyxat va kontent yuklanishida faqat skeleton
 * ishlatiladi, spinner emas (12.1-band).
 */
export type SkeletonRadius = 'xs' | 'sm' | 'md' | 'lg' | 'full';

const RADIUS_CLASSES: Record<SkeletonRadius, string> = {
  xs: 'rounded-xs',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

// Shimmer gradienti `.skeleton-shimmer` klassida (src/styles/index.css),
// harakat esa `animate-shimmer` orqali keladi.
const SKELETON_BASE = 'block shrink-0 bg-surface-sunken skeleton-shimmer animate-shimmer';

export interface SkeletonProps {
  /** Raqam — piksel, satr — "100%" kabi tayyor CSS qiymati. */
  width?: number | string;
  height?: number | string;
  radius?: SkeletonRadius;
  className?: string;
}

/**
 * Skeleton elementi dekorativ — ekran darajasidagi "Yuklanmoqda…" xabari
 * oʻqiladi, shuning uchun bu yerda `aria-hidden`.
 */
export function Skeleton({ width = '100%', height = 12, radius = 'xs', className }: SkeletonProps) {
  return (
    <span
      aria-hidden
      style={{ width, height }}
      className={cn(SKELETON_BASE, RADIUS_CLASSES[radius], className)}
    />
  );
}

export interface SkeletonTextProps {
  lines?: number;
  /** Bitta satr balandligi (piksel). */
  lineHeight?: number;
  /** Oxirgi satr qisqaroq — haqiqiy matn oqimiga oʻxshaydi. */
  lastLineWidth?: string;
  className?: string;
}

export function SkeletonText({
  lines = 3,
  lineHeight = 12,
  lastLineWidth = '60%',
  className,
}: SkeletonTextProps) {
  return (
    <span className={cn('flex flex-col gap-8', className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={lines > 1 && index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </span>
  );
}

export interface SkeletonCircleProps {
  /** Diametr (piksel) — avatar oʻlchamlari: 44, 64, 80, 120 (9.28-band). */
  size?: number;
  className?: string;
}

export function SkeletonCircle({ size = 44, className }: SkeletonCircleProps) {
  return <Skeleton width={size} height={size} radius="full" className={className} />;
}
