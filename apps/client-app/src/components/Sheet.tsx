import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Bottom sheet — spetsifikatsiya 9.17-bandi.
 * radius/xl faqat YUQORI ikki burchak (pastki burchaklar 0), e3,
 * fon `surface-modal`, padding 20px, tepada 36x4px `border-strong` grabber,
 * ostida `overlay`.
 */
export interface SheetProps {
  open: boolean;
  /** Modal sarlavhasi — `h3` (5-boʻlim tipografikasi). */
  title?: string;
  /** Overlay bosilganda chaqiriladi. */
  onClose?: () => void;
  className?: string;
  children: ReactNode;
}

export function Sheet({ open, title, onClose, className, children }: SheetProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} aria-hidden />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        // Rang shu yerda beriladi, oʻlcham esa matn elementlarida — `twMerge`
        // ikkalasini bitta guruh deb hisoblab, biridan voz kechadi.
        className={cn('relative rounded-t-xl bg-surface-modal p-20 text-text-primary shadow-e3', className)}
      >
        <div className="mx-auto h-[4px] w-[36px] rounded-full bg-border-strong" aria-hidden />
        {title && <h2 className="mt-20 text-h3">{title}</h2>}
        <div className={cn(title ? 'mt-16' : 'mt-20')}>{children}</div>
      </section>
    </div>
  );
}
