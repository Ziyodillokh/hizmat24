import { Info, Money, SealPercent } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { MasterHistoryRow } from '@/components/master/MasterHistoryRow';
import { MenuGroup, type MenuSection } from '@/components/MenuGroup';
import { ShareBar } from '@/components/ShareBar';
import { StatTile } from '@/components/wallet/StatTile';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import {
  EMPTY_VALUE,
  formatDayLabel,
  formatMonthShort,
  formatPrice,
  formatRating,
  splitFormattedPrice,
} from '@/lib/formatters';
import {
  buildMasterEarnings,
  COLLECTED_BANNER,
  COLLECTED_OVERLINE,
  collectedCaption,
  COMMISSION_ROW_HINT,
  isEarningOrder,
  ratingHint,
} from '@/lib/masterEarnings';
import { sortByCreatedDesc } from '@/lib/orderList';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { MASTER_TAB_ROUTES } from '../../masterTabRoutes';
import { MasterTabBar } from '../../MasterTabBar';
import { useApp } from '../../store';

/**
 * «Daromad» — naqd qoʻlga tekkan summa.
 *
 * Har bir raqam shu qurilmadagi YOPILGAN ishlarning muzlatilgan summasidan
 * chiqadi. «Balans», «hisobim», «pul yechish» va «qarz» soʻzlari ekranda
 * yoʻq: ilova pulni saqlamaydi ham, oʻtkazmaydi ham.
 *
 * Komissiya foizi belgilanmagan, shuning uchun sof daromad hisoblanmaydi va
 * bu birinchi qatorda aytiladi (TZ 0.3).
 */
const RECENT_LIMIT = 5;

export function MasterEarningsTab() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { orders } = useApp();

  const view = useMemo(() => buildMasterEarnings(orders, now), [orders, now]);
  const recent = useMemo(
    () => sortByCreatedDesc(orders.filter(isEarningOrder)).slice(0, RECENT_LIMIT),
    [orders],
  );

  const total = splitFormattedPrice(view.totalEarned);
  const caption = collectedCaption(view);

  const account: MenuSection = {
    title: 'Hisob',
    items: [
      // `onSelect` YOʻQ — qator maʼlumot beradi, hech qayerga olib bormaydi.
      { icon: SealPercent, label: 'Komissiya', hint: COMMISSION_ROW_HINT },
    ],
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Daromad" />}
      footer={<MasterTabBar active="earnings" />}
    >
      {/* Bayonot eng katta raqamdan TEPADA turadi. */}
      <Banner variant="info" icon={Info} className="mt-4">
        {COLLECTED_BANNER}
      </Banner>

      {view.completedCount === 0 ? (
        <EmptyState
          inline
          icon={Money}
          title="Hali daromad yoʻq"
          description="Ish yakunlanib, mijoz uni baholagach summa shu yerda koʻrinadi."
          action={{
            label: 'Ishlarga oʻtish',
            onClick: () => navigate(MASTER_TAB_ROUTES.jobs),
            variant: 'secondary',
          }}
        />
      ) : (
        <>
          <section className="banner-field mt-12 rounded-lg p-16 text-on-primary-deep">
            <p className="text-overline uppercase text-on-primary-deep">{COLLECTED_OVERLINE}</p>
            <p className="tabular mt-4 text-h1 text-on-primary-deep">
              {total.value} <span className="text-currency">{total.currency}</span>
            </p>
            {caption && <p className="mt-4 text-caption text-on-primary-deep">{caption}</p>}
          </section>

          <div className="mt-12 grid grid-cols-2 gap-8">
            <StatTile
              label="Yakunlangan ish"
              value={String(view.completedCount)}
              hint="Tarixni koʻrish"
              onSelect={() => navigate(MASTER_TAB_ROUTES.history)}
            />
            <StatTile
              label="Oʻrtacha baho"
              value={view.ratingAvg === null ? EMPTY_VALUE : formatRating(view.ratingAvg)}
              hint={ratingHint(view)}
              onSelect={() => navigate(MASTER_TAB_ROUTES.history)}
            />
          </div>

          {view.hasTrend && (
            <section>
              <h2 className="mt-20 px-4 text-overline uppercase text-text-secondary">Oxirgi 6 oy</h2>
              <Card className="mt-8 p-0">
                {view.months.map((row, index) => (
                  <div
                    key={row.monthStart.toISOString()}
                    role="group"
                    aria-label={`${formatMonthShort(row.monthStart)}: ${formatPrice(row.amount)}`}
                    className={index > 0 ? 'flex items-center gap-12 border-t border-border px-12 py-8' : 'flex items-center gap-12 px-12 py-8'}
                  >
                    <p className="shrink-0 basis-[64px] truncate text-body-sm text-text-secondary">
                      {formatMonthShort(row.monthStart)}
                    </p>
                    <ShareBar value={row.percent} className="min-w-0 flex-1" />
                    <p className="tabular shrink-0 text-numeric-sm text-text-primary">
                      {formatPrice(row.amount)}
                    </p>
                  </div>
                ))}
              </Card>
            </section>
          )}

          <section>
            <h2 className="mt-20 px-4 text-overline uppercase text-text-secondary">Soʻnggi ishlar</h2>
            <Card className="mt-8 overflow-hidden p-0">
              <ul className="divide-y divide-border">
                {recent.map((order) => (
                  <li key={order.id}>
                    <MasterHistoryRow
                      order={order}
                      dateLabel={formatDayLabel(order.completedAt ?? order.createdAt, now)}
                      onOpen={() => navigate(`/app/master/jobs/${order.id}`)}
                    />
                  </li>
                ))}
              </ul>
            </Card>
            {view.completedCount > recent.length && (
              <Button
                variant="ghost"
                className="mt-8"
                onClick={() => navigate(MASTER_TAB_ROUTES.history)}
              >
                Barchasini koʻrish
              </Button>
            )}
          </section>

          <MenuGroup section={account} />
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
