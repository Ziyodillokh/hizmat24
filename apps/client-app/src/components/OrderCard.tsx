import type { KeyboardEvent } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDateTime, formatPrice } from '@/lib/formatters';
import type { OrderStatus } from '@/lib/orderStateMachine';
import { Card } from './Card';
import { Icon } from './Icon';
import { StatusChip } from './StatusChip';

/**
 * Buyurtma kartasi (roʻyxat elementi) — spetsifikatsiya 9.8-bandi.
 * Chapda 44px xizmat turi ikonasi · oʻngda nom (h3), sana (caption), narx (price)
 * · yuqori oʻngda status chipi · eng oʻngda shevron.
 */

/**
 * 8.4-band: raqam `price`, "soʻm" esa `currency` `text-secondary` bilan chiziladi.
 * Format formatPrice() dan keladi — bu yerda faqat tipografiya uchun ajratiladi.
 */
const CURRENCY_LABEL = "soʻm";

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
      className={cn('flex items-start gap-12', className)}
    >
      <span
        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-primary/[0.14]"
        aria-hidden
      >
        <Icon icon={serviceIcon} size={24} className="text-primary" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-8">
          <h3 className="min-w-0 flex-1 truncate text-h3 text-text-primary">{serviceName}</h3>
          <StatusChip status={status} />
        </div>

        <p className="mt-4 text-caption text-text-secondary">{formatDateTime(createdAt, now)}</p>

        <p className="tabular mt-8 text-price text-text-primary">
          {value} <span className="text-currency text-text-secondary">{currency}</span>
        </p>
      </div>

      <Icon icon={ChevronRight} size={20} className="self-center text-text-secondary" />
    </Card>
  );
}
