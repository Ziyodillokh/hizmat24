import { Star } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { formatRating } from '@/lib/formatters';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { MarqueeText } from './MarqueeText';

/**
 * Bosh sahifadagi "Sizga tavsiya etiladiganlar" kartasi.
 *
 * Tuzilma referens maketdan: chapda yumaloqlangan KVADRAT foto, oʻngda ism,
 * kasb va reyting; ostida ajratuvchi chiziq va butun enlik amal tugmasi.
 *
 * Ism va familiya BITTA qatorda turadi. Katakcha ~160px keng, shuning uchun
 * uzun nom sigʻmasligi mumkin — bunda `MarqueeText` uni sekin surib
 * koʻrsatadi. Uch nuqta bilan kesish bu yerda yaramaydi: familiya aynan
 * ustani ajratib turadigan qism.
 */
export interface MasterSuggestionCardProps {
  name: string;
  profession: string;
  rating: number;
  /** Ilova ichiga joylangan rasm; boʻlmasa ism bosh harfi chiziladi. */
  photoUrl?: string;
  actionLabel: string;
  onAction: () => void;
  onOpen?: () => void;
  className?: string;
}

export function MasterSuggestionCard({
  name,
  profession,
  rating,
  photoUrl,
  actionLabel,
  onAction,
  onOpen,
  className,
}: MasterSuggestionCardProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-lg border border-transparent bg-surface-elevated p-12 shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 items-center gap-8 text-left"
        aria-label={`${name} — ${profession}`}
      >
        <Avatar name={name} src={photoUrl} size={44} shape="square" className="shrink-0" />

        <span className="min-w-0 flex-1">
          <MarqueeText
            text={name}
            className="text-body-sm font-semibold leading-tight text-text-primary"
          />
          <span className="mt-2 block truncate text-caption text-text-secondary">{profession}</span>
          <span className="mt-2 flex items-center gap-4">
            <Icon icon={Star} size={14} weight="fill" className="text-star" aria-hidden />
            <span className="tabular text-caption text-text-primary">{formatRating(rating)}</span>
          </span>
        </span>
      </button>

      {/* `OrderCard` va `ServiceCard` dagi kabi ajratuvchi chiziq. */}
      <span className="-mx-12 mb-8 mt-8 block h-px bg-border" aria-hidden />

      <button
        type="button"
        onClick={onAction}
        className={cn(
          'mt-auto flex min-h-[36px] w-full items-center justify-center rounded-md px-8',
          'bg-primary text-button-sm text-on-primary shadow-primary-lift',
          'transition-[transform,background-color,box-shadow] duration-press ease-emphasized',
          'active:scale-[0.97] active:bg-primary-pressed active:text-on-primary-deep active:shadow-e1',
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}
