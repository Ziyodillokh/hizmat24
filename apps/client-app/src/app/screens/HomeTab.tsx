import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Header } from '@/components/Header';
import { OrderMiniCard } from '@/components/OrderMiniCard';
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
import { HomeBanner } from '@/screens/stage1/HomeBanner';
import { useApp } from '../store';
import type { LiveOrder } from '../types';

const VISIBLE_GROUPS = 7;

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
  const { activeOrder, orders, phoneNumber, unreadCount } = useApp();
  const [query, setQuery] = useState('');

  const recent = orders.filter((order) => order.id !== activeOrder?.id).slice(0, 2);
  const groups = SERVICE_GROUPS.slice(0, VISIBLE_GROUPS);

  return (
    <div className="flex h-full flex-col bg-surface">
      {/* Yuqori blok qadalgan — scroll faqat undan pastda. */}
      {/* Hero maydoni endi IKKALA temada ham bir xil material. Ilgari Lightʼda
          yorqin tsian plastinka turar, Darkʼda esa blok butunlay oʻchirilardi —
          ikki tema ikki xil mahsulot boʻlib koʻrinardi. */}
      <div className="hero-field shrink-0 rounded-b-xl">
        <StatusBar />
        <Header
          variant="home"
          onHero
          phone={phoneNumber}
          unreadCount={unreadCount}
          onNotificationsClick={() => navigate('/app/notifications')}
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

      <main data-app-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-20 pt-12">
        <HomeBanner onSelect={() => navigate('/app/services')} />

        <h2 className="mt-20 text-h3 text-text-primary">Xizmat turlari</h2>
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

        {activeOrder ? (
          <section className="mt-16">
            <h2 className="text-h3 text-text-primary">Aktiv buyurtmangiz</h2>
            <Card className="mt-12 flex flex-col gap-12">
              <StatusChip status={activeOrder.status} className="self-start" />
              <div className="flex items-start justify-between gap-12">
                <p className="min-w-0 flex-1 text-h3 text-text-primary">
                  {activeOrder.categoryName}
                </p>
                <p className="shrink-0 text-price text-text-primary tabular">
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
        ) : recent.length > 0 ? (
          <section className="mt-16">
            <div className="flex items-center justify-between gap-12">
              <h2 className="text-h3 text-text-primary">Soʻnggi buyurtmalaringiz</h2>
              <Button
                variant="ghost"
                size="small"
                fullWidth={false}
                onClick={() => navigate('/app/orders')}
              >
                Barchasini koʻrish
              </Button>
            </div>
            {/* Referensdagi ikki ustunli naqsh — lekin kartada usta emas, buyurtma. */}
            <ul className="mt-12 grid grid-cols-2 gap-12">
              {recent.map((order) => (
                <li key={order.id} className="min-w-0">
                  <OrderMiniCard
                    serviceIcon={serviceIcon(order.categoryIconKey)}
                    serviceName={order.categoryName}
                    status={order.status}
                    price={order.price}
                    actionLabel="Batafsil"
                    onSelect={() => navigate(`/app/order/${order.id}`)}
                    onAction={() => navigate(`/app/order/${order.id}`)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : (
          /*
            Ilgari bu yerda ekran oʻrtasida suzib turgan ikona va matn bor edi —
            u sahifaning qolgan qismi bilan bogʻlanmagandek koʻrinardi. Karta
            ichidagi taklif esa tugallangan blok boʻlib oʻqiladi.
          */
          <Card className="mt-20 flex items-center gap-16">
            <span className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-md bg-surface-sunken">
              <Icon icon={ClipboardList} size={24} className="text-text-secondary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-title text-text-primary">
                Hozircha buyurtmangiz yoʻq
              </p>
              <p className="mt-2 text-body-sm text-text-secondary">
                Kerakli xizmatni tanlang — ustani biz topamiz
              </p>
            </div>
          </Card>
        )}

        <div className="h-bottom-reserve" aria-hidden />
      </main>

      <AppTabBar active="home" />
      <BottomInset />
    </div>
  );
}
