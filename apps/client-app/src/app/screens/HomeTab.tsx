import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { MasterSuggestionCard } from '@/components/MasterSuggestionCard';
import { SearchField } from '@/components/SearchField';
import { ServiceGroupTile } from '@/components/ServiceGroupTile';
import { StatusChip } from '@/components/StatusChip';
import { StatusBar } from '@/preview/StatusBar';
import { AppTabBar } from '../AppTabBar';
import { BottomInset } from '@/screens/_shared/ScreenShell';
import { MORE_ICON, serviceIcon, serviceIconSize } from '@/lib/serviceIcons';
import { formatDuration, formatPrice, formatQueuePosition } from '@/lib/formatters';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { SERVICE_GROUPS } from '@/mocks/serviceGroups';
import { MASTERS } from '@/mocks/masters';
import { USER } from '@/mocks/user';
import { HomeBanner } from '@/screens/stage1/HomeBanner';
import { useApp } from '../store';
import type { LiveOrder } from '../types';

const VISIBLE_GROUPS = 7;

/** Tavsiya blokida ikkita usta — referens maketdagi ikki ustunli qator. */
const SUGGESTED_MASTERS = Object.values(MASTERS).slice(0, 2);

/** Aktiv buyurtma kartasidagi ikkinchi qator — holatga qarab. */
function secondaryLine(order: LiveOrder): string | null {
  switch (order.status) {
    case ORDER_STATUS.SEARCHING:
      return 'Usta qidirilmoqda…';
    case ORDER_STATUS.SEARCHING_QUEUED:
      return order.queuePosition ? formatQueuePosition(order.queuePosition) : null;
    case ORDER_STATUS.ASSIGNED:
    case ORDER_STATUS.MASTER_EN_ROUTE:
      return order.etaMinutes ? `Taxminiy vaqt: ${formatDuration(order.etaMinutes)}` : null;
    case ORDER_STATUS.IN_PROGRESS:
      return order.master?.fullName ?? null;
    case ORDER_STATUS.COMPLETED_BY_MASTER:
      return 'Ishingiz yakunlandi';
    default:
      return null;
  }
}

export function HomeTab() {
  const navigate = useNavigate();
  const { activeOrder, phoneNumber, unreadCount } = useApp();
  const [query, setQuery] = useState('');

  const groups = SERVICE_GROUPS.slice(0, VISIBLE_GROUPS);

  return (
    <div className="flex h-full flex-col bg-surface">
      {/*
        Tepa blok qadalgan va SCROLL QILMAYDI.
        Turkuaz fon alohida qatlam sifatida absolyut joylashtirilgan va
        pastdan 56px yetmaydi — shu tufayli banner uning chetidan oshib,
        yarmi sahifa foniga tushadi (referensdagi qatlamlanish). Bannerni
        scroll konteyneriga salbiy margin bilan tiqish bu effektni bermaydi:
        scroll paytida u konteyner chetida keskin kesilardi.
      */}
      <div className="relative shrink-0">
        <div className="hero-field absolute inset-x-0 top-0 bottom-[72px] rounded-b-xl" aria-hidden />

        <div className="relative">
          <StatusBar />
          <Header
            variant="home"
            onHero
            name={USER.fullName}
            phone={phoneNumber}
            unreadCount={unreadCount}
            onNotificationsClick={() => navigate('/app/notifications')}
          />

          <div className="px-20 pt-4">
            <SearchField
              floating
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Xizmatlarni qidirish"
            />
          </div>

          <div className="px-20 pt-12">
            <HomeBanner onSelect={() => navigate('/app/services')} />
          </div>
        </div>
      </div>

      <main data-app-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-20">
        {activeOrder && (
          <section className="pt-16">
            <h2 className="text-h3 text-text-primary">Aktiv buyurtmangiz</h2>
            <Card className="mt-12 flex flex-col gap-12">
              <StatusChip status={activeOrder.status} className="self-start" />
              <div className="flex items-start justify-between gap-12">
                <p className="min-w-0 flex-1 text-title text-text-primary">
                  {activeOrder.categoryName}
                </p>
                <p className="tabular shrink-0 text-price text-text-primary">
                  {formatPrice(activeOrder.price)}
                </p>
              </div>
              {secondaryLine(activeOrder) && (
                <p className="text-body-sm text-text-secondary">{secondaryLine(activeOrder)}</p>
              )}
              <Button variant="primary" onClick={() => navigate(`/app/order/${activeOrder.id}`)}>
                {activeOrder.status === ORDER_STATUS.COMPLETED_BY_MASTER
                  ? 'Ishni baholash'
                  : 'Kuzatish'}
              </Button>
            </Card>
          </section>
        )}

        <h2 className="pt-16 text-h3 text-text-primary">Mashhur xizmatlar</h2>
        <div className="mt-12 grid grid-cols-4 gap-8 gap-y-12">
          {groups.map((group) => (
            <ServiceGroupTile
              key={group.id}
              label={group.name}
              icon={serviceIcon(group.iconKey)}
              iconSize={serviceIconSize(group.iconKey)}
              onClick={() => navigate(`/app/groups/${group.id}`)}
            />
          ))}
          <ServiceGroupTile
            label="Barchasi"
            icon={MORE_ICON}
            iconSize={serviceIconSize('more')}
            tone="neutral"
            onClick={() => navigate('/app/services')}
          />
        </div>

        <h2 className="pt-12 text-h3 text-text-primary">Sizga tavsiya etiladiganlar</h2>
        <ul className="mt-8 grid grid-cols-2 items-stretch gap-12">
          {SUGGESTED_MASTERS.map((master) => (
            <li key={master.id} className="min-w-0">
              <MasterSuggestionCard
                name={master.fullName}
                profession={master.profession}
                rating={master.ratingAvg}
                actionLabel="Buyurtma berish"
                onAction={() => navigate('/app/services')}
                onOpen={() => navigate(`/app/master/${master.id}`)}
              />
            </li>
          ))}
        </ul>

        <div className="h-4" aria-hidden />
      </main>

      <AppTabBar active="home" />
      <BottomInset />
    </div>
  );
}
