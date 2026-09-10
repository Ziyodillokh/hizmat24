import {
  CalendarCheck,
  CheckCircle,
  Clock,
  Prohibit,
  Receipt,
  Star,
  XCircle,
} from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { InfoChip, type InfoChipTone } from '@/components/InfoChip';
import { SummaryRow } from '@/components/SummaryRow';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { formatDateTime, formatPercent, formatPrice } from '@/lib/formatters';
import {
  isBlockingConfirmation,
  isTerminal,
  paymentStateFor,
  type PaymentStateKey,
} from '@/lib/orderStateMachine';
import { timingLabel } from '@/lib/schedule';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { METHOD_LABELS } from '@/lib/wallet';
import { useApp } from '../store';

/**
 * Toʻlov cheki — buyurtma YARATILGAN paytdagi hujjat.
 *
 * Mavjud "Chek" (`/app/order/:id/receipt`) dan farqi: u ish yakunlangach
 * chiziladi va unda usta, baho, yakunlangan sana boʻladi. Bu yerda ular hali
 * yoʻq, lekin toʻlov usuli, tanlangan vaqt va hisob-faktura tafsiloti bor.
 *
 * "Yuklab olish", "Ulashish", "Nusxa olish" tugmalari YOʻQ: kerakli
 * Capacitor plaginlari oʻrnatilmagan va ular ishlamaydigan tugma boʻlardi.
 */
interface PaymentStateVisual {
  chip: string;
  tone: InfoChipTone;
  icon: IconGlyph;
  note: (method: string) => string;
}

const PAYMENT_STATES: Record<PaymentStateKey, PaymentStateVisual> = {
  pending: {
    chip: 'Toʻlov kutilmoqda',
    tone: 'warning',
    icon: Clock,
    note: (method) => `Ish yakunlangach ${method.toLowerCase()} bilan toʻlanadi.`,
  },
  confirm: {
    chip: 'Baholang va toʻlovni tasdiqlang',
    tone: 'warning',
    icon: Star,
    note: () => 'Ishni baholaganingizdan keyin buyurtma yopiladi.',
  },
  paid: {
    chip: 'Toʻlandi',
    tone: 'primary',
    icon: CheckCircle,
    note: (method) => `Toʻlov usuli: ${method}.`,
  },
  none: {
    chip: 'Toʻlov boʻlmadi',
    tone: 'neutral',
    icon: Prohibit,
    note: () => 'Buyurtma bekor qilindi — hech qanday pul yechilmagan.',
  },
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

  const state = PAYMENT_STATES[paymentStateFor(order.status)];
  const methodLabel = METHOD_LABELS[order.paymentMethod];
  const isCancelled = paymentStateFor(order.status) === 'none';
  const isScheduledAhead = order.scheduledAt !== null && order.scheduledAt.getTime() > now.getTime();

  // `navigate(-1)` EMAS: bu ekranga tasdiqlashdan `replace` bilan kelinadi
  // va tarixda boʻshatilgan qoralama qoladi.
  const backToOrder = () => navigate(`/app/order/${order.id}`, { replace: true });

  return (
    <ScreenShell
      header={<Header variant="inner" title="Toʻlov cheki" onBack={backToOrder} />}
      footer={
        <StickyFooter>
          <Button variant={isTerminal(order.status) ? 'secondary' : 'primary'} onClick={backToOrder}>
            {isTerminal(order.status) ? 'Buyurtmaga qaytish' : 'Buyurtmani kuzatish'}
          </Button>
        </StickyFooter>
      }
    >
      {isCancelled ? (
        <Banner variant="warning" icon={XCircle} className="mt-4">
          Buyurtma bekor qilindi. Hech qanday pul yechilmagan.
        </Banner>
      ) : (
        <Banner variant="info" icon={Receipt} className="mt-4">
          Buyurtma qabul qilindi. Onlayn toʻlov hali ulanmagan — summa ish yakunlangach ustaga
          naqd toʻlanadi.
        </Banner>
      )}

      {isScheduledAhead && order.scheduledAt && (
        <Banner variant="info" icon={CalendarCheck} className="mt-12">
          Buyurtma {formatDateTime(order.scheduledAt, now)} ga rejalashtirilgan. Usta qidiruvi
          oʻsha vaqtda boshlanadi.
        </Banner>
      )}

      <div
        className={cn(
          'mt-16 rounded-lg border border-transparent bg-surface-elevated p-16 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <SummaryRow label="Buyurtma raqami" value={order.shortId} mono />
        <SummaryRow label="Xizmat" value={order.categoryName} />
        <SummaryRow label="Manzil" value={order.address.label} />
        <SummaryRow label="Vaqt" value={timingLabel(order, now)} />
        <SummaryRow label="Toʻlov usuli" value={methodLabel} />
        <SummaryRow label="Berilgan sana" value={formatDateTime(order.createdAt, now)} />

        <div className="border-t border-dashed border-border" />

        <SummaryRow label="Xizmat narxi" value={formatPrice(order.invoice.base)} />
        {order.invoice.urgentFee > 0 && (
          <SummaryRow label="Shoshilinch yuborish" value={formatPrice(order.invoice.urgentFee)} />
        )}
        {order.invoice.discount > 0 && (
          <SummaryRow
            label={`Daraja chegirmasi (${formatPercent(order.invoice.discountPercent)})`}
            value={formatPrice(-order.invoice.discount)}
            tone="success"
          />
        )}
        <SummaryRow label="Xizmat haqi" value="Bepul" tone="success" />

        <div className="border-t border-dashed border-border pt-16" />
        <div className="flex items-baseline justify-between gap-16">
          <span className="text-body-lg text-text-secondary">Jami</span>
          <span className="tabular text-display text-text-primary">
            {formatPrice(order.invoice.total)}
          </span>
        </div>
      </div>

      <div className="mt-12 px-4">
        <InfoChip icon={state.icon} tone={state.tone}>
          {state.chip}
        </InfoChip>
        <p className="mt-8 text-body-sm text-text-secondary">{state.note(methodLabel)}</p>
      </div>

      {/* `span`, `button` EMAS: bajaradigan amali yoʻq. */}
      <span className="ml-4 mt-12 inline-flex h-[32px] items-center rounded-full border border-dashed border-border-strong px-12 text-caption text-text-secondary">
        Demo · Click va Payme keyingi bosqichda
      </span>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
