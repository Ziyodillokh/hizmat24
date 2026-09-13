import { CaretRight } from '@phosphor-icons/react';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';

/**
 * Bosiladigan statistika plitkasi — orqasida HAQIQIY ekran bor (`onSelect`
 * majburiy). Karta ostidagi ikkita plitka: chegirma → bonuslar, jami → tarix.
 * Izoh koʻk rangda va strelka bilan — plitka tugma ekani darhol koʻrinadi.
 */
export interface StatTileProps {
  label: string;
  value: string;
  /** "soʻm" — qiymatdan kichikroq, ikkilamchi rangda. */
  unit?: string;
  hint: string;
  onSelect: () => void;
  className?: string;
}

export function StatTile({ label, value, unit, hint, onSelect, className }: StatTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'min-w-0 rounded-lg border border-transparent bg-surface-elevated p-12 text-left shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        'transition-transform duration-press ease-emphasized active:scale-[0.97]',
        className,
      )}
    >
      {/* `<button>` ichida faqat inline kontent boʻlishi mumkin — `p` emas, `span`. */}
      <span className="block truncate text-caption text-text-secondary">{label}</span>
      <span className="tabular mt-4 block truncate text-h3 text-text-primary">
        {value}
        {unit && <span className="text-currency text-text-secondary"> {unit}</span>}
      </span>
      <span className="mt-2 flex items-center gap-4 text-caption text-primary">
        <span className="truncate">{hint}</span>
        <Icon icon={CaretRight} size={14} weight="bold" className="shrink-0" aria-hidden />
      </span>
    </button>
  );
}
