import { CheckCircle, ClipboardText, Prohibit, Wrench } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { useLayoutEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { FilterTabs, type FilterTabItem } from '@/components/FilterTabs';
import { Header } from '@/components/Header';
import { OrderHistoryRow } from '@/components/order/OrderHistoryRow';
import { OrderListCard } from '@/components/order/OrderListCard';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import {
  adjacentHistoryFilter,
  countByHistoryFilter,
  EMPTY_CTA_LABELS,
  emptyStateFor,
  HISTORY_FILTERS,
  historyDateLabel,
  ORDER_ROUTES,
  splitOrderList,
  type EmptyCta,
  type ListAction,
  type OrderCounts,
} from '@/lib/orderList';
import {
  FILTER_TAB_LABELS,
  filterStepDirection,
  filterTabAriaLabel,
  formatTabCount,
  type FilterStep,
} from '@/lib/orderListView';
import type { HistoryFilter } from '@/lib/orderStateMachine';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { tapFeedback } from '../native';
import { PREVIEW_MAX_OFFSET } from '@/lib/swipe';
import { SwipeSurface } from './orders/SwipeSurface';
import { AppTabBar } from '../AppTabBar';
import { useApp } from '../store';

/**
 * 24 · Buyurtmalar — ildiz tab (orqaga strelka yoʻq, tab bar bor).
 *
 * Ikki zona: "Faol buyurtmalar" (boy karta, holatga bogʻliq amal) va tarix
 * (sana guruhlari kartalarida chek satrlari). Filtr — scroll qilmaydigan
 * tab qatori (`FilterTabs`), u `sticky`: uzun tarixda ham koʻrinib turadi.
 * Sonlar faqat `orders` massividan hisoblanadi. Boʻlish/saralash/guruhlash
 * `src/lib/orderList.ts` da, ekran matnlari `src/lib/orderListView.ts` da.
 *
 * Filtr uch yoʻl bilan almashadi: tab bosish, ← → klaviatura va roʻyxat
 * ustida gorizontal surish (`SwipeSurface`). Har safar roʻyxat `key` bilan
 * qayta chiziladi va yoʻnalish tomonidan siljib kiradi: tabda 12px, surishda
 * barmoq masofasi bilan bir xil 24px (`--list-enter-x`). `motion-safe` —
 * harakat kamaytirilgan boʻlsa roʻyxat shunchaki almashadi.
 *
 * Ichki ekranlarga `returnTo` uzatiladi: buyurtma sahifasidan "orqaga"
 * bosh sahifaga emas, shu tabga qaytadi.
 */
const RETURN_STATE = { returnTo: '/app/orders' } as const;

/** Tab bosilganda roʻyxat shuncha px yon tomondan kiradi; surishda — `PREVIEW_MAX_OFFSET`. */
const TAB_ENTER_OFFSET_PX = 12;

const EMPTY_ICONS: Record<HistoryFilter, IconGlyph> = {
  all: ClipboardText,
  active: Wrench,
  done: CheckCircle,
  cancelled: Prohibit,
};

/** Filtr va u qaysi tomondan, qancha masofadan kirgani — kirish animatsiyasi uchun birga. */
interface FilterView {
  filter: HistoryFilter;
  enterDirection: FilterStep;
  enterOffsetPx: number;
  /** Faqat surishda toʻldiriladi — ekran oʻquvchiga aytish uchun. */
  announcement: string;
}

const INITIAL_VIEW: FilterView = {
  filter: 'all',
  enterDirection: 0,
  enterOffsetPx: 0,
  announcement: '',
};

const buildTabItems = (counts: OrderCounts): FilterTabItem<HistoryFilter>[] =>
  HISTORY_FILTERS.map((filter) => ({
    key: filter,
    label: FILTER_TAB_LABELS[filter],
    ariaLabel: filterTabAriaLabel(filter, counts[filter]),
    count: formatTabCount(counts[filter]),
  }));

export function OrdersTab() {
  const navigate = useNavigate();
  const { orders } = useApp();
  const now = useMinuteClock();
  const [{ filter, enterDirection, enterOffsetPx, announcement }, setView] =
    useState<FilterView>(INITIAL_VIEW);
  const counts = useMemo(() => countByHistoryFilter(orders.map((order) => order.status)), [orders]);

  // Tab/klaviatura: tanlangan `role="tab"` holatni oʻzi eʼlon qiladi — jonli
  // hudud boʻsh qoladi, aks holda ikki marta oʻqilardi.
  const setFilter = (next: HistoryFilter) =>
    setView((view) => ({
      filter: next,
      enterDirection: filterStepDirection(view.filter, next),
      enterOffsetPx: TAB_ENTER_OFFSET_PX,
      announcement: '',
    }));

  // Surish: fokus oʻzgarmaydi, shuning uchun yangi filtr jonli hududda aytiladi.
  const swipeTo = (target: HistoryFilter) => {
    setView((view) => ({
      filter: target,
      enterDirection: filterStepDirection(view.filter, target),
      enterOffsetPx: PREVIEW_MAX_OFFSET,
      announcement: filterTabAriaLabel(target, counts[target]),
    }));
    void tapFeedback();
  };

  // Filtr almashganda roʻyxat tepadan koʻrinsin: eski scrollTop saqlansa,
  // foydalanuvchi yangi roʻyxatning oʻrtasiga yoki sarlavha yopishqoq tab
  // qatori ostiga tushib qolgan holatga kelardi.
  useLayoutEffect(() => {
    document.querySelector('[data-app-scroll]')?.scrollTo({ top: 0 });
  }, [filter]);
  const tabItems = useMemo(() => buildTabItems(counts), [counts]);
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

  const enterStyle = {
    '--list-enter-x': `${enterDirection * enterOffsetPx}px`,
  } as CSSProperties;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtmalar" />}
      footer={<AppTabBar active="orders" />}
      // Flex ustun: `SwipeSurface` qolgan joyni `flex-1` bilan toʻldiradi.
      className="flex flex-col"
    >
      <FilterTabs
        items={tabItems}
        value={filter}
        onChange={setFilter}
        ariaLabel="Buyurtma filtrlari"
        className="sticky top-0 z-10 shrink-0 bg-surface"
      />

      {/* Surish bilan almashgan filtr ekran oʻquvchiga ham aytiladi. */}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <SwipeSurface
        neighbour={(direction) => adjacentHistoryFilter(filter, direction)}
        onSwipe={swipeTo}
      >
        {/* `key` — filtr almashganda roʻyxat qaytadan kiradi (shaffoflik + yon siljish). */}
        <div key={filter} className="motion-safe:animate-list-enter" style={enterStyle}>
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
                <section className="pt-16">
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
                <div className={cn('flex flex-col gap-20', showsHistoryTitle ? 'mt-12' : 'pt-16')}>
                  {history.map((group) => (
                    <section key={group.title} aria-label={group.title}>
                      <h3 className="px-4 text-overline uppercase text-text-secondary">{group.title}</h3>
                      {/* Bitta guruh — bitta karta; qatorlar ingichka chiziq bilan ajraladi (chek). */}
                      <Card className="mt-8 overflow-hidden p-0">
                        <ul className="divide-y divide-border">
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
                      </Card>
                    </section>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="h-bottom-reserve" aria-hidden />
      </SwipeSurface>
    </ScreenShell>
  );
}
