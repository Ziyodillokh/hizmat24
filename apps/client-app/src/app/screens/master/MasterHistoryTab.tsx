import { ClockCounterClockwise } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FilterTabs, type FilterTabItem } from '@/components/FilterTabs';
import { Header } from '@/components/Header';
import { MasterHistoryRow } from '@/components/master/MasterHistoryRow';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { HISTORY_SOURCE_CAPTION } from '@/lib/masterEarnings';
import { isMyJob } from '@/lib/masterJobs';
import {
  adjacentHistoryFilter,
  countByHistoryFilter,
  groupOrdersByDate,
  historyDateLabel,
} from '@/lib/orderList';
import { formatTabCount } from '@/lib/orderListView';
import {
  HISTORY_FILTER_LABELS,
  isTerminal,
  matchesHistoryFilter,
  type HistoryFilter,
} from '@/lib/orderStateMachine';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { MASTER_TAB_ROUTES } from '../../masterTabRoutes';
import { MasterTabBar } from '../../MasterTabBar';
import { SwipeSurface } from '../orders/SwipeSurface';
import { useApp } from '../../store';

/**
 * «Tarix» — usta OʻZI qabul qilgan ishlar.
 *
 * Roʻyxat `handledByMaster` boʻyicha qatʼiy filtrlanadi: demo taymer mock
 * ustaga bergan buyurtmalar bu yerda koʻrinmaydi, aks holda usta oʻzi
 * bajarmagan ishni oʻz tarixida koʻrardi.
 *
 * Filtr lugʻati MIJOZNIKI bilan bir xil (`HISTORY_FILTER_LABELS`) — bitta
 * ilovada bitta soʻz bitta maʼnoni bildiradi.
 */
const MASTER_HISTORY_FILTERS: readonly HistoryFilter[] = ['all', 'done', 'cancelled'];

export function MasterHistoryTab() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { orders } = useApp();
  const [filter, setFilter] = useState<HistoryFilter>('all');

  // Faqat usta yuritgan va allaqachon yopilgan ishlar; faol ish «Ishlar» da.
  const mine = useMemo(
    () => orders.filter((order) => order.handledByMaster && isTerminal(order.status)),
    [orders],
  );
  const counts = useMemo(() => countByHistoryFilter(mine.map((order) => order.status)), [mine]);
  const groups = useMemo(
    () => groupOrdersByDate(mine.filter((order) => matchesHistoryFilter(order.status, filter)), now),
    [mine, filter, now],
  );

  const activeCount = useMemo(() => orders.filter(isMyJob).length, [orders]);

  const tabItems: FilterTabItem<HistoryFilter>[] = MASTER_HISTORY_FILTERS.map((key) => ({
    key,
    label: HISTORY_FILTER_LABELS[key],
    ariaLabel: `${HISTORY_FILTER_LABELS[key]}: ${counts[key]} ta`,
    count: formatTabCount(counts[key]),
  }));

  return (
    <ScreenShell
      header={<Header variant="inner" title="Tarix" />}
      footer={<MasterTabBar active="history" />}
      className="flex flex-col"
    >
      <FilterTabs
        items={tabItems}
        value={filter}
        onChange={setFilter}
        ariaLabel="Tarix filtrlari"
        className="shrink-0 bg-surface"
      />

      <SwipeSurface
        neighbour={(direction) => {
          const next = adjacentHistoryFilter(filter, direction);
          // Mijozdagi «Faol» filtri bu yerda yoʻq — uni oʻtkazib yuboramiz.
          return next === 'active' ? adjacentHistoryFilter(next, direction) : next;
        }}
        onSwipe={(target) => setFilter(target)}
      >
        <div key={filter} className="motion-safe:animate-list-enter">
          {groups.length === 0 ? (
            <EmptyState
              inline
              icon={ClockCounterClockwise}
              title={activeCount > 0 ? 'Yakunlangan ish hali yoʻq' : 'Yakunlangan ish yoʻq'}
              description={
                activeCount > 0
                  ? 'Faol ishni yakunlaganingizdan keyin u shu yerga tushadi.'
                  : 'Siz bajargan ishlar shu yerda va Daromad boʻlimida koʻrinadi.'
              }
              action={{
                label: 'Ishlarga oʻtish',
                onClick: () => navigate(MASTER_TAB_ROUTES.jobs),
                variant: 'secondary',
              }}
            />
          ) : (
            <div className="mt-12 flex flex-col gap-20">
              {groups.map((group) => (
                <section key={group.title} aria-label={group.title}>
                  <h2 className="px-4 text-overline uppercase text-text-secondary">{group.title}</h2>
                  <Card className="mt-8 overflow-hidden p-0">
                    <ul className="divide-y divide-border">
                      {group.orders.map((order) => (
                        <li key={order.id}>
                          <MasterHistoryRow
                            order={order}
                            dateLabel={historyDateLabel(order.createdAt, group.title, now)}
                            onOpen={() => navigate(`/app/master/jobs/${order.id}`)}
                          />
                        </li>
                      ))}
                    </ul>
                  </Card>
                </section>
              ))}
            </div>
          )}

          <p className="mt-16 px-4 text-center text-caption text-text-secondary">
            {HISTORY_SOURCE_CAPTION}
          </p>
        </div>

        <div className="h-bottom-reserve" aria-hidden />
      </SwipeSurface>
    </ScreenShell>
  );
}
