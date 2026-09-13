import { X } from '@phosphor-icons/react';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import type { Master } from '@/mocks/types';

/** Soʻralgan usta — SOʻROV, kafolat emas (types.ts `preferredMasterId`). */
export interface RequestedMasterCardProps {
  master: Master;
  note?: string;
  onRemove?: () => void;
  className?: string;
}

const DEFAULT_NOTE = 'Bu soʻrov, kafolat emas — ustaning bandligi hali tekshirilmaydi';

export function RequestedMasterCard({ master, note = DEFAULT_NOTE, onRemove, className }: RequestedMasterCardProps) {
  return (
    <Card className={cn('flex items-center gap-12 p-12', className)}>
      <Avatar src={master.photoUrl} name={master.fullName} size={48} shape="square" />
      <div className="min-w-0 flex-1">
        <p className="text-caption text-text-secondary">Soʻralgan usta</p>
        <p className="truncate text-title text-text-primary">{master.fullName}</p>
        <p className="mt-2 text-body-sm text-text-secondary">{master.profession} · {note}</p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Usta tanlovini bekor qilish"
          className="-mr-8 flex h-touch w-touch shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors duration-press ease-std active:bg-surface-sunken"
        >
          <Icon icon={X} size={20} />
        </button>
      )}
    </Card>
  );
}
