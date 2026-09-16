import { MapPin, Timer } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { ServicePhoto } from '@/components/order/ServicePhoto';
import { StatusChip } from '@/components/StatusChip';
import { cn } from '@/lib/cn';
import { splitFormattedPrice } from '@/lib/formatters';
import { addressDetailsLine } from '@/lib/address';
import {
  MASTER_NEXT_STAGE_LINE,
  MASTER_STATUS_CHIPS,
  masterJobFactLine,
  type MasterFactSource,
} from '@/lib/masterJobs';
import { isBlockingConfirmation } from '@/lib/orderStateMachine';
import { timingLabel } from '@/lib/schedule';
import { METHOD_SHORT_LABELS } from '@/lib/wallet';
import type { LiveOrder } from '@/app/types';

/**
 * Usta koʻradigan ish kartasi — taklif yoki faol ish.
 *
 * Mijoz tomonidagi `OrderListCard` bilan BIR XIL geometriya (84×56 foto,
 * ikki qatorli sarlavha, chip qatori, amallar), lekin boshqa gap: mijozga
 * «Usta topildi» deyiladi, ustaga esa «Yangi taklif».
 *
 * Kartada masofa, «sizga yaqin», taklif muddati YOʻQ — bunday maʼlumot
 * ilovada mavjud emas (TZ 4.3, halollik belgilari).
 *
 * Narx — mijoz kelishgan MUZLATILGAN summa. Undan komissiya ayrilmaydi:
 * foiz hali belgilanmagan va sof daromad hisoblanmaydi (TZ 0.3).
 */
export interface MasterJobCardProps {
  order: LiveOrder;
  /** `useMinuteClock()` dan — komponent ichida `new Date()` chaqirilmaydi. */
  now: Date;
  variant: 'offer' | 'active';
  /** Taklifda: qabul qilish varagʻini ochadi. `null` — tugma oʻchiq. */
  onAccept?: (() => void) | null;
  onDecline?: () => void;
  /** Qabul qilish nega mumkin emasligi — jimgina oʻchirib qoʻyilmaydi. */
  blockedHint?: string | null;
  className?: string;
}

export function MasterJobCard({
  order,
  now,
  variant,
  onAccept,
  onDecline,
  blockedHint,
  className,
}: MasterJobCardProps) {
  const { value, currency } = splitFormattedPrice(order.invoice.total);
  const chip = MASTER_STATUS_CHIPS[order.status];
  const fact = masterJobFactLine(order as MasterFactSource, now);
  const details = addressDetailsLine(order.address);
  const isBlocking = isBlockingConfirmation(order.status);

  return (
    <Card
      className={cn(
        'p-12',
        // Mijozdan javob kutilayotgan ish — ogohlantirish halqasi.
        isBlocking && 'ring-2 ring-warning',
        className,
      )}
    >
      <div className="flex items-start gap-12">
        <ServicePhoto
          serviceId={order.categoryId}
          iconKey={order.categoryIconKey}
          className="h-[56px] w-[84px]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-8">
            <p className="line-clamp-2 min-w-0 text-title text-text-primary">{order.categoryName}</p>
            <span className="tabular shrink-0 pt-2 text-caption text-text-secondary">
              {order.shortId}
            </span>
          </div>
          <p className="mt-2 text-caption text-text-secondary">
            {timingLabel(order, now)}
          </p>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between gap-8">
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <StatusChip status={order.status} label={chip.label} tone={chip.tone} />
          {order.isUrgent && (
            <InfoChip icon={Timer} tone="warning">
              Shoshilinch
            </InfoChip>
          )}
        </div>
        <p className="tabular shrink-0 text-price text-text-primary">
          {value} <span className="text-currency text-text-secondary">{currency}</span>
        </p>
      </div>

      {/* Manzil — mijoz kiritgan matn; ilova masofani BILMAYDI va yozmaydi. */}
      <p className="mt-12 flex items-start gap-8 text-body-sm text-text-secondary">
        <Icon icon={MapPin} size={16} className="mt-2 shrink-0" aria-hidden />
        <span className="min-w-0">
          <span className="line-clamp-2 block">{order.address.label}</span>
          {details && <span className="mt-2 block text-caption">{details}</span>}
        </span>
      </p>

      {order.description.trim().length > 0 && (
        <p className="mt-8 line-clamp-2 text-body-sm text-text-secondary">
          {order.description.trim()}
        </p>
      )}

      <p className="mt-8 text-body-sm text-text-secondary">
        Mijoz toʻlaydi: <span className="tabular text-text-primary">{value} {currency}</span> ·{' '}
        {METHOD_SHORT_LABELS[order.paymentMethod]}
      </p>

      {fact && <p className="mt-8 text-caption text-text-secondary">{fact}</p>}

      {variant === 'offer' && (
        <>
          <div className="mt-16 flex gap-8">
            <Button
              variant="primary"
              className="flex-1 whitespace-nowrap px-12"
              disabled={!onAccept}
              onClick={() => onAccept?.()}
            >
              Qabul qilish
            </Button>
            <Button
              variant="ghost"
              fullWidth={false}
              className="whitespace-nowrap px-12"
              onClick={onDecline}
            >
              Rad etish
            </Button>
          </div>
          {!onAccept && blockedHint && (
            <p className="mt-8 text-caption text-text-secondary">{blockedHint}</p>
          )}
        </>
      )}

      {/*
        Faol ishda tugma YOʻQ: yoʻlga chiqish va yakunlash keyingi bosqichda
        ulanadi. Oʻlik tugma chizish oʻrniga ekran buni ochiq aytadi.
      */}
      {variant === 'active' && (
        <p className="mt-12 text-caption text-text-secondary">{MASTER_NEXT_STAGE_LINE}</p>
      )}
    </Card>
  );
}
