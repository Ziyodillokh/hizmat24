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
            // Bajarilgan va joriy qadam bir xil koʻrinadi (9.24-band).
            /* Uchta bir xil nuqta oʻlik bezak: qaysi biri joriy ekani
               koʻrinmasdi. Joriy qadam choʻziladi, bajarilgani soʻniydi. */
            className={cn(
              'h-8 rounded-full transition-all duration-state ease-std',
              index === currentStep && 'w-20 bg-primary',
              index < currentStep && 'w-8 bg-primary/[0.40]',
              index > currentStep && 'w-8 bg-border-strong',
            )}
          />
        ))}
      </div>
      <span className="text-overline uppercase text-text-secondary">
        {STEP_DOT_LABELS[currentStep]}
      </span>
    </div>
  );
}
