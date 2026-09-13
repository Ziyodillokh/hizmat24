import { CheckCircle, ClipboardText, Prohibit, Wrench } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { SelectableChip } from '@/components/SelectableChip';
import { OrderHistoryRow } from '@/components/order/OrderHistoryRow';
import { OrderListCard } from '@/components/order/OrderListCard';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import {
  countByHistoryFilter,
  EMPTY_CTA_LABELS,
  emptyStateFor,
  filterLabelWithCount,
  HISTORY_FILTERS,
  historyDateLabel,
  ORDER_ROUTES,
  splitOrderList,
  type EmptyCta,
  type ListAction,
  type OrderCounts,
} from '@/lib/orderList';
import type { HistoryFilter } from '@/lib/orderStateMachine';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { AppTabBar } from '../AppTabBar';
import { useApp } from '../store';

/**
 * 24 · Buyurtmalar — ildiz tab (orqaga strelka yoʻq, tab bar bor).
 *
 * Ikki zona: "Faol buyurtmalar" (boy karta, holatga bogʻliq amal) va tarix
 * (sana guruhlarida ixcham qatorlar). Filtr chiplaridagi sonlar faqat
 * `orders` massividan hisoblanadi. Barcha boʻlish/saralash/guruhlash
 * `src/lib/orderList.ts` da — ekran holatni qoʻlda tekshirmaydi.
 *
 * Ichki ekranlarga `returnTo` uzatiladi: buyurtma sahifasidan "orqaga"
 * bosh sahifaga emas, shu tabga qaytadi.
 */
const RETURN_STATE = { returnTo: '/app/orders' } as const;

const EMPTY_ICONS: Record<HistoryFilter, IconGlyph> = {
  all: ClipboardText,
  active: Wrench,
  done: CheckCircle,
  cancelled: Prohibit,
};

interface FilterChipsProps {
  value: HistoryFilter;
  counts: OrderCounts;
  onChange: (filter: HistoryFilter) => void;
}

/** Gorizontal aylanadigan chip qatori — sonlar bilan toʻrtta yorliq 390px ga sigʻmaydi. */
function FilterChips({ value, counts, onChange }: FilterChipsProps) {
  return (
    <div
      role="group"
      aria-label="Buyurtma filtrlari"
      className="-mx-20 flex gap-8 overflow-x-auto px-20 py-12 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {HISTORY_FILTERS.map((filter) => (
        <SelectableChip
          key={filter}
          selected={value === filter}
          onSelect={() => onChange(filter)}
          className="shrink-0 whitespace-nowrap"
        >
          {filterLabelWithCount(filter, counts[filter])}
        </SelectableChip>
      ))}
    </div>
  );
}

export function OrdersTab() {
  const navigate = useNavigate();
  const { orders } = useApp();
  const now = useMinuteClock();
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const counts = useMemo(() => countByHistoryFilter(orders.map((order) => order.status)), [orders]);
  const { active, history } = useMemo(
    () => splitOrderList(orders, filter, now),
    [orders, filter, now],
  );
  const empty = active.length === 0 && history.length === 0 ? emptyStateFor(filter, counts) : null;
  // "Barchasi" da ikkala zona ham koʻrinsa tarixga oʻz sarlavhasi kerak.
  const showsHistoryTitle = filter === 'all' && active.length > 0 && history.length > 0;

  const open = (orderId: string) => navigate(ORDER_ROUTES.detail(orderId), { state: RETURN_STATE });
  const runAction = (action: ListAction) =>
    navigate(action.route, { state: { ...RETURN_STATE, ...action.state } });

  const EMPTY_CTA_HANDLERS: Record<EmptyCta, () => void> = {
    services: () => navigate('/app/services'),
    'show-active': () => setFilter('active'),
    'show-all': () => setFilter('all'),
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtmalar" />}
      footer={<AppTabBar active="orders" />}
    >
      <FilterChips value={filter} counts={counts} onChange={setFilter} />

      {empty ? (
        <EmptyState
          icon={EMPTY_ICONS[counts.all === 0 ? 'all' : filter]}
          title={empty.title}
          description={empty.description}
          action={{ label: EMPTY_CTA_LABELS[empty.cta], onClick: EMPTY_CTA_HANDLERS[empty.cta] }}
          inline
        />
      ) : (
        <>
          {active.length > 0 && (
            <section className="mt-4">
              <div className="flex items-center gap-8">
                <h2 className="text-h3 text-text-primary">Faol buyurtmalar</h2>
                <span className="tabular inline-flex h-20 min-w-[20px] items-center justify-center rounded-full bg-primary-surface px-8 text-badge text-primary-pressed">
                  {active.length}
                </span>
              </div>
              <ul className="mt-12 flex flex-col gap-12">
                {active.map((order) => (
                  <li key={order.id}>
                    <OrderListCard
                      order={order}
                      now={now}
                      onOpen={() => open(order.id)}
                      onAction={runAction}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {showsHistoryTitle && <h2 className="mt-24 text-h3 text-text-primary">Tarix</h2>}

          {history.length > 0 && (
            <div className={cn('flex flex-col gap-20', showsHistoryTitle ? 'mt-12' : 'mt-4')}>
              {history.map((group) => (
                <section key={group.title}>
                  <h3 className="px-4 text-overline uppercase text-text-secondary">{group.title}</h3>
                  <ul className="mt-8 flex flex-col gap-8">
                    {group.orders.map((order) => (
                      <li key={order.id}>
                        <OrderHistoryRow
                          order={order}
                          dateLabel={historyDateLabel(order.createdAt, group.title, now)}
                          now={now}
                          onOpen={() => open(order.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
