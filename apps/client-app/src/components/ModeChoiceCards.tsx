import { ArrowRight, UserCircle, Wrench } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { UserRole } from '@/app/types';
import { MODE_DESCRIPTIONS, MODE_LABELS } from '@/lib/appMode';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import { InfoChip } from './InfoChip';

/**
 * Rejim tanlash kartalari.
 *
 * Bitta manba: `/app/mode` va `OnboardingScreen` AYNAN shu kartalarni
 * chizadi. Ilgari rol tanlovi faqat tanishtiruvda bor edi va uning matni
 * boshqa hech qayerda takrorlanmasdi; endi tanlov ikki joyda va ikkalasi
 * bir xil jumla bilan gapiradi.
 */
interface ModeOption {
  mode: UserRole;
  icon: IconGlyph;
}

const OPTIONS: readonly ModeOption[] = [
  { mode: 'client', icon: UserCircle },
  { mode: 'master', icon: Wrench },
];

export interface ModeChoiceCardsProps {
  /** Joriy rejim — uning kartasida «Hozirgi rejim» chipi chiziladi. */
  value: UserRole | null;
  onChoose: (mode: UserRole) => void;
  /** Usta kartasidagi qoʻshimcha qator (profil toʻliqligi). */
  masterHint?: string;
  className?: string;
}

export function ModeChoiceCards({ value, onChoose, masterHint, className }: ModeChoiceCardsProps) {
  return (
    <ul className={cn('flex flex-col gap-12', className)}>
      {OPTIONS.map((option) => {
        const isCurrent = option.mode === value;
        const hint = option.mode === 'master' ? masterHint : undefined;

        return (
          <li key={option.mode}>
            <button
              type="button"
              onClick={() => onChoose(option.mode)}
              className={cn(
                'flex w-full items-center gap-12 rounded-lg border border-transparent bg-surface-elevated p-16 text-left shadow-e1',
                "[[data-theme='dark']_&]:border-border",
                isCurrent && 'border-primary',
                'transition-transform duration-press ease-emphasized active:scale-[0.99]',
              )}
            >
              <span
                className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-md bg-primary-surface"
                aria-hidden
              >
                <Icon icon={option.icon} size={24} weight="duotone" className="text-primary-pressed" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-8">
                  <span className="text-title text-text-primary">{MODE_LABELS[option.mode]}</span>
                  {isCurrent && <InfoChip tone="primary">Hozirgi rejim</InfoChip>}
                </span>
                <span className="mt-4 block text-body-sm text-text-secondary">
                  {MODE_DESCRIPTIONS[option.mode]}
                </span>
                {hint && <span className="mt-4 block text-caption text-text-secondary">{hint}</span>}
              </span>

              <Icon icon={ArrowRight} size={16} className="shrink-0 text-text-secondary" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
