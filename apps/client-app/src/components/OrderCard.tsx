import { CaretRight } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { formatDateTime, formatPrice } from '@/lib/formatters';
import { STATUS_CHIPS, type ChipTone, type OrderStatus } from '@/lib/orderStateMachine';
import { Card } from './Card';
import { Icon } from './Icon';
import { StatusChip } from './StatusChip';

/**
 * Buyurtma kartasi (roʻyxat elementi).
 *
 * Karta ikki zonaga boʻlingan: tepada mazmun (ikona, nom, holat), pastda
 * meta qatori (vaqt va narx). Ularni karta chetigacha choʻzilgan ingichka
 * chiziq ajratadi.
 *
 * Nega chiziq: usiz uchta qator bir xil ogʻirlikdagi matn oqimi boʻlib
 * qolardi va karta "tuzilgan" emas, "toʻkilgan" koʻrinardi. Chiziq oʻqishga
 * tartib beradi — koʻz avval nima buyurtma qilinganini, keyin qachon va
 * qanchaga ekanini oladi.
 *
 * Ikona plitkasi HOLAT tusida boʻyaladi: roʻyxatni skanerlaganda holat
 * ikki marta — rangda va matnda — takrorlanadi, shuning uchun qidirilayotgan
 * buyurtma matnni oʻqimasdan ham topiladi.
 */
const CURRENCY_LABEL = 'soʻm';

/** Ikona plitkasi uchun holat tusi. `StatusChip` bilan bitta manbadan. */
const TILE_CLASSES: Record<ChipTone, string> = {
  primary: 'bg-primary-surface text-primary-pressed',
  warning: 'bg-warning-surface text-warning',
  success: 'bg-success-surface text-success',
  danger: 'bg-danger-surface text-danger',
  neutral: 'bg-neutral-surface text-text-secondary',
};

function splitFormattedPrice(amount: number): { value: string; currency: string } {
  const formatted = formatPrice(amount);
  const at = formatted.lastIndexOf(CURRENCY_LABEL);
  // Yorliq topilmasa butun satr raqam sifatida chiziladi — kesilgan matn chiqmaydi.
  const value = at === -1 ? formatted.trim() : formatted.slice(0, at).trim();
  return { value, currency: CURRENCY_LABEL };
}

export interface OrderCardProps {
  /** Xizmat turi ikonasi — lucide glifi (6.4-band). */
  serviceIcon: IconGlyph;
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
   * turadi — kartada yana "Bugun, 09:38" yozish ortiqcha takror.
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
  const { tone } = STATUS_CHIPS[status];

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
      className={cn('p-12', className)}
    >
      <div className="flex items-start gap-12">
        <span
          className={cn(
            'flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md',
            TILE_CLASSES[tone],
          )}
          aria-hidden
        >
          <Icon icon={serviceIcon} size={24} weight="duotone" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-title text-text-primary">{serviceName}</h3>
          <StatusChip status={status} inline className="mt-2" />
        </div>

        {isInteractive && (
          <Icon icon={CaretRight} size={16} className="mt-4 shrink-0 text-text-secondary" />
        )}
      </div>

      {/* Chiziq karta chetigacha choʻziladi — ichkarida tugasa "yarim tortilgan" koʻrinardi. */}
      <span className="-mx-12 my-12 block h-px bg-border" aria-hidden />

      <div className="flex items-baseline justify-between gap-8">
        <span className="truncate text-caption text-text-secondary">
          {dateLabel ?? formatDateTime(createdAt, now)}
        </span>
        <span className="tabular shrink-0 text-price text-text-primary">
          {value} <span className="text-currency text-text-secondary">{currency}</span>
        </span>
      </div>
    </Card>
  );
}
