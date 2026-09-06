import { XCircle } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { StatusBar } from '@/preview/StatusBar';
import { BottomInset } from '@/screens/_shared/ScreenShell';
import { OrderSummaryCard } from '@/screens/_shared/OrderSummaryCard';
import { cn } from '@/lib/cn';
import { ORDERS_BY_ID, NOW } from '@/mocks/orders';
import type { CancelledBy } from '@/mocks/types';

/**
 * 22 · Buyurtma bekor qilindi — TERMINAL.
 *
 * Stepper yoʻq. Chek va baholash tugmasi ham yoʻq (14.3-band, 19-punkt).
 */
export interface OrderCancelledScreenProps {
  cancelledBy?: CancelledBy;
}

/**
 * Kim bekor qilgani uch xil rangda koʻrsatiladi: usta bekor qilgani mijoz
 * uchun kutilmagan hodisa, shuning uchun u `warning` tusida (11-boʻlim, 22-ekran).
 */
const CANCELLED_BY: Record<CancelledBy, { label: string; className: string }> = {
  CLIENT: { label: 'Siz bekor qildingiz', className: 'text-text-secondary' },
  MASTER: { label: 'Usta bekor qildi', className: 'text-warning' },
  SYSTEM: { label: 'Tizim bekor qildi', className: 'text-text-secondary' },
};

export function OrderCancelledScreen({ cancelledBy = 'CLIENT' }: OrderCancelledScreenProps) {
  const order = ORDERS_BY_ID['o-cancelled'];
  const actor = CANCELLED_BY[cancelledBy];

  return (
    <div className="flex h-full min-h-full flex-col bg-surface">
      <StatusBar />

      <main className="flex flex-1 flex-col items-center px-20 pt-32">
        <Icon icon={XCircle} size={64} className="text-text-secondary" />

        <h1 className="mt-20 text-center text-h1 text-text-primary">Buyurtma bekor qilindi</h1>

        {order.cancelReason && (
          <p className="mt-8 text-center text-body text-text-secondary">{order.cancelReason}</p>
        )}
        <p className={cn('mt-4 text-body-sm', actor.className)}>{actor.label}</p>

        <OrderSummaryCard order={order} now={NOW} className="mt-24 w-full" />
      </main>

      <div className="shrink-0 px-20 pb-12 pt-24">
        <Button variant="primary">Qayta buyurtma berish</Button>
      </div>

      <BottomInset />
    </div>
  );
}
