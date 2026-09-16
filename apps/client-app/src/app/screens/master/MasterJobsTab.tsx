import { ClipboardText, Info, Wrench } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DashedChip } from '@/components/DashedChip';
import { EmptyState } from '@/components/EmptyState';
import { FilterTabs, type FilterTabItem } from '@/components/FilterTabs';
import { Header } from '@/components/Header';
import { SelectableChip } from '@/components/SelectableChip';
import { Sheet } from '@/components/Sheet';
import { MasterJobCard } from '@/components/master/MasterJobCard';
import { ShiftHero } from '@/components/master/ShiftHero';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { HOME_ROUTE_FOR } from '@/lib/appMode';
import { formatTabCount } from '@/lib/orderListView';
import {
  ACCEPT_TOAST,
  acceptBlockedLine,
  adjacentMasterFilter,
  canAcceptOffer,
  countMasterJobs,
  DECLINE_TOAST,
  ETA_OPTIONS,
  ETA_SHEET_HINT,
  ETA_SHEET_TITLE,
  etaOptionLabel,
  MASTER_EMPTY_CTA_LABELS,
  MASTER_FILTER_LABELS,
  MASTER_FILTERS,
  MASTER_SOURCE_LINE,
  masterEmptyStateFor,
  splitMasterJobs,
  type MasterEmptyCta,
  type MasterJobFilter,
} from '@/lib/masterJobs';
import {
  buildSelfMaster,
  masterJobStats,
} from '@/lib/masterIdentity';
import {
  completedStepCount,
  firstIncompleteStep,
  REQUIRED_STEP_COUNT,
} from '@/lib/masterProfile';
import { canOpenShift } from '@/lib/masterShift';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { MasterTabBar } from '../../MasterTabBar';
import { SwipeSurface } from '../orders/SwipeSurface';
import { useMaster } from '../../master-store';
import { useApp } from '../../store';
import { useToast } from '../../ToastHost';

/**
 * «Ishlar» — usta uyi.
 *
 * Takliflar TOʻQILMAYDI: roʻyxatda shu qurilmada, mijoz rejimida berilgan
 * haqiqiy buyurtmalar turadi (TZ 0.1). Shuning uchun ekranda «sizga yaqin»,
 * masofa, taklif muddati yoki «N ta usta koʻrmoqda» kabi qator yoʻq —
 * bunday maʼlumot ilovada mavjud emas.
 *
 * Smena ochilganda mijoz tomonidagi taymer qidiruvdagi buyurtmaga TEGMAYDI:
 * qorovul `simulationStep` da, u `masterTakeover` bayrogʻini oʻqiydi.
 */
/** Boʻsh holat ikonasi — filtr qaysi roʻyxat boʻsh ekanini aytadi. */
const EMPTY_ICONS: Record<MasterJobFilter, IconGlyph> = {
  offers: Wrench,
  active: ClipboardText,
};

export function MasterJobsTab() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const showToast = useToast();
  const { orders, setRole, fullName, phoneNumber, masterAcceptOrder, createDemoOrder } = useApp();
  const {
    profile,
    isComplete,
    declinedOrderIds,
    declineOffer,
    openShift,
    closeShift,
  } = useMaster();

  const [filter, setFilter] = useState<MasterJobFilter>('offers');
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const input = useMemo(
    () => ({ declinedIds: declinedOrderIds, isAvailable: profile.isAvailable }),
    [declinedOrderIds, profile.isAvailable],
  );
  const counts = useMemo(() => countMasterJobs(orders, input), [orders, input]);
  const { offers, active } = useMemo(() => splitMasterJobs(orders, input), [orders, input]);

  const guard = { isComplete, hasActiveJob: active.length > 0 };
  const canAccept = canAcceptOffer(guard);
  const blockedHint = acceptBlockedLine(guard);
  const done = completedStepCount(profile);

  const tabItems: FilterTabItem<MasterJobFilter>[] = MASTER_FILTERS.map((key) => ({
    key,
    label: MASTER_FILTER_LABELS[key],
    ariaLabel: `${MASTER_FILTER_LABELS[key]}: ${counts[key]} ta`,
    count: formatTabCount(counts[key]),
  }));

  const empty = masterEmptyStateFor(filter, { isAvailable: profile.isAvailable, counts });
  const rows = filter === 'offers' ? offers : active;

  const goClientMode = () => {
    setRole('client');
    navigate(HOME_ROUTE_FOR.client);
  };

  const EMPTY_HANDLERS: Record<MasterEmptyCta, () => void> = {
    'open-shift': openShift,
    'client-mode': goClientMode,
    'show-offers': () => setFilter('offers'),
  };

  // Usta yozuvi HAR SAFAR yangidan yigʻiladi: ism, soha va statistika
  // oʻzgargan boʻlishi mumkin, muzlatilgan nusxa esa eskirgan maʼlumotni
  // mijoz buyurtmasiga yozib qoʻyardi.
  const acceptOffer = (etaMinutes: number) => {
    const orderId = pendingOrderId;
    setPendingOrderId(null);
    if (!orderId) return;

    const master = buildSelfMaster({
      fullName,
      phoneNumber,
      profession: profile.profession,
      experienceLevel: profile.experienceLevel,
      stats: masterJobStats(orders),
    });

    if (masterAcceptOrder(orderId, { master, etaMinutes })) {
      setFilter('active');
      showToast(ACCEPT_TOAST);
    }
  };

  const decline = (orderId: string) => {
    declineOffer(orderId);
    showToast(DECLINE_TOAST);
  };

  const createDemo = () => {
    const id = createDemoOrder();
    if (id) showToast('Sinov buyurtmasi yaratildi — u mijoz rejimida ham koʻrinadi.');
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Ishlar" />}
      footer={<MasterTabBar active="jobs" badges={{ jobs: counts.offers }} />}
      className="flex flex-col"
    >
      <ShiftHero
        profile={profile}
        now={now}
        onOpen={openShift}
        onClose={closeShift}
        disabled={!canOpenShift(isComplete)}
        disabledHint={`Profil ${done} / ${REQUIRED_STEP_COUNT} qadam toʻldirilgan — smena toʻliq profil bilan ochiladi.`}
        className="mt-4 shrink-0"
      />

      {!isComplete && (
        <Card className="mt-12 shrink-0">
          <p className="text-title text-text-primary">Usta profili toʻldirilmagan</p>
          <p className="mt-4 text-body-sm text-text-secondary">
            {done} / {REQUIRED_STEP_COUNT} qadam toʻldirildi. Profil toʻliq boʻlgunicha smena
            ochilmaydi va taklifni qabul qila olmaysiz.
          </p>
          <Button
            variant="secondary"
            className="mt-16"
            onClick={() => navigate(`/app/master/setup?step=${firstIncompleteStep(profile)}`)}
          >
            Profilni toʻldirish
          </Button>
        </Card>
      )}

      {/* Manba bayonoti — hech qachon yashirilmaydi (TZ 0.1). */}
      <Banner variant="info" icon={Info} className="mt-12 shrink-0">
        {MASTER_SOURCE_LINE}
      </Banner>

      <FilterTabs
        items={tabItems}
        value={filter}
        onChange={setFilter}
        ariaLabel="Ish filtrlari"
        className="mt-12 shrink-0 bg-surface"
      />

      <SwipeSurface
        neighbour={(direction) => adjacentMasterFilter(filter, direction)}
        onSwipe={(target) => setFilter(target)}
      >
        <div key={filter} className="motion-safe:animate-list-enter">
          {empty ? (
            <>
              <EmptyState
                inline
                icon={EMPTY_ICONS[filter]}
                title={empty.title}
                description={empty.description}
                action={{
                  label: MASTER_EMPTY_CTA_LABELS[empty.cta],
                  onClick: EMPTY_HANDLERS[empty.cta],
                  variant: 'secondary',
                }}
              />

              {/*
                Ekranni toʻldirish uchun SOXTA yozuv emas — haqiqiy buyurtma:
                tugma `createOrder` quvuridan oʻtadi va natija mijoz rejimida
                ham koʻrinadi (TZ 0.1).
              */}
              {filter === 'offers' && profile.isAvailable && (
                <div className="mt-16 flex flex-col items-center gap-8 px-20 text-center">
                  <DashedChip size="compact">Demo</DashedChip>
                  <p className="text-caption text-text-secondary">
                    Sinab koʻrish uchun shu qurilmada haqiqiy buyurtma yaratiladi.
                  </p>
                  <Button variant="ghost" fullWidth={false} onClick={createDemo}>
                    Demo · sinov buyurtmasi yaratish
                  </Button>
                </div>
              )}
            </>
          ) : (
            <ul className="mt-12 flex flex-col gap-12">
              {rows.map((order) => (
                <li key={order.id}>
                  <MasterJobCard
                    order={order}
                    now={now}
                    variant={filter === 'offers' ? 'offer' : 'active'}
                    onAccept={canAccept ? () => setPendingOrderId(order.id) : null}
                    onDecline={() => decline(order.id)}
                    blockedHint={blockedHint}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="h-bottom-reserve" aria-hidden />
      </SwipeSurface>

      {/* Yetib borish vaqtini USTA tanlaydi — qattiq yozilgan 15 daqiqa yoʻq. */}
      <Sheet
        open={pendingOrderId !== null}
        title={ETA_SHEET_TITLE}
        onClose={() => setPendingOrderId(null)}
      >
        <p className="text-body-sm text-text-secondary">{ETA_SHEET_HINT}</p>
        <div className="mt-16 flex flex-wrap gap-8">
          {ETA_OPTIONS.map((minutes) => (
            <SelectableChip key={minutes} selected={false} onSelect={() => acceptOffer(minutes)}>
              {etaOptionLabel(minutes)}
            </SelectableChip>
          ))}
        </div>
        <Button variant="ghost" className="mt-20" onClick={() => setPendingOrderId(null)}>
          Yopish
        </Button>
      </Sheet>
    </ScreenShell>
  );
}
