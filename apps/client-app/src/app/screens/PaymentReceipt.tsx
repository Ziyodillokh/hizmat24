import {
  ChatText,
  CheckCircle,
  Clock,
  Lightning,
  MapPin,
  Money,
  Prohibit,
  Receipt,
  Star,
  Wrench,
  XCircle,
} from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { InfoChip, type InfoChipTone } from '@/components/InfoChip';
import { DetailRow } from '@/components/order/DetailRow';
import { PriceBreakdown } from '@/components/order/PriceBreakdown';
import { ServiceSummaryCard } from '@/components/order/ServiceSummaryCard';
import { StepSection } from '@/components/order/StepSection';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { addressDetailsLine } from '@/lib/address';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/formatters';
import {
  isBlockingConfirmation,
  isTerminal,
  paymentStateFor,
  type PaymentStateKey,
} from '@/lib/orderStateMachine';
import { receiptHeadline } from '@/lib/receipt';
import { timingLabel } from '@/lib/schedule';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { METHOD_LABELS } from '@/lib/wallet';
import { masterById } from '@/mocks/masters';
import { useApp } from '../store';

/**
 * Toʻlov cheki — buyurtma YARATILGAN paytdagi hujjat.
 *
 * Mavjud "Chek" (`/app/order/:id/receipt`) dan farqi: u ish yakunlangach
 * chiziladi va unda usta, baho, yakunlangan sana boʻladi. Bu yerda ular hali
 * yoʻq, lekin toʻlov usuli, tanlangan vaqt va hisob-faktura tafsiloti bor.
 *
 * Bosh gap (`receiptHeadline`) buyurtma holatiga qarab, lekin har doim rost:
 * pul koʻchmagan, onlayn toʻlov ulanmagan, qidiruv qachon boshlanadi.
 *
 * "Yuklab olish", "Ulashish", "Nusxa olish" tugmalari YOʻQ: kerakli
 * Capacitor plaginlari oʻrnatilmagan va ular ishlamaydigan tugma boʻlardi.
 */
interface PaymentStateVisual {
  chip: string;
  tone: InfoChipTone;
  icon: IconGlyph;
}

const PAYMENT_STATES: Record<PaymentStateKey, PaymentStateVisual> = {
  pending: { chip: 'Toʻlov kutilmoqda', tone: 'warning', icon: Clock },
  confirm: { chip: 'Baholang va toʻlovni tasdiqlang', tone: 'warning', icon: Star },
  paid: { chip: 'Toʻlandi', tone: 'primary', icon: CheckCircle },
  none: { chip: 'Toʻlov boʻlmadi', tone: 'neutral', icon: Prohibit },
};

export function PaymentReceipt() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { findOrder } = useApp();
  const now = useMinuteClock();

  const order = orderId ? findOrder(orderId) : undefined;
  if (!order) return <Navigate to="/app/home" replace />;

  /*
   * Usta yetib kelgan boʻlsa bloklovchi ekran majburan ochiladi. Buyurtma
   * yaratilishidan bu holatgacha 14,5 soniya — chekni oʻqiyotgan
   * foydalanuvchi bemalol yetib boradi.
   */
  if (isBlockingConfirmation(order.status)) {
    return <Navigate to={`/app/order/${order.id}/confirm-master`} replace />;
  }

  const headline = receiptHeadline(order, now);
  const state = PAYMENT_STATES[paymentStateFor(order.status)];
  const methodLabel = METHOD_LABELS[order.paymentMethod];
  // Usta hali tayinlanmagan boʻlsa — soʻralgan usta (SOʻROV, kafolat emas).
  const requested = order.master === null ? masterById(order.preferredMasterId ?? undefined) : undefined;
  const isScheduledAhead = order.scheduledAt !== null && order.scheduledAt.getTime() > now.getTime();

  // `navigate(-1)` EMAS: bu ekranga tasdiqlashdan `replace` bilan kelinadi
  // va tarixda boʻshatilgan qoralama qoladi.
  const backToOrder = () => navigate(`/app/order/${order.id}`, { replace: true });

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma" onBack={backToOrder} />}
      footer={
        <StickyFooter>
          <Button variant={isTerminal(order.status) ? 'secondary' : 'primary'} onClick={backToOrder}>
            {isTerminal(order.status) ? 'Buyurtmaga qaytish' : 'Buyurtmani kuzatish'}
          </Button>
        </StickyFooter>
      }
    >
      <div className="mt-16 flex flex-col items-center text-center">
        <span
          className={cn(
            'flex h-[64px] w-[64px] items-center justify-center rounded-full',
            headline.tone === 'warning'
              ? 'bg-warning-surface text-warning'
              : 'bg-success-surface text-success',
          )}
          aria-hidden
        >
          <Icon icon={headline.tone === 'warning' ? XCircle : CheckCircle} size={32} weight="fill" />
        </span>
        <h1 className="mt-12 text-h2 text-text-primary">{headline.title}</h1>
        <p className="tabular mt-4 text-body-sm tracking-[0.4px] text-text-secondary">
          Buyurtma № {order.shortId}
        </p>
        <p className="mt-8 text-body-sm text-text-secondary">{headline.body}</p>
      </div>

      <ServiceSummaryCard
        service={{ id: order.categoryId, iconKey: order.categoryIconKey, name: order.categoryName }}
        className="mt-24"
      />

      <Card className="mt-12 divide-y divide-border py-4">
        {order.master ? (
          <DetailRow
            leading={<Avatar src={order.master.photoUrl} name={order.master.fullName} size={44} shape="square" />}
            icon={Wrench}
            label="Usta"
            value={order.master.fullName}
            detail={order.master.profession}
          />
        ) : requested ? (
          <DetailRow
            leading={<Avatar src={requested.photoUrl} name={requested.fullName} size={44} shape="square" />}
            icon={Wrench}
            label="Soʻralgan usta"
            value={requested.fullName}
            detail="Soʻrov — tayinlanishi hali tasdiqlanmagan"
          />
        ) : null}
        {/*
          Izoh endi IXTIYORIY — oqimda uni soʻraydigan qadam yoʻq.
          Boʻsh boʻlsa qator umuman chizilmaydi, aks holda chekda
          sarlavhasi bor, qiymati boʻsh qator turardi.
        */}
        {order.description.trim().length > 0 && (
          <DetailRow icon={ChatText} label="Mijoz izohi" value={order.description} />
        )}
        <DetailRow
          icon={MapPin}
          label="Manzil"
          value={order.address.label}
          detail={addressDetailsLine(order.address) ?? undefined}
        />
        <DetailRow
          icon={order.isUrgent ? Lightning : Clock}
          label="Vaqt"
          value={timingLabel(order, now)}
          detail={
            isScheduledAhead
              ? 'Usta qidiruvi shu vaqtda boshlanadi'
              : order.isUrgent
                ? 'Shoshilinch'
                : undefined
          }
        />
        <DetailRow icon={Money} label="Toʻlov" value={methodLabel} />
        <DetailRow icon={Receipt} label="Berilgan sana" value={formatDateTime(order.createdAt, now)} />
      </Card>

      <StepSection title="Hisob">
        <Card>
          <InfoChip icon={state.icon} tone={state.tone}>
            {state.chip}
          </InfoChip>
          <PriceBreakdown invoice={order.invoice} className="mt-8" />
        </Card>
      </StepSection>

      <Button variant="ghost" onClick={() => navigate('/app/home', { replace: true })} className="mt-16">
        Bosh sahifaga
      </Button>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
