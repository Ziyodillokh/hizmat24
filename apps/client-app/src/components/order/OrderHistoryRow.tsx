import { CaretRight, Star } from '@phosphor-icons/react';
import { Icon } from '@/components/Icon';
import { StatusChip } from '@/components/StatusChip';
import { cn } from '@/lib/cn';
import { splitFormattedPrice } from '@/lib/formatters';
import { historyRowFact } from '@/lib/orderListView';
import type { LiveOrder } from '@/app/types';
import { ServicePhoto } from './ServicePhoto';

/**
 * Tarix qatori (24-ekran, terminal buyurtmalar) — chek satri kabi UCH qator:
 *   1. nom
 *   2. holat (nuqta + rangli matn) ····· narx
 *   3. ★ baho · sana · fakt (bekor sababi / xavfsizlik)
 *
 * Foto 56×56 kvadrat — uch satr (~63px) bilan deyarli teng, shuning uchun
 * `items-center` da u "suzib" qolmaydi. Ilgari 64×48 foto toʻrt satr (~83px)
 * yonida vertikal oʻrtada osilib turardi, "18:25" esa yolgʻiz satr edi.
 *
 * Karta EMAS — qatorlar sana guruhi kartasida `divide-y` bilan turadi
 * (`OrdersTab`). Tugma YOʻQ — butun qator tafsilotga olib boradi.
 * Yulduz faqat `order.rating` mavjud boʻlganda — haqiqatan baholangan CLOSED.
 */
export interface OrderHistoryRowProps {
  order: LiveOrder;
  /** `historyDateLabel()` natijasi: guruh "Bugun"/"Kecha" boʻlsa faqat soat. */
  dateLabel: string;
  /** Faktlar shu vaqtga nisbatan. */
  now: Date;
  onOpen: () => void;
  className?: string;
}

export function OrderHistoryRow({ order, dateLabel, now, onOpen, className }: OrderHistoryRowProps) {
  const { value, currency } = splitFormattedPrice(order.invoice.total);
  const fact = historyRowFact(order, now);

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

      {/*
        Nom oʻz qatorida: 360px da foto va strelka yonidagi ~204px ga nom
        (170px gacha) va narx (85px) birga sigʻmaydi. Narx holat bilan
        ikkinchi qatorda — holat qisqa, narx oʻngda toʻliq oʻqiladi.
      */}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-title text-text-primary">{order.categoryName}</span>

        <span className="mt-2 flex items-center justify-between gap-8">
          <StatusChip status={order.status} inline className="min-w-0" />
          <span className="tabular shrink-0 text-numeric-sm text-text-primary">
            {value} <span className="text-caption text-text-secondary">{currency}</span>
          </span>
        </span>

        <span className="mt-2 flex items-center gap-4 text-caption text-text-secondary">
          {order.rating && (
            <>
              <span
                className="inline-flex shrink-0 items-center gap-2 text-text-primary"
                aria-label={`Bahoingiz: ${order.rating.stars}`}
              >
                <Icon icon={Star} size={14} weight="fill" className="text-star" aria-hidden />
                <span className="tabular">{order.rating.stars}</span>
              </span>
              <span aria-hidden>·</span>
            </>
          )}
          <span className="min-w-0 truncate">{dateLabel}</span>
        </span>

        {/*
          Fakt (bekor sababi, xavfsizlik) oʻz satrida, ikki qatorgacha: sana
          bilan bitta satrga qoʻshilsa "Sabab: Usta belgil…" boʻlib qolar va
          qatordagi yagona yangi maʼlumot oʻqilmasdi.
        */}
        {fact && (
          <span className="mt-2 line-clamp-2 block text-caption text-text-secondary">{fact}</span>
        )}
      </span>

      <Icon icon={CaretRight} size={16} className="shrink-0 text-text-secondary" aria-hidden />
    </button>
  );
}
