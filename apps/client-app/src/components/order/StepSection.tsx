import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** Oqimdagi yagona boʻlim naqshi: h3 sarlavha + body-sm izoh + kontent. */
export interface StepSectionProps {
  title: string;
  hint?: string;
  /** Sarlavha oʻngidagi kichik element (masalan daraja chipi). */
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function StepSection({ title, hint, trailing, children, className }: StepSectionProps) {
  return (
    <section className={cn('mt-24', className)}>
      <div className="flex items-center justify-between gap-8">
        <h2 className="min-w-0 flex-1 text-h3 text-text-primary">{title}</h2>
        {trailing}
      </div>
      {hint && <p className="mt-4 text-body-sm text-text-secondary">{hint}</p>}
      <div className="mt-12">{children}</div>
    </section>
  );
}
