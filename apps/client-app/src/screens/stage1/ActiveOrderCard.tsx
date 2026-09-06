import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { StatusChip } from '@/components/StatusChip';
import { cn } from '@/lib/cn';
import { formatDuration, formatPrice, formatQueuePosition } from '@/lib/formatters';
import { ORDER_STATUS, type OrderStatus } from '@/lib/orderStateMachine';
import type { Order } from '@/mocks/types';

/**
 * 06-ekran, 6-blok: aktiv buyurtma kartasi.
 *
 * Karta terminal bo'lmagan HAR BIR holat uchun bitta variantda chiziladi —
 * jami 6 variant. "Usta yetib keldi" bu ro'yxatda YO'Q: u holatda bosh sahifa
 * umuman ko'rsatilmaydi, 16-ekran majburan ochiladi (1-bo'lim, 4-qoida).
 */
export interface ActiveOrderCardProps {
  order: Order;
  className?: string;
}

/** Ikkinchi darajali qator — holatga qarab. `null` bo'lsa qator yashiriladi. */
function secondaryLine(order: Order): string | null {
  switch (order.status) {
    case ORDER_STATUS.SEARCHING:
      return 'Usta qidirilmoqda…';
    case ORDER_STATUS.SEARCHING_QUEUED:
      return order.queuePosition ? formatQueuePosition(order.queuePosition) : null;
    case ORDER_STATUS.ASSIGNED:
    case ORDER_STATUS.MASTER_EN_ROUTE:
      // Taxminiy vaqt yo'q bo'lsa qator butunlay yashiriladi — "0 daqiqa" yozilmaydi.
      return order.etaMinutes ? `Taxminiy vaqt: ${formatDuration(order.etaMinutes)}` : null;
    case ORDER_STATUS.IN_PROGRESS:
      return order.master?.fullName ?? null;
    case ORDER_STATUS.COMPLETED_BY_MASTER:
      return 'Ishingiz yakunlandi';
    default:
      return null;
  }
}

const actionLabel = (status: OrderStatus): string =>
  status === ORDER_STATUS.COMPLETED_BY_MASTER ? 'Ishni baholash' : 'Kuzatish';

export function ActiveOrderCard({ order, className }: ActiveOrderCardProps) {
  const secondary = secondaryLine(order);

  return (
    <Card className={cn('flex flex-col gap-12', className)}>
      <StatusChip status={order.status} className="self-start" />

      <div className="flex items-start justify-between gap-12">
        <p className="min-w-0 flex-1 text-h3 text-text-primary">{order.categoryName}</p>
        <p className="shrink-0 text-price text-text-primary tabular">{formatPrice(order.price)}</p>
      </div>

      {secondary && <p className="text-body-sm text-text-secondary">{secondary}</p>}

      <Button variant="primary">{actionLabel(order.status)}</Button>
    </Card>
  );
}
