import {
  CalendarCheck,
  CheckCircle,
  PaperPlaneTilt,
  ShieldCheck,
  Star,
  Timer,
  UsersThree,
  Wrench,
} from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { StatusChip } from '@/components/StatusChip';
import { Stepper } from '@/components/Stepper';
import { cn } from '@/lib/cn';
import { formatDateTime, formatRating, splitFormattedPrice } from '@/lib/formatters';
import {
  isEmphasisedAction,
  orderFactLine,
  primaryListAction,
  secondaryListAction,
  type FactKind,
  type ListAction,
} from '@/lib/orderList';
import { isBlockingConfirmation } from '@/lib/orderStateMachine';
import type { LiveOrder } from '@/app/types';
import { ServicePhoto } from './ServicePhoto';

/**
 * Faol buyurtma kartasi (24-ekran, "Faol buyurtmalar" zonasi).
 *
 * Toʻrt qatlam: sarlavha (rasm · nom · raqam · sana, ostida holat chipi · narx) →
 * ixcham stepper → faktlar (usta qatori, fakt satri) → amallar.
 * Har bir qator `LiveOrder` ning haqiqiy maydonidan: usta faqat tayinlangach,
 * ETA faqat yoʻlga chiqmasdan oldin, navbat faqat navbatda. Sanoq, kutish
 * vaqti yoki masofa TOʻQILMAYDI — bunday maydon yoʻq.
 *
 * Karta konteyneri interaktiv EMAS: tanasi haqiqiy `<button>`, amallar
 * alohida tugmalar — ichma-ich interaktiv element yoʻq, klaviatura bilan
 * ochish oʻz-oʻzidan ishlaydi.
 */
const FACT_ICONS: Record<FactKind, IconGlyph> = {
  sent: PaperPlaneTilt,
  scheduled: CalendarCheck,
  queue: UsersThree,
  eta: Timer,
  confirm: ShieldCheck,
  progress: Wrench,
  completed: CheckCircle,
  cancel: CheckCircle,
  flagged: ShieldCheck,
};

export interface OrderListCardProps {
  order: LiveOrder;
  /** "Bugun"/"Ertaga" yorliqlari shu vaqtga nisbatan (8.5-band). */
  now: Date;
  /** Karta tanasi bosilganda — buyurtma tafsiloti. */
  onOpen: () => void;
  /** Amal tugmasi bosilganda — marshrut va holat `action` da tayyor. */
  onAction: (action: ListAction) => void;
  className?: string;
}

export function OrderListCard({ order, now, onOpen, onAction, className }: OrderListCardProps) {
  const { value, currency } = splitFormattedPrice(order.invoice.total);
  const fact = orderFactLine(order, now);
  const primary = primaryListAction(order);
  const secondary = secondaryListAction(order);
  const isBlocking = isBlockingConfirmation(order.status);
  const hasFacts = order.master !== null || fact !== null;

  return (
    <Card
      className={cn(
        'overflow-hidden p-0',
        // Bloklovchi tasdiqlash — ogohlantirish halqasi: foydalanuvchidan javob kutilmoqda.
        isBlocking && 'ring-2 ring-warning',
        className,
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left transition-colors duration-press ease-std active:bg-surface-sunken"
      >
        {/*
          Sarlavha ikki qavat: 360px ekranda foto yonidagi 200px ga nom
          (150–170px) va narx (100px) BIRGA sigʻmaydi — nom "Rakovina va…"
          boʻlib qirqilardi. Shuning uchun nom ikki satrgacha oʻsadi, narx
          esa holat chipi bilan bitta toʻliq kenglikdagi qatorga tushadi.
        */}
        <div className="p-12">
          <div className="flex items-start gap-12">
            <ServicePhoto
              serviceId={order.categoryId}
              iconKey={order.categoryIconKey}
              className="h-[56px] w-[84px]"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-8">
                <p className="line-clamp-2 min-w-0 text-title text-text-primary">{order.categoryName}</p>
                <span className="tabular shrink-0 pt-2 text-caption text-text-secondary">{order.shortId}</span>
              </div>
              <p className="mt-2 text-caption text-text-secondary">{formatDateTime(order.createdAt, now)}</p>
            </div>
          </div>
          <div className="mt-12 flex items-center justify-between gap-8">
            <div className="flex min-w-0 flex-wrap items-center gap-4">
              <StatusChip status={order.status} />
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
        </div>

        {/* Bloklovchi, bekor qilingan va xavfsizlik holatlarida oʻzi `null` qaytaradi. */}
        <Stepper status={order.status} compact className="px-12" />

        {hasFacts && (
          <div className="flex flex-col gap-8 px-12 pt-12">
            {order.master && (
              <div className="flex items-center gap-12">
                <Avatar name={order.master.fullName} src={order.master.photoUrl} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm font-semibold text-text-primary">
                    {order.master.fullName}
                  </p>
                  <p className="flex items-center gap-4 truncate text-caption text-text-secondary">
                    {order.master.profession}
                    <span aria-hidden>·</span>
                    <Icon icon={Star} size={14} weight="fill" className="text-star" aria-hidden />
                    <span className="tabular">{formatRating(order.master.ratingAvg)}</span>
                  </p>
                </div>
              </div>
            )}
            {fact && (
              <p
                className={cn(
                  'flex items-start gap-8 text-body-sm',
                  isBlocking ? 'text-warning' : 'text-text-secondary',
                )}
              >
                {/* `mt-2`: 16px ikona 19px satr oʻqiga tekislanadi. */}
                <Icon icon={FACT_ICONS[fact.kind]} size={16} className="mt-2 shrink-0" aria-hidden />
                {/* "Yakunlandi: Kecha, 18:59 · Baholashni kutmoqda" 360px da bir
                    satrga sigʻmaydi — qirqish oʻrniga ikki satr. */}
                <span className="line-clamp-2 min-w-0">{fact.text}</span>
              </p>
            )}
          </div>
        )}
      </button>

      {primary && (
        // `px-12`: standart 20px bilan "Xaritada kuzatish" + "Bekor qilish"
        // (128 + 86px matn) 360px ekranda ikki satrga sinardi; 12px da
        // eng uzun juftlik ham (262px) 288px qatorga sigʻadi.
        <div className="flex gap-8 p-12">
          <Button
            variant={isEmphasisedAction(primary.kind) ? 'primary' : 'secondary'}
            className="flex-1 whitespace-nowrap px-12"
            onClick={() => onAction(primary)}
          >
            {primary.label}
          </Button>
          {secondary && (
            <Button
              variant="ghost"
              fullWidth={false}
              className="whitespace-nowrap px-12"
              onClick={() => onAction(secondary)}
            >
              {secondary.label}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
