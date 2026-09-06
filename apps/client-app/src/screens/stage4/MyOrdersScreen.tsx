import { useMemo, useState } from 'react';
import { ClipboardList, SearchX } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { OrderCard } from '@/components/OrderCard';
import { SegmentControl } from '@/components/SegmentControl';
import { Skeleton, SkeletonCircle } from '@/components/Skeleton';
import { Spinner } from '@/components/Spinner';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { serviceIcon } from '@/lib/serviceIcons';
import {
  HISTORY_FILTER_LABELS,
  matchesHistoryFilter,
  type HistoryFilter,
} from '@/lib/orderStateMachine';
import { ORDER_HISTORY, NOW } from '@/mocks/orders';
import { UNREAD_COUNT } from '@/mocks/notifications';

/**
 * 24 · Buyurtmalarim.
 *
 * Filtrlar KLIENT tomonda ishlaydi — server bo'limlari emas. Ro'yxat
 * yangi-dan-eski tartibda keladi va UI uni QAYTA SARALAMAYDI
 * (14.5-band, 37-punkt).
 */
export type MyOrdersVariant = 'ready' | 'loading' | 'loading-more' | 'empty' | 'offline';

export interface MyOrdersScreenProps {
  variant?: MyOrdersVariant;
  initialFilter?: HistoryFilter;
}

const FILTERS: HistoryFilter[] = ['all', 'active', 'done', 'cancelled'];

function OrdersSkeleton() {
  return (
    <ul className="mt-16 flex flex-col gap-12">
      {Array.from({ length: 5 }, (_, index) => (
        <li key={index} className="flex items-center gap-12 rounded-lg bg-surface-elevated p-16">
          <SkeletonCircle size={44} />
          <div className="flex-1">
            <Skeleton width="55%" height={18} />
            <Skeleton width="35%" height={14} className="mt-8" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MyOrdersScreen({ variant = 'ready', initialFilter = 'all' }: MyOrdersScreenProps) {
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter);

  const orders = useMemo(
    () =>
      variant === 'empty'
        ? []
        : ORDER_HISTORY.filter((order) => matchesHistoryFilter(order.status, filter)),
    [filter, variant],
  );

  const isFilterEmpty = orders.length === 0 && variant !== 'empty';

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtmalarim" />}
      footer={<BottomNav active="orders" unreadCount={UNREAD_COUNT} onSelect={() => undefined} />}
    >
      {variant === 'offline' && <ConnectionBanner state="reconnecting" />}

      <SegmentControl
        value={filter}
        onChange={setFilter}
        options={FILTERS.map((value) => ({ value, label: HISTORY_FILTER_LABELS[value] }))}
      />

      {variant === 'loading' ? (
        <OrdersSkeleton />
      ) : variant === 'empty' ? (
        <EmptyState
          icon={ClipboardList}
          title="Hozircha buyurtmalaringiz yo'q"
          description="Birinchi buyurtmangizni bering"
          action={{ label: 'Ustani chaqirish', onClick: () => undefined }}
        />
      ) : isFilterEmpty ? (
        <EmptyState icon={SearchX} title="Hech narsa topilmadi" className="mt-24"
          inline
        />
      ) : (
        <>
          <ul className="mt-16 flex flex-col gap-12">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderCard
                  serviceIcon={serviceIcon(order.categoryIconKey)}
                  serviceName={order.categoryName}
                  status={order.status}
                  createdAt={order.createdAt}
                  now={NOW}
                  price={order.price}
                  onSelect={() => undefined}
                />
              </li>
            ))}
          </ul>

          {variant === 'loading-more' && (
            <div className="flex justify-center py-24">
              <Spinner size={20} className="text-primary" />
            </div>
          )}
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
