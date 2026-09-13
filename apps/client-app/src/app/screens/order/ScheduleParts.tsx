import { cn } from '@/lib/cn';
import { formatDayLabel, formatDayNumber, formatWeekdayShort } from '@/lib/formatters';
import type { DayOption } from '@/lib/schedule';

/** Sana katagi: tanlangan — toʻldirilgan primary; oʻtib ketgan — sunken + disabled. */
export function DayCell({ day, now, isSelected, onSelect }: {
  day: DayOption; now: Date; isSelected: boolean; onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      tabIndex={isSelected ? 0 : -1}
      disabled={!day.hasSlots}
      aria-label={day.hasSlots ? formatDayLabel(day.date, now) : `${formatDayLabel(day.date, now)} — vaqt oʻtib ketgan`}
      onClick={onSelect}
      className={cn(
        'flex h-[64px] w-[56px] shrink-0 flex-col items-center justify-center gap-2 rounded-md',
        'transition-[transform,background-color,box-shadow] duration-press ease-std active:scale-[0.97] disabled:active:scale-100',
        isSelected
          ? 'bg-primary text-on-primary shadow-primary-lift'
          : "border border-transparent bg-surface-elevated text-text-primary shadow-e1 [[data-theme='dark']_&]:border-border",
        !day.hasSlots && 'bg-surface-sunken text-text-disabled shadow-none',
      )}
    >
      <span className={cn('text-caption', isSelected ? 'text-on-primary' : 'text-text-secondary')}>{formatWeekdayShort(day.date)}</span>
      <span className="tabular text-title">{formatDayNumber(day.date)}</span>
    </button>
  );
}

/** Soat katagi — guruh panjarasi ichida. */
export function HourButton({ label, isSelected, onSelect }: {
  label: string; isSelected: boolean; onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      tabIndex={isSelected ? 0 : -1}
      aria-label={label}
      onClick={onSelect}
      className={cn(
        'tabular flex min-h-touch items-center justify-center rounded-sm px-8 text-body font-semibold',
        'transition-[transform,background-color,box-shadow] duration-press ease-std active:scale-[0.98]',
        isSelected ? 'bg-primary text-on-primary shadow-primary-lift' : 'bg-surface-sunken text-text-primary',
      )}
    >
      {label}
    </button>
  );
}
