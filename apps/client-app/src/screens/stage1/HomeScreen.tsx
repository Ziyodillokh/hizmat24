import { ClipboardText } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import { BottomNav } from '@/components/BottomNav';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { OrderMiniCard } from '@/components/OrderMiniCard';
import { SearchField } from '@/components/SearchField';
import { ServiceGroupTile } from '@/components/ServiceGroupTile';
import { Skeleton, SkeletonCircle } from '@/components/Skeleton';
import { StatusBar } from '@/preview/StatusBar';
import { MORE_ICON, serviceIcon } from '@/lib/serviceIcons';
import { ORDER_STATUS, type OrderStatus } from '@/lib/orderStateMachine';
import { SERVICE_GROUPS } from '@/mocks/serviceGroups';
import { ORDERS, ORDER_HISTORY, NOW } from '@/mocks/orders';
import { USER } from '@/mocks/user';
import { HomeBanner } from './HomeBanner';
import { ActiveOrderCard } from './ActiveOrderCard';

/** Gridʼda birinchi 7 ta guruh + doimiy "Barchasi" katakchasi (06-ekran). */
const VISIBLE_GROUPS = 7;

export type HomeVariant =
  | 'active-order'
  | 'no-active-order'
  | 'no-orders'
  | 'loading';

export interface HomeScreenProps {
  variant?: HomeVariant;
  /** Aktiv buyurtma kartasining holati — 6 variantdan biri. */
  activeStatus?: OrderStatus;
}

function HomeSkeleton() {
  return (
    <>
      <Skeleton height={56} radius="md" />
      <Skeleton height={140} radius="lg" className="mt-20" />
      <Skeleton width={140} height={24} className="mt-24" />
      <div className="mt-12 grid grid-cols-4 gap-12">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex flex-col items-center gap-8">
            <SkeletonCircle size={72} />
            <Skeleton width="80%" height={12} />
          </div>
        ))}
      </div>
      <Skeleton height={96} radius="lg" className="mt-24" />
    </>
  );
}

export function HomeScreen({ variant = 'active-order', activeStatus }: HomeScreenProps) {
  const [query, setQuery] = useState('');

  const activeOrder = useMemo(() => {
    if (variant !== 'active-order') return null;
    const status = activeStatus ?? ORDER_STATUS.ASSIGNED;
    return ORDERS.find((order) => order.status === status) ?? null;
  }, [variant, activeStatus]);

  const recentOrders = ORDER_HISTORY.filter((order) =>
    [ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED].includes(
      order.status as typeof ORDER_STATUS.CLOSED,
    ),
  ).slice(0, 2);

  const groups = SERVICE_GROUPS.slice(0, VISIBLE_GROUPS);

  return (
    <div className="flex h-full min-h-full flex-col bg-surface">
      {/*
        Light temadagi dekorativ turkuaz blok: status bar, header va qidiruv
        panelining orqasidan oʻtadi (2.1-band, 3-punkt). Dark temada blok yoʻq —
        fon oddiy `surface` ga qaytadi, yaʼni koʻzga koʻrinmaydi.
      */}
      <div className="bg-surface-hero [[data-theme='dark']_&]:bg-surface">
        <StatusBar />
        <Header
          variant="home"
          onHero
          name={USER.fullName}
          phone={USER.phoneNumber}
          now={NOW}
        />
        <div className="px-20 pb-12 pt-4">
          <SearchField
            floating
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Xizmat qidirish"
          />
        </div>
      </div>

      <main className="flex-1 px-20 pt-12">
        {variant === 'loading' ? (
          <HomeSkeleton />
        ) : (
          <>
            <HomeBanner />

            <h2 className="mt-16 text-h2 text-text-primary">Xizmat turlari</h2>
            <div className="mt-12 grid grid-cols-4 gap-8 gap-y-12">
              {groups.map((group) => (
                <ServiceGroupTile
                  key={group.id}
                  label={group.name}
                  icon={serviceIcon(group.iconKey)}
                />
              ))}
              <ServiceGroupTile label="Barchasi" icon={MORE_ICON} />
            </div>

            {activeOrder && (
              <section className="mt-16">
                <h2 className="text-h2 text-text-primary">Aktiv buyurtmangiz</h2>
                <ActiveOrderCard order={activeOrder} className="mt-12" />
              </section>
            )}

            {variant === 'no-active-order' && (
              <section className="mt-16">
                <div className="flex items-center justify-between gap-12">
                  <h2 className="text-h2 text-text-primary">Soʻnggi buyurtmalaringiz</h2>
                  <Button variant="ghost" size="small" fullWidth={false}>
                    Barchasini koʻrish
                  </Button>
                </div>
                <ul className="mt-12 grid grid-cols-2 gap-12">
                  {recentOrders.map((order) => (
                    <li key={order.id} className="min-w-0">
                      <OrderMiniCard
                        serviceIcon={serviceIcon(order.categoryIconKey)}
                        serviceName={order.categoryName}
                        status={order.status}
                        price={order.price}
                        actionLabel="Batafsil"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {variant === 'no-orders' && (
              <EmptyState
                icon={ClipboardText}
                title="Hozircha buyurtmalaringiz yoʻq"
                description="Birinchi buyurtmangizni bering"
                action={{ label: 'Ustani chaqirish', onClick: () => undefined }}
                inline
                className="mt-8"
              />
            )}
          </>
        )}

        <div className="h-bottom-reserve" aria-hidden />
      </main>

      <BottomNav
        active="home"
        onSelect={() => undefined}
      />
      <div className="h-home-indicator shrink-0" aria-hidden />
    </div>
  );
}
