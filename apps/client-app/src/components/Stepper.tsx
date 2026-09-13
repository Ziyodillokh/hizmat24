import { Check } from '@phosphor-icons/react';
import { Fragment } from 'react';
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

/** Ixcham variant (roʻyxat kartasi): 12px / 8px nuqtalar, yorliqsiz. */
const COMPACT_DOT_CLASSES: Record<StepState, string> = {
  completed: 'h-12 w-12 bg-primary',
  current: 'h-12 w-12 bg-primary',
  upcoming: 'h-8 w-8 bg-border',
};

export interface StepperProps {
  status: OrderStatus;
  /**
   * Roʻyxat kartasi uchun: tashqi padding va "joriy bosqich · n/5" qatori
   * chizilmaydi — kartadagi toʻldirilgan holat chipi bosqichni allaqachon
   * nomlaydi. Nuqtalar kichraytiriladi; sr-only yorliqlar qoladi.
   */
  compact?: boolean;
  className?: string;
}

export function Stepper({ status, compact = false, className }: StepperProps) {
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
  const dotClasses = compact ? COMPACT_DOT_CLASSES : DOT_CLASSES;

  return (
    <div className={cn(!compact && 'px-20 pt-12', className)} aria-label="Buyurtma bosqichlari">
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
                className={cn(
                  'relative flex items-center justify-center',
                  compact ? 'h-12 w-12' : 'h-16 w-16',
                )}
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
                    dotClasses[state],
                  )}
                >
                  {state === 'completed' && (
                    // Icon oʻramchisi 10px oʻlchamni bilmaydi — klass orqali aniq 10px beriladi.
                    // Rang `on-primary`: 4-boʻlim 1-qoidasi yorqin teal ustida oq matnni taqiqlaydi.
                    <Icon
                      icon={Check}
                      size={16}
                      className={cn(compact ? 'h-[8px] w-[8px]' : 'h-[10px] w-[10px]', 'text-on-primary')}
                    />
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

      {!compact && (
        <div className="mt-12 flex items-baseline justify-between gap-12">
          <p className="min-w-0 truncate text-title text-text-primary">
            {currentLabel}
          </p>
          <p className="tabular shrink-0 text-caption text-text-secondary">
            {currentStep + 1}/{STEPPER_LABELS.length}
          </p>
        </div>
      )}
    </div>
  );
}
