import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import { STEPPER_LABELS, getStepperState, type OrderStatus } from '@/lib/orderStateMachine';

/**
 * 5 bosqichli stepper — spetsifikatsiya 9.16 va 10.1-bandlari.
 *
 * Yorliqlar har bir nuqta OSTIDA emas, trek ostida BITTA qatorda beriladi.
 * Ilgari beshta yorliq nuqtalar ostiga absolyut joylashtirilardi: 390px
 * ekranda "Qabul qilindi" va "Yakunlandi" konteyner chetidan chiqib kesilar,
 * uzunroqlari esa ikki satrga sinib, qator balandligini buzardi. Foydalanuvchiga
 * baribir faqat JORIY bosqich nomi kerak — qolganini nuqtalar koʻrsatadi.
 *
 * Bosqich holati faqat getStepperState() orqali aniqlanadi.
 */
type StepState = 'completed' | 'current' | 'upcoming';

/** 10.1-band: bajarilgan/joriy nuqta 16px `primary`, kelgusi 12px `border`. */
const DOT_CLASSES: Record<StepState, string> = {
  completed: 'h-16 w-16 bg-primary',
  current: 'h-16 w-16 bg-primary',
  upcoming: 'h-12 w-12 bg-border',
};

export interface StepperProps {
  status: OrderStatus;
  className?: string;
}

export function Stepper({ status, className }: StepperProps) {
  const { currentStep, currentCompleted } = getStepperState(status);

  // 10.1-band: bloklovchi tasdiqlash, bekor qilingan va xavfsizlik holatlarida
  // stepper umuman chizilmaydi.
  if (currentStep === null) return null;

  const stateOf = (index: number): StepState => {
    if (index < currentStep) return 'completed';
    if (index > currentStep) return 'upcoming';
    return currentCompleted ? 'completed' : 'current';
  };

  const currentLabel = STEPPER_LABELS[currentStep];

  return (
    <div className={cn('px-20 pt-12', className)} aria-label="Buyurtma bosqichlari">
      <div className="flex items-center">
        {STEPPER_LABELS.map((label, index) => {
          const state = stateOf(index);

          return (
            <Fragment key={label}>
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn('h-2 flex-1', index <= currentStep ? 'bg-primary' : 'bg-border')}
                />
              )}
              <div
                className="relative flex h-16 w-16 items-center justify-center"
                aria-current={state === 'current' ? 'step' : undefined}
              >
                {state === 'current' && (
                  // Tashqi 4px halqa: 24% shaffoflik `step-pulse` keyframeʼining
                  // boshlangʻich opacity qiymatidan keladi, shuning uchun fon toʻliq `primary`.
                  <span
                    aria-hidden
                    className="absolute -inset-4 animate-step-pulse rounded-full bg-primary"
                  />
                )}
                <span
                  className={cn(
                    'relative flex items-center justify-center rounded-full',
                    DOT_CLASSES[state],
                  )}
                >
                  {state === 'completed' && (
                    // Icon oʻramchisi 10px oʻlchamni bilmaydi — klass orqali aniq 10px beriladi.
                    // Rang `on-primary`: 4-boʻlim 1-qoidasi yorqin teal ustida oq matnni taqiqlaydi.
                    <Icon icon={Check} size={16} className="h-[10px] w-[10px] text-on-primary" />
                  )}
                </span>
                {/* Yorliq matni ekranda koʻrinmaydi, lekin skrin-riderga bosqich
                    nomini yetkazadi — nuqtalarning oʻzi maʼno bermaydi. */}
                <span className="sr-only">{label}</span>
              </div>
            </Fragment>
          );
        })}
      </div>

      <div className="mt-12 flex items-baseline justify-between gap-12">
        <p className="min-w-0 truncate text-title text-text-primary">
          {currentLabel}
        </p>
        <p className="tabular shrink-0 text-caption text-text-secondary">
          {currentStep + 1}/{STEPPER_LABELS.length}
        </p>
      </div>
    </div>
  );
}
