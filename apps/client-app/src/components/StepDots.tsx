import { cn } from '@/lib/cn';

/**
 * Qadam indikatori (3 nuqta) — spetsifikatsiya 9.24-bandi, 08–11 ekranlar uchun.
 * Bu 9.16 stepperdan ALOHIDA komponent, aralashtirilmaydi.
 */
export const STEP_DOT_LABELS = ['Tavsif', 'Manzil', 'Tasdiqlash'] as const;

export type StepDotIndex = 0 | 1 | 2;

export interface StepDotsProps {
  /** 0-indeksli joriy qadam: Tavsif · Manzil · Tasdiqlash. */
  currentStep: StepDotIndex;
  className?: string;
}

export function StepDots({ currentStep, className }: StepDotsProps) {
  return (
    <div
      className={cn('flex flex-col items-center gap-8', className)}
      aria-label="Buyurtma qadamlari"
    >
      <div className="flex items-center gap-8">
        {STEP_DOT_LABELS.map((label, index) => (
          <span
            key={label}
            aria-hidden
            // Bajarilgan va joriy qadam bir xil ko'rinadi (9.24-band).
            className={cn('h-8 w-8 rounded-full', index <= currentStep ? 'bg-primary' : 'bg-border')}
          />
        ))}
      </div>
      <span className="text-caption font-semibold text-text-primary">
        {STEP_DOT_LABELS[currentStep]}
      </span>
    </div>
  );
}
