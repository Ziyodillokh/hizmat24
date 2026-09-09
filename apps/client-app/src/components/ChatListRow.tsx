import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { UnreadBadge } from './BottomNav';

/**
 * Suhbatlar roʻyxatidagi bitta qator.
 *
 * Avatar tashqaridan `ReactNode` sifatida keladi: roʻyxatda usta fotosi ham,
 * AI yordamchining ikona plitkasi ham turadi — ikkalasi uchun alohida qator
 * komponenti yozish bitta uslubni ikki joyda saqlashga majbur qilardi.
 */
export interface ChatListRowProps {
  avatar: ReactNode;
  name: string;
  /** Suhbat NIMA yuzasidan — buyurtma nomi yoki yordamchi taʼrifi. */
  subtitle: string;
  /** Oxirgi xabar matni; oʻz xabari boʻlsa oldiga "Siz: " qoʻyiladi. */
  preview: string;
  /** "14:32" · "Kecha" · "05.09". */
  time: string;
  unreadCount?: number;
  onSelect: () => void;
  className?: string;
}

export function ChatListRow({
  avatar,
  name,
  subtitle,
  preview,
  time,
  unreadCount = 0,
  onSelect,
  className,
}: ChatListRowProps) {
  const isUnread = unreadCount > 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-12 rounded-lg p-12 text-left',
        'border border-transparent bg-surface-elevated shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        'transition-transform duration-press ease-std active:scale-[0.99]',
        className,
      )}
    >
      {avatar}

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-8">
          <span className="min-w-0 flex-1 truncate text-title text-text-primary">{name}</span>
          {/* Vaqt tabular: qatorlar boʻyicha raqamlar bir vertikalda turadi. */}
          <span className="tabular shrink-0 text-caption text-text-secondary">{time}</span>
        </span>

        <span className="mt-2 block truncate text-caption text-primary-pressed">{subtitle}</span>

        <span className="mt-4 flex items-end gap-8">
          <span
            className={cn(
              'min-w-0 flex-1 line-clamp-1 text-body-sm',
              // Oʻqilmagan suhbatda oxirgi xabar toʻq va qalinroq — koʻz
              // roʻyxatni skanerlaganda aynan shu qatorda toʻxtaydi.
              isUnread ? 'font-semibold text-text-primary' : 'text-text-secondary',
            )}
          >
            {preview}
          </span>
          <UnreadBadge count={unreadCount} className="ring-0" />
        </span>
      </span>
    </button>
  );
}
