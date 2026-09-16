import { CaretRight, Star } from '@phosphor-icons/react';
import { Icon } from '@/components/Icon';
import { ServicePhoto } from '@/components/order/ServicePhoto';
import { StatusChip } from '@/components/StatusChip';
import { cn } from '@/lib/cn';
import { EMPTY_VALUE, formatRating, splitFormattedPrice } from '@/lib/formatters';
import { MASTER_STATUS_CHIPS } from '@/lib/masterJobs';
import type { LiveOrder } from '@/app/types';

/**
 * Tarix qatori — usta koʻradigan chek satri.
 *
 * Mijozdagi `OrderHistoryRow` bilan bir xil geometriya (56×56 foto, uch
 * satr), lekin boshqa maʼno: bu yerda summa — USTA qoʻlga olgan pul.
 *
 * Baho BOʻLMASA yulduz chizilmaydi va `EMPTY_VALUE` turadi: baholanmagan
 * ishga «5,0» taxmin qilish ilovadagi eng arzon yolgʻon boʻlardi.
 */
export interface MasterHistoryRowProps {
  order: LiveOrder;
  /** Sana matni — guruh sarlavhasi bilan takrorlanmasligi uchun tashqaridan. */
  dateLabel: string;
  onOpen: () => void;
  className?: string;
}

export function MasterHistoryRow({ order, dateLabel, onOpen, className }: MasterHistoryRowProps) {
  const { value, currency } = splitFormattedPrice(order.invoice.total);
  const chip = MASTER_STATUS_CHIPS[order.status];
  const stars = order.rating?.stars ?? null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-12 px-12 py-12 text-left',
        'transition-colors duration-press ease-std active:bg-surface-sunken',
        className,
      )}
    >
      <ServicePhoto
        serviceId={order.categoryId}
        iconKey={order.categoryIconKey}
        iconSize={24}
        className="h-[56px] w-[56px]"
      />

      <span className="min-w-0 flex-1">
        {/* Raqam sarlavha qatorida: uchinchi satrda u sanani qisib, «14-sentabr,
            …» boʻlib qirqilardi. */}
        <span className="flex items-baseline justify-between gap-8">
          <span className="min-w-0 truncate text-title text-text-primary">{order.categoryName}</span>
          <span className="tabular shrink-0 text-caption text-text-secondary">{order.shortId}</span>
        </span>

        <span className="mt-2 flex items-center justify-between gap-8">
          <StatusChip status={order.status} label={chip.label} tone={chip.tone} inline className="min-w-0" />
          <span className="tabular shrink-0 text-numeric-sm text-text-primary">
            {value} <span className="text-caption text-text-secondary">{currency}</span>
          </span>
        </span>

        <span className="mt-2 flex items-center gap-8 text-caption text-text-secondary">
          <span className="inline-flex shrink-0 items-center gap-2">
            {stars === null ? (
              <span aria-label="Baho yoʻq">{EMPTY_VALUE}</span>
            ) : (
              <>
                <Icon icon={Star} size={14} weight="fill" className="text-star" aria-hidden />
                <span className="tabular text-text-primary">{formatRating(stars)}</span>
              </>
            )}
          </span>
          <span aria-hidden>·</span>
          <span className="min-w-0 truncate">{dateLabel}</span>
        </span>
      </span>

      <Icon icon={CaretRight} size={16} className="shrink-0 text-text-secondary" aria-hidden />
    </button>
  );
}
