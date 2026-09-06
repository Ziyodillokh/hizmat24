import { cn } from '@/lib/cn';

/**
 * Spinner FAQAT to'rt joyda ishlatiladi (12.1-band): tugma ichida,
 * 01-ekranda, 09-ekranda xarita yuklanishida va real-vaqt aloqa bannerida.
 * Ro'yxat va kontent yuklanishida faqat skeleton.
 */
export interface SpinnerProps {
  size?: 16 | 20 | 32;
  className?: string;
}

export function Spinner({ size = 20, className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Yuklanmoqda"
      style={{ width: size, height: size, borderWidth: 2 }}
      className={cn(
        'inline-block shrink-0 animate-spin rounded-full',
        'border-current border-t-transparent opacity-90',
        className,
      )}
    />
  );
}
