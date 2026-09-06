import { MagnifyingGlass, Timer, Wrench, XCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { InfoChip } from '@/components/InfoChip';
import { MasterCard } from '@/components/MasterCard';
import { Modal } from '@/components/Modal';
import { ProgressBar } from '@/components/ProgressBar';
import { RadarBlock } from '@/components/RadarBlock';
import { SelectableChip } from '@/components/SelectableChip';
import { Sheet } from '@/components/Sheet';
import { Stepper } from '@/components/Stepper';
import { Textarea } from '@/components/Textarea';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { canCancel, isMasterPhoneVisible, ORDER_STATUS } from '@/lib/orderStateMachine';
import { formatDuration, formatPrice } from '@/lib/formatters';
import { useApp } from '../store';
import { useToast } from '../ToastHost';
import { warnFeedback } from '../native';
import type { LiveOrder } from '../types';

const REASONS = [
  'Fikrimdan qaytdim',
  'Juda uzoq kutdim',
  "Muammo oʻzi hal boʻldi",
  "Narx toʻgʻri kelmadi",
  'Boshqa sabab',
] as const;

const OTHER = 'Boshqa sabab';
const REASON_MIN = 3;

/** Buyurtma xulosasi — barcha kuzatuv holatlarida bir xil. */
function Summary({ order }: { order: LiveOrder }) {
  return (
    <Card className="mt-16 flex flex-col gap-8">
      <div className="flex items-start justify-between gap-12">
        <p className="min-w-0 flex-1 text-h3 text-text-primary">{order.categoryName}</p>
        <p className="shrink-0 text-price text-text-primary tabular">{formatPrice(order.price)}</p>
      </div>
      <p className="text-body-sm text-text-secondary">{order.address.label}</p>
      {order.isUrgent && (
        <InfoChip icon={Timer} tone="warning" className="mt-4 self-start">
          Shoshilinch
        </InfoChip>
      )}
    </Card>
  );
}

/**
 * Demo boshqaruvi — backend ulanmagunicha holatni qoʻlda surish uchun.
 *
 * Ataylab mahsulot tugmalaridan farq qiladi: uzuq chegara va ikkilamchi rang.
 * Ilgari ular oddiy `ghost` tugma edi va `primary` rangda chiqib, haqiqiy
 * amal kabi koʻrinardi — foydalanuvchi ularni ilovaning bir qismi deb
 * oʻylashi mumkin edi.
 */
function DemoAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-12 inline-flex h-[32px] items-center rounded-full border border-dashed border-border-strong px-12 text-caption text-text-secondary"
    >
      Demo · {label}
    </button>
  );
}

export function OrderTracking() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { findOrder, cancelOrder, advanceOrder } = useApp();
  const showToast = useToast();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const order = orderId ? findOrder(orderId) : undefined;
  if (!order) return <Navigate to="/app/home" replace />;

  // Usta yetib kelgan boʻlsa — bloklovchi ekran majburan ochiladi.
  if (order.status === ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION) {
    return <Navigate to={`/app/order/${order.id}/confirm-master`} replace />;
  }
  if (order.status === ORDER_STATUS.COMPLETED_BY_MASTER) {
    return <Navigate to={`/app/order/${order.id}/rate`} replace />;
  }
  if (order.status === ORDER_STATUS.CLOSED) {
    return <Navigate to={`/app/order/${order.id}/receipt`} replace />;
  }

  const isOther = reason === OTHER;
  const canSubmitCancel = isOther ? note.trim().length >= REASON_MIN : reason !== null;

  const submitCancel = () => {
    cancelOrder(order.id, isOther ? note.trim() : (reason ?? ''));
    setConfirmOpen(false);
    setSheetOpen(false);
    void warnFeedback();
    showToast('Buyurtma bekor qilindi');
  };

  const isTerminal =
    order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.SAFETY_FLAGGED;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma" onBack={() => navigate('/app/home')} />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            {isMasterPhoneVisible(order.status) && order.master?.phoneNumber && (
              <a
                href={`tel:${order.master.phoneNumber}`}
                className="flex h-[52px] w-full items-center justify-center rounded-md bg-primary px-20 text-button text-on-primary"
              >
                Qoʻngʻiroq qilish
              </a>
            )}
            {canCancel(order.status) && (
              <Button variant="secondary" onClick={() => setSheetOpen(true)}>
                Bekor qilish
              </Button>
            )}
            {isTerminal && (
              <Button variant="primary" onClick={() => navigate('/app/services')}>
                Qayta buyurtma berish
              </Button>
            )}
          </div>
        </StickyFooter>
      }
    >
      <Stepper status={order.status} className="-mx-20" />

      {order.status === ORDER_STATUS.SEARCHING && (
        <div className="mt-32 flex flex-col items-center">
          <RadarBlock icon={MagnifyingGlass} />
          <h2 className="mt-24 text-h2 text-text-primary">Usta qidirilmoqda…</h2>
          <DemoAction label="ustani darhol topish" onClick={() => advanceOrder(order.id)} />
        </div>
      )}

      {order.status === ORDER_STATUS.SEARCHING_QUEUED && (
        <div className="mt-32 flex flex-col items-center">
          <p className="text-display text-text-primary tabular">~{order.queuePosition}</p>
          <p className="mt-8 text-body text-text-primary">Navbatdagi oʻrningiz</p>
          <p className="mt-4 text-body-sm text-text-secondary">
            Taxminiy kutish: {formatDuration(20)}
          </p>
          <DemoAction label="navbatdan chiqarish" onClick={() => advanceOrder(order.id)} />
        </div>
      )}

      {(order.status === ORDER_STATUS.ASSIGNED ||
        order.status === ORDER_STATUS.MASTER_EN_ROUTE) &&
        order.master && (
          <>
            <MasterCard
              name={order.master.fullName}
              profession={order.master.profession}
              rating={order.master.ratingAvg}
              completedOrders={order.master.completedOrdersCount}
              photoUrl={order.master.photoUrl}
              experience={order.master.experienceLevel === 'EXPERIENCED' ? 'experienced' : 'new'}
              isCertified={order.master.hasGovCertificate}
              onOpen={() => navigate(`/app/master/${order.master?.id}`)}
              className="mt-20"
            />
            {order.etaMinutes !== null && (
              <div className="mt-16">
                <p className="text-h3 text-text-primary">
                  {formatDuration(order.etaMinutes)}da yetib keladi
                </p>
                {order.status === ORDER_STATUS.MASTER_EN_ROUTE && (
                  <ProgressBar value={72} className="mt-12" />
                )}
              </div>
            )}
            <DemoAction label="keyingi bosqich" onClick={() => advanceOrder(order.id)} />
          </>
        )}

      {order.status === ORDER_STATUS.IN_PROGRESS && order.master && (
        <>
          <MasterCard
            name={order.master.fullName}
            profession={order.master.profession}
            rating={order.master.ratingAvg}
            completedOrders={order.master.completedOrdersCount}
              photoUrl={order.master.photoUrl}
            experience={order.master.experienceLevel === 'EXPERIENCED' ? 'experienced' : 'new'}
            isCertified={order.master.hasGovCertificate}
            className="mt-20"
          />
          <Banner variant="info" icon={Wrench} className="mt-16">
            Usta ishni boshladi
          </Banner>
          <DemoAction label="ishni yakunlash" onClick={() => advanceOrder(order.id)} />
        </>
      )}

      {order.status === ORDER_STATUS.CANCELLED && (
        <div className="mt-32 flex flex-col items-center">
          <XCircle size={64} strokeWidth={1.75} className="text-text-secondary" />
          <h1 className="mt-20 text-center text-h1 text-text-primary">Buyurtma bekor qilindi</h1>
          {order.cancelReason && (
            <p className="mt-8 text-center text-body text-text-secondary">{order.cancelReason}</p>
          )}
          <p className="mt-4 text-body-sm text-text-secondary">Siz bekor qildingiz</p>
        </div>
      )}

      {order.status === ORDER_STATUS.SAFETY_FLAGGED && (
        <Banner variant="danger" className="mt-24">
          Buyurtma xavfsizlik tekshiruvida. Operatorimiz siz bilan bogʻlanadi.
        </Banner>
      )}

      <Summary order={order} />
      <div className="h-bottom-reserve" aria-hidden />

      <Sheet open={sheetOpen} title="Bekor qilish sababi" onClose={() => setSheetOpen(false)}>
        <div className="flex flex-wrap gap-8">
          {REASONS.map((item) => (
            <SelectableChip key={item} selected={reason === item} onSelect={() => setReason(item)}>
              {item}
            </SelectableChip>
          ))}
        </div>

        {isOther && (
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            placeholder="Sababni yozing"
            error={
              note.trim().length > 0 && note.trim().length < REASON_MIN ? 'Kamida 3 belgi' : undefined
            }
            className="mt-16"
          />
        )}

        <div className="mt-20 flex flex-col gap-12">
          <Button
            variant="destructive"
            disabled={!canSubmitCancel}
            onClick={() => setConfirmOpen(true)}
          >
            Bekor qilish
          </Button>
          <Button variant="ghost" onClick={() => setSheetOpen(false)}>
            Yopish
          </Button>
        </div>
      </Sheet>

      <Modal
        open={confirmOpen}
        title="Buyurtmani rostdan bekor qilasizmi?"
        onClose={() => setConfirmOpen(false)}
      >
        <div className="mt-20 flex flex-col gap-12">
          <Button variant="destructive" onClick={submitCancel}>
            Ha, bekor qilish
          </Button>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            Yoʻq
          </Button>
        </div>
      </Modal>
    </ScreenShell>
  );
}
