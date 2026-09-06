import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Karta — spetsifikatsiya 9.4-bandi.
 * Elevatsiya ikki temada ikki xil mexanizm bilan ishlaydi (6.3-band):
 * Light — soya, Dark — fon zinapoyasi + ingichka oq chegara. Ikkalasi ham
 * `shadow-e1` tokeni orqali keladi, shuning uchun bu yerda shart yozilmaydi.
 */
export type CardState = 'default' | 'pressed' | 'selected';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  state?: CardState;
  interactive?: boolean;
  children: ReactNode;
}

export function Card({ state = 'default', interactive = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-surface-elevated p-16 shadow-e1',
        'border border-border',
        state === 'selected' && 'border-2 border-primary',
        state === 'pressed' && 'scale-[0.99]',
        interactive && 'transition-transform active:scale-[0.99]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
