import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Modal — spetsifikatsiya 9.17-bandi.
 * Ekran markazida, radius/xl, e3, fon `surface-modal`, padding 20px,
 * ostida `overlay`. Gorizontal chetlar — ekran paddingʻi (20px).
 */
export interface ModalProps {
  open: boolean;
  /** Modal sarlavhasi — `h3` (5-boʻlim tipografikasi). */
  title?: string;
  /** Overlay bosilganda chaqiriladi. */
  onClose?: () => void;
  className?: string;
  children: ReactNode;
}

export function Modal({ open, title, onClose, className, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-20">
      <div className="absolute inset-0 bg-overlay" onClick={onClose} aria-hidden />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('relative w-full rounded-xl bg-surface-modal p-20 text-text-primary shadow-e3', className)}
      >
        {title && <h2 className="text-h3">{title}</h2>}
        <div className={cn(title && 'mt-12')}>{children}</div>
      </section>
    </div>
  );
}
