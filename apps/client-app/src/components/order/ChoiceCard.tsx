import { CheckCircle } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { DashedChip } from '@/components/DashedChip';
import { cn } from '@/lib/cn';

/**
 * Radio-karta. Ichidagi <button> fokus, `disabled` va `role` ni oʻzi
 * boshqaradi, shuning uchun mavjud radiogroup klaviatura ishlovchilari
 * oʻzgarmaydi.
 */
export interface ChoiceCardProps {
  icon: IconGlyph;
  /** Plitka tusi — token klasslari. */
  tone?: string;
  title: string;
  hint?: string;
  isSelected: boolean;
  disabled?: boolean;
  /** Oʻchiq variantning oʻngdagi belgisi; default "Tez orada" chipi. */
  disabledBadge?: ReactNode;
  /** `row` — ikona chapda; `stack` — ikona tepada (2 ustunli panjara). */
  orientation?: 'row' | 'stack';
  onSelect: () => void;
  /** Roving tabindex. */
  tabIndex?: number;
  className?: string;
}

const DEFAULT_TONE = 'bg-primary-surface text-primary-pressed';

export function ChoiceCard({
  icon, tone = DEFAULT_TONE, title, hint, isSelected, disabled = false,
  disabledBadge, orientation = 'row', onSelect, tabIndex, className,
}: ChoiceCardProps) {
  const trailing = disabled
    ? (disabledBadge ?? <DashedChip size="compact">Tez orada</DashedChip>)
    : isSelected
      ? <Icon icon={CheckCircle} size={24} weight="fill" className="text-primary" aria-hidden />
      : <span className="block h-[24px] w-[24px] rounded-full ring-1 ring-inset ring-border-strong" aria-hidden />;

  return (
    <Card
      state={isSelected ? 'selected' : 'default'}
      className={cn('overflow-hidden p-0', disabled && 'bg-surface-sunken shadow-none', className)}
    >
      <button
        type="button"
        role="radio"
        aria-checked={isSelected}
        disabled={disabled}
        tabIndex={tabIndex}
        onClick={onSelect}
        className={cn(
          'flex w-full gap-12 p-12 text-left transition-transform duration-press ease-std',
          orientation === 'row' ? 'min-h-touch items-center' : 'h-full flex-col',
          !disabled && 'active:scale-[0.99]',
        )}
      >
        <span
          className={cn('flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md', disabled ? 'bg-neutral-surface text-text-disabled' : tone)}
          aria-hidden
        >
          <Icon icon={icon} size={24} weight="duotone" />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block text-title', disabled ? 'text-text-disabled' : 'text-text-primary')}>{title}</span>
          {hint && <span className="mt-2 block text-body-sm text-text-secondary">{hint}</span>}
        </span>
        <span className={cn('shrink-0', orientation === 'stack' && 'self-end')}>{trailing}</span>
      </button>
    </Card>
  );
}
