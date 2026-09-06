import { Card } from '@/components/Card';
import { InfoChip } from '@/components/InfoChip';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/formatters';
import type { Order } from '@/mocks/types';

/** Buyurtma xulosasi — 12, 13, 14, 18-ekranlarda takrorlanadi. */
export interface OrderSummaryCardProps {
  order: Order;
  now: Date;
  className?: string;
}

export function OrderSummaryCard({ order, className }: OrderSummaryCardProps) {
  return (
    <Card className={cn('flex flex-col gap-8', className)}>
      <div className="flex items-start justify-between gap-12">
        <p className="min-w-0 flex-1 text-h3 text-text-primary">{order.categoryName}</p>
        <p className="shrink-0 text-price text-text-primary tabular">{formatPrice(order.price)}</p>
      </div>

      <p className="text-body-sm text-text-secondary">{order.address.label}</p>

      {order.isUrgent && (
        <InfoChip icon={Zap} tone="warning" className="mt-4 self-start">
          Shoshilinch
        </InfoChip>
      )}
    </Card>
  );
}
