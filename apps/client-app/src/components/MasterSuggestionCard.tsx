import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatRating } from '@/lib/formatters';
import { Avatar } from './Avatar';
import { Icon } from './Icon';

/**
 * Bosh sahifadagi "Sizga tavsiya etiladiganlar" kartasi.
 *
 * Ikki ustunli tor katakcha: avatar, ism, kasbi, reyting va amal tugmasi.
 * Ism va kasb `truncate` bilan — 390px ekranda ustun kengligi ~160px, uzun
 * ism qatorni buzmasligi kerak.
 */
export interface MasterSuggestionCardProps {
  name: string;
  profession: string;
  rating: number;
  actionLabel: string;
  onAction: () => void;
  onOpen?: () => void;
  className?: string;
}

export function MasterSuggestionCard({
  name,
  profession,
  rating,
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
        <Avatar name={name} size={36} className="shrink-0" />
        <span className="min-w-0 flex-1">
          {/* Ikki satrgacha: "Akmal Rahimov" 160px lik katakchada bir satrga
              sigʻmaydi va kesilsa ustaning kim ekani oʻqilmay qoladi. */}
          <span className="block line-clamp-2 text-body-sm font-semibold leading-tight text-text-primary">
            {name}
          </span>
          <span className="block truncate text-caption text-text-secondary">{profession}</span>
        </span>
      </button>

      <div className="mt-auto flex items-center gap-4 pt-8">
        {/* Bitta to'ldirilgan yulduz + raqam: beshta yulduz tor katakchada
            reytingning o'zidan ko'proq joy egallardi. */}
        <Icon icon={Star} size={16} className="fill-star text-star" aria-hidden />
        <span className="tabular text-numeric-sm text-text-primary">{formatRating(rating)}</span>
      </div>

      <button
        type="button"
        onClick={onAction}
        className={cn(
          'mt-8 flex min-h-[38px] w-full items-center justify-center rounded-md px-8',
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
