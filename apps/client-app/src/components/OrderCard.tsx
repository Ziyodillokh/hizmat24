import type { KeyboardEvent } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDateTime, formatPrice } from '@/lib/formatters';
import type { OrderStatus } from '@/lib/orderStateMachine';
import { Card } from './Card';
import { Icon } from './Icon';
import { StatusChip } from './StatusChip';

/**
 * Buyurtma kartasi (roʻyxat elementi).
 *
 * Uch qator, har biri bitta ish bajaradi:
 *   1. xizmat nomi — eng muhim maʼlumot, butun kenglikni oladi;
 *   2. holat — nuqta va rangli matn;
 *   3. sana chapda, narx oʻngda.
 *
 * Nom va status ILGARI bitta qatorni boʻlishardi: toʻldirilgan status
 * tabletkasi qisqarmagani uchun 390px ekranda nom "Kanalizatsi…" boʻlib
 * kesilardi. Endi ular alohida qatorlarda va hech nima kesilmaydi.
 */
const CURRENCY_LABEL = 'soʻm';

function splitFormattedPrice(amount: number): { value: string; currency: string } {
  const formatted = formatPrice(amount);
  const at = formatted.lastIndexOf(CURRENCY_LABEL);
  // Yorliq topilmasa butun satr raqam sifatida chiziladi — kesilgan matn chiqmaydi.
  const value = at === -1 ? formatted.trim() : formatted.slice(0, at).trim();
  return { value, currency: CURRENCY_LABEL };
}

export interface OrderCardProps {
  /** Xizmat turi ikonasi — lucide glifi (6.4-band). */
  serviceIcon: LucideIcon;
  /** Xizmat nomi serverdan keladi, UI oʻz matnini toʻqimaydi. */
  serviceName: string;
  status: OrderStatus;
  createdAt: Date;
  /** Sana "Bugun"/"Kecha" ga nisbatan hisoblanadi (8.5-band). */
  now: Date;
  /**
   * Sana oʻrniga koʻrsatiladigan tayyor matn.
   *
   * Roʻyxat sana boʻyicha guruhlanganda sarlavha allaqachon "BUGUN" deb
   * turadi — kartada yana "Bugun, 09:38" yozish ortiqcha takror. Bunday
   * joyda ekran faqat vaqtni uzatadi.
   */
  dateLabel?: string;
  price: number;
  onSelect?: () => void;
  className?: string;
}

export function OrderCard({
  serviceIcon,
  serviceName,
  status,
  createdAt,
  now,
  dateLabel,
  price,
  onSelect,
  className,
}: OrderCardProps) {
  const isInteractive = Boolean(onSelect);
  const { value, currency } = splitFormattedPrice(price);

  // Karta div boʻlgani uchun klaviatura bilan ochish qoʻlda ulanadi.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onSelect();
  };

  return (
    <Card
      interactive={isInteractive}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={cn('flex items-start gap-12 p-12', className)}
    >
      <span
        className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md bg-primary-surface"
        aria-hidden
      >
        <Icon icon={serviceIcon} size={20} className="text-primary-pressed" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-8">
          <h3 className="min-w-0 flex-1 truncate text-title text-text-primary">{serviceName}</h3>
          <Icon icon={ChevronRight} size={16} className="mt-2 shrink-0 text-text-secondary" />
        </div>

        <StatusChip status={status} inline className="mt-4" />

        <div className="mt-8 flex items-baseline justify-between gap-8">
          <span className="truncate text-caption text-text-secondary">
            {dateLabel ?? formatDateTime(createdAt, now)}
          </span>
          <span className="tabular shrink-0 text-numeric-sm text-text-primary">
            {value} <span className="text-caption text-text-secondary">{currency}</span>
          </span>
        </div>
      </div>
    </Card>
  );
}
