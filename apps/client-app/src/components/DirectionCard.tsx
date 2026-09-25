import { Lock } from '@phosphor-icons/react';
import { serviceIcon } from '@/lib/serviceIcons';
import { directionHint, type DirectionCard as Direction } from '@/lib/serviceDirections';
import { cn } from '@/lib/cn';

/**
 * Bosh ekrandagi yoʻnalish kartasi — santexnika, elektrik.
 *
 * Qulflangan yoʻnalish HAM bosiladi: tugma «oʻlik» boʻlmasligi kerak.
 * Bosilganda sabab aytiladi, karta esa qulf belgisi bilan turadi —
 * mijoz bosishdan oldin ham holatni koʻradi.
 */
export function DirectionCard({
  direction,
  imageUrl,
  onClick,
}: {
  direction: Direction;
  imageUrl?: string | null;
  onClick: () => void;
}) {
  const Icon = serviceIcon(direction.iconKey);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={
        direction.isLocked ? `${direction.name} — ${directionHint(direction)}` : direction.name
      }
      className={cn(
        'flex w-full flex-col items-stretch overflow-hidden rounded-lg border border-transparent bg-surface-elevated text-left shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        'transition-transform duration-press ease-emphasized active:scale-[0.97]',
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-surface-sunken">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className={cn('h-full w-full object-cover', direction.isLocked && 'opacity-40')}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Icon size={40} weight="duotone" className="text-accent-water" aria-hidden />
          </span>
        )}

        {direction.isLocked && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-40 items-center justify-center rounded-full bg-surface-elevated shadow-e1">
              <Lock size={20} weight="fill" className="text-text-secondary" aria-hidden />
            </span>
          </span>
        )}
      </div>

      <span className="flex flex-col gap-2 p-12">
        <span className="text-title text-text-primary">{direction.name}</span>
        <span
          className={cn(
            'text-caption',
            direction.isLocked ? 'text-text-secondary' : 'text-text-secondary',
          )}
        >
          {directionHint(direction)}
        </span>
      </span>
    </button>
  );
}
