import { CaretRight, Star } from '@phosphor-icons/react';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { StatusChip } from '@/components/StatusChip';
import { cn } from '@/lib/cn';
import { splitFormattedPrice } from '@/lib/formatters';
import { orderFactLine } from '@/lib/orderList';
import type { LiveOrder } from '@/app/types';
import { ServicePhoto } from './ServicePhoto';

/**
 * Tarix qatori (24-ekran, terminal buyurtmalar): nima · holat · qancha · qachon.
 *
 * Tugma YOʻQ — butun qator tafsilotga olib boradi; `OrderTracking` yopilgan
 * buyurtmani chekka, bekor qilingan/xavfsizlikdagini oʻz terminal
 * koʻrinishiga yoʻnaltiradi (qayta buyurtma, murojaat oʻsha yerda).
 * Yulduz faqat `order.rating` mavjud boʻlganda — yaʼni foydalanuvchi
 * haqiqatan baholagan CLOSED buyurtmada.
 */
export interface OrderHistoryRowProps {
  order: LiveOrder;
  /** `historyDateLabel()` natijasi: guruh "Bugun"/"Kecha" boʻlsa faqat soat. */
  dateLabel: string;
  /** "Yakunlandi: …" kabi faktlar shu vaqtga nisbatan. */
  now: Date;
  onOpen: () => void;
  className?: string;
}

export function OrderHistoryRow({ order, dateLabel, now, onOpen, className }: OrderHistoryRowProps) {
  const { value, currency } = splitFormattedPrice(order.invoice.total);
  const fact = orderFactLine(order, now);

  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-12 p-12 text-left transition-colors duration-press ease-std active:bg-surface-sunken"
      >
        <ServicePhoto
          serviceId={order.categoryId}
          iconKey={order.categoryIconKey}
          iconSize={24}
          className="h-[48px] w-[64px]"
        />

        {/*
          Nom oʻz qatorida: 360px ekranda foto va strelka yonidagi 192px ga
          nom (170px gacha) va narx birga sigʻmaydi. Narx holat chipi bilan
          ikkinchi qatorda — chip qisqa, narx oʻngda toʻliq oʻqiladi.
        */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-title text-text-primary">{order.categoryName}</p>

          <div className="mt-4 flex items-center justify-between gap-8">
            <StatusChip status={order.status} inline className="min-w-0 truncate" />
            <p className="tabular shrink-0 text-numeric-sm text-text-primary">
              {value} <span className="text-caption text-text-secondary">{currency}</span>
            </p>
          </div>

          <p className="mt-4 flex items-center gap-8 text-caption text-text-secondary">
            {order.rating && (
              <span
                className="inline-flex items-center gap-2 text-text-primary"
                aria-label={`Bahoingiz: ${order.rating.stars}`}
              >
                <Icon icon={Star} size={14} weight="fill" className="text-star" aria-hidden />
                <span className="tabular">{order.rating.stars}</span>
              </span>
            )}
            <span className="min-w-0 truncate">{dateLabel}</span>
          </p>

          {fact && <p className="mt-4 truncate text-caption text-text-secondary">{fact.text}</p>}
        </div>

        <Icon icon={CaretRight} size={16} className="shrink-0 text-text-secondary" />
      </button>
    </Card>
  );
}
