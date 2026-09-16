import { CalendarBlank, MapPin } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DashedChip } from '@/components/DashedChip';
import { Header } from '@/components/Header';
import { SelectableChip } from '@/components/SelectableChip';
import { ServicePhoto } from '@/components/order/ServicePhoto';
import { Sheet } from '@/components/Sheet';
import { StarRating } from '@/components/StarRating';
import { StatusChip } from '@/components/StatusChip';
import { Stepper } from '@/components/Stepper';
import { DetailRow } from '@/components/order/DetailRow';
import { PriceBreakdown } from '@/components/order/PriceBreakdown';
import { StepSection } from '@/components/order/StepSection';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { addressDetailsLine } from '@/lib/address';
import { formatPhone, orEmpty } from '@/lib/formatters';
import {
  ADDRESS_HINT,
  ARRIVE_TOAST,
  CANCEL_SHEET_HINT,
  CANCEL_SHEET_TITLE,
  CANCEL_TOAST,
  CLIENT_CONTACT_HINT,
  COMMISSION_HINT,
  DEPART_TOAST,
  ETA_OPTIONS,
  ETA_SHEET_HINT,
  ETA_SHEET_TITLE,
  etaOptionLabel,
  getMasterActions,
  isPrimaryMasterAction,
  MASTER_ACTION_LABELS,
  MASTER_CANCEL_REASONS,
  MASTER_STATUS_CHIPS,
  masterWaitingCard,
  PRICE_FIXED_HINT,
  type MasterAction,
} from '@/lib/masterJobs';
import { isMyJob } from '@/lib/masterJobs';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { timingLabel } from '@/lib/schedule';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { METHOD_SHORT_LABELS } from '@/lib/wallet';
import { useApp } from '../../store';
import { useToast } from '../../ToastHost';

/**
 * Bitta ishning kartasi — usta shu yerdan holatni suradi.
 *
 * Ekranda XARITA, MASOFA va MIJOZ RAQAMI yoʻq: ilova joylashuvni bilmaydi,
 * bitta qurilmada esa mijoz ham, usta ham — bitta odam. Uchala yoʻqlikning
 * sababi ekranda yozilgan, jimgina tashlab ketilmaydi.
 *
 * Ikki oʻtish ustaga berilmaydi: shaxsni tasdiqlash va baho MIJOZNIKI.
 * Ularning oʻrnida tugma emas, kutish kartasi turadi.
 */
export function MasterJobScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const now = useMinuteClock();
  const showToast = useToast();
  const { findOrder, masterDepart, masterArrive, masterCancelOrder, setRole, fullName, phoneNumber } =
    useApp();

  const [etaOpen, setEtaOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const order = orderId ? findOrder(orderId) : undefined;

  // Rol almashtirilganda buyurtma bekor qilingan boʻlishi mumkin — ekran
  // yiqilmaydi, roʻyxatga qaytadi.
  if (!order || !isMyJob(order)) {
    if (!order || !order.handledByMaster) return <Navigate to="/app/master/jobs" replace />;
  }
  if (!order) return <Navigate to="/app/master/jobs" replace />;

  const chip = MASTER_STATUS_CHIPS[order.status];
  const details = addressDetailsLine(order.address);
  const waiting = masterWaitingCard(order.status);
  const actions = getMasterActions(order.status);

  const runAction = (action: MasterAction) => {
    switch (action) {
      case 'depart':
        setEtaOpen(true);
        return;
      case 'arrive':
        masterArrive(order.id);
        showToast(ARRIVE_TOAST);
        return;
      case 'finish':
        navigate(`/app/master/jobs/${order.id}/finish`);
        return;
      case 'cancel':
        setCancelOpen(true);
        return;
      case 'client-mode':
        // Boshi berk koʻcha ochiladi: tasdiqni mijoz beradi, mijoz esa —
        // shu qurilmadagi oʻsha odam.
        setRole('client');
        navigate(`/app/order/${order.id}/confirm-master`);
        return;
      case 'support':
        navigate(`/app/support?order=${order.id}`);
    }
  };

  const depart = (etaMinutes: number) => {
    setEtaOpen(false);
    masterDepart(order.id, etaMinutes);
    showToast(DEPART_TOAST);
  };

  const cancel = (reason: string) => {
    setCancelOpen(false);
    masterCancelOrder(order.id, reason);
    showToast(CANCEL_TOAST);
    navigate('/app/master/jobs', { replace: true });
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title={chip.label} onBack={() => navigate('/app/master/jobs')} />}
      footer={
        actions.length > 0 ? (
          <StickyFooter>
            <div className="flex flex-col gap-12">
              {actions.map((action) => (
                <Button
                  key={action}
                  variant={
                    isPrimaryMasterAction(action)
                      ? 'primary'
                      : action === 'cancel'
                        ? 'ghost'
                        : 'secondary'
                  }
                  onClick={() => runAction(action)}
                >
                  {MASTER_ACTION_LABELS[action]}
                </Button>
              ))}
            </div>
          </StickyFooter>
        ) : undefined
      }
    >
      <Card className="mt-4 flex items-start gap-12">
        <ServicePhoto
          serviceId={order.categoryId}
          iconKey={order.categoryIconKey}
          className="h-[56px] w-[84px]"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-title text-text-primary">{order.categoryName}</p>
          <div className="mt-8 flex items-center justify-between gap-8">
            <StatusChip status={order.status} label={chip.label} tone={chip.tone} />
            <span className="tabular shrink-0 text-caption text-text-secondary">
              {order.shortId}
            </span>
          </div>
        </div>
      </Card>

      {/* Bekor qilingan va xavfsizlik holatlarida stepper oʻzi `null` qaytaradi. */}
      <Stepper status={order.status} compact className="mt-16" />

      {waiting && (
        <Card className="mt-16">
          <p className="text-title text-text-primary">{waiting.title}</p>
          <p className="mt-4 text-body-sm text-text-secondary">{waiting.description}</p>
        </Card>
      )}

      {order.status === ORDER_STATUS.CANCELLED && (
        <Banner variant="warning" className="mt-16">
          Buyurtma bekor qilindi
          {order.cancelReason ? `. Sabab: ${order.cancelReason}` : ''}
          {order.cancelledBy === 'MASTER' ? ' (siz bekor qildingiz)' : ''}
        </Banner>
      )}

      {order.status === ORDER_STATUS.SAFETY_FLAGGED && (
        <Banner variant="danger" className="mt-16">
          Mijoz eshik oldida ishni toʻxtatdi. Bu holatni ilova hal qila olmaydi —
          qoʻllab-quvvatlashga qoʻngʻiroq qiling.
        </Banner>
      )}

      {order.description.trim().length > 0 && (
        <StepSection title="Mijoz yozgani">
          <Card>
            <p className="whitespace-pre-line text-body text-text-primary">
              {order.description.trim()}
            </p>
          </Card>
        </StepSection>
      )}

      <StepSection title="Manzil va vaqt" hint={ADDRESS_HINT}>
        <Card className="divide-y divide-border py-4">
          <DetailRow
            icon={MapPin}
            label="Manzil"
            value={order.address.label}
            detail={details ?? undefined}
          />
          <DetailRow icon={CalendarBlank} label="Vaqt" value={timingLabel(order, now)} />
        </Card>
      </StepSection>

      <StepSection title="Narx" hint={PRICE_FIXED_HINT}>
        <Card>
          <PriceBreakdown invoice={order.invoice} />
          <p className="mt-12 text-body-sm text-text-secondary">
            Toʻlov turi: {METHOD_SHORT_LABELS[order.paymentMethod]}
          </p>
          <div className="mt-12 flex flex-col items-start gap-8">
            <DashedChip size="compact">Tez orada</DashedChip>
            <p className="text-caption text-text-secondary">{COMMISSION_HINT}</p>
          </div>
        </Card>
      </StepSection>

      <StepSection title="Mijoz" hint={CLIENT_CONTACT_HINT}>
        <Card className="flex items-center gap-12">
          <Avatar name={fullName ?? undefined} size={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-title text-text-primary">
              {orEmpty(fullName ?? undefined)}
            </p>
            <p className="tabular mt-2 truncate text-body-sm text-text-secondary">
              {formatPhone(phoneNumber)}
            </p>
          </div>
        </Card>
      </StepSection>

      {order.status === ORDER_STATUS.CLOSED && order.rating && (
        <StepSection title="Mijoz bahosi">
          <Card>
            <StarRating value={order.rating.stars} showValue />
            {order.rating.tags.length > 0 && (
              <p className="mt-8 text-body-sm text-text-secondary">
                {order.rating.tags.join(' · ')}
              </p>
            )}
            {order.rating.comment && (
              <p className="mt-8 text-body text-text-primary">{order.rating.comment}</p>
            )}
          </Card>
        </StepSection>
      )}

      {order.workNote && (
        <StepSection title="Sizning izohingiz">
          <Card>
            <p className="whitespace-pre-line text-body text-text-primary">{order.workNote}</p>
          </Card>
        </StepSection>
      )}

      <div className="h-bottom-reserve" aria-hidden />

      {/* Yetib borish vaqti — ustaning tanlovi; qattiq yozilgan 15 daqiqa yoʻq. */}
      <Sheet open={etaOpen} title={ETA_SHEET_TITLE} onClose={() => setEtaOpen(false)}>
        <p className="text-body-sm text-text-secondary">{ETA_SHEET_HINT}</p>
        <div className="mt-16 flex flex-wrap gap-8">
          {ETA_OPTIONS.map((minutes) => (
            <SelectableChip key={minutes} selected={false} onSelect={() => depart(minutes)}>
              {etaOptionLabel(minutes)}
            </SelectableChip>
          ))}
        </div>
        <Button variant="ghost" className="mt-20" onClick={() => setEtaOpen(false)}>
          Yopish
        </Button>
      </Sheet>

      <Sheet open={cancelOpen} title={CANCEL_SHEET_TITLE} onClose={() => setCancelOpen(false)}>
        <p className="text-body-sm text-text-secondary">{CANCEL_SHEET_HINT}</p>
        <div className="mt-16 flex flex-col gap-8">
          {MASTER_CANCEL_REASONS.map((reason) => (
            <Button key={reason} variant="secondary" onClick={() => cancel(reason)}>
              {reason}
            </Button>
          ))}
        </div>
        <Button variant="ghost" className="mt-16" onClick={() => setCancelOpen(false)}>
          Yoʻq, davom etaman
        </Button>
      </Sheet>
    </ScreenShell>
  );
}
