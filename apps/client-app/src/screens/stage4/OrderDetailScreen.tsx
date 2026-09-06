import { FileQuestion, Zap } from 'lucide-react';
import { Banner } from '@/components/Banner';
import { Button, type ButtonVariant } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { InfoChip } from '@/components/InfoChip';
import { MasterCard } from '@/components/MasterCard';
import { Skeleton, SkeletonCircle } from '@/components/Skeleton';
import { StarRating } from '@/components/StarRating';
import { StatusChip } from '@/components/StatusChip';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { MapPreview } from '@/screens/_shared/MapPreview';
import {
  DETAIL_ACTION_LABELS,
  getDetailActions,
  needsSafetyNotice,
  STATUS_CHIPS,
  type DetailAction,
} from '@/lib/orderStateMachine';
import { formatDateTime, formatPrice } from '@/lib/formatters';
import { ORDERS_BY_ID, NOW } from '@/mocks/orders';
import type { Order } from '@/mocks/types';

/**
 * 23 · Buyurtma tafsiloti — universal shablon.
 *
 * Tugmalar to'plami ekran ichida `if` bilan emas, `getDetailActions()` orqali
 * aniqlanadi: shunda bitta holat uchun noto'g'ri tugma chizilishi mumkin emas
 * va qoida testlar bilan qoplangan.
 *
 * "Tahrirlash" tugmasi hech qachon qo'yilmaydi (14.3-band, 16-punkt).
 */
export type OrderDetailVariant = 'active' | 'rated' | 'cancelled' | 'flagged' | 'loading' | 'missing';

export interface OrderDetailScreenProps {
  variant?: OrderDetailVariant;
}

const ORDER_BY_VARIANT: Record<Exclude<OrderDetailVariant, 'loading' | 'missing'>, string> = {
  active: 'o-enroute',
  rated: 'o-closed',
  cancelled: 'o-cancelled',
  flagged: 'o-flagged',
};

/** Asosiy amal — birinchi tugma; qolganlari ikkilamchi. */
const ACTION_VARIANT: Partial<Record<DetailAction, ButtonVariant>> = {
  'reject-master': 'destructive-outline',
  support: 'ghost',
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-16 py-8">
      <span className="shrink-0 text-body-sm text-text-secondary">{label}</span>
      <span className="min-w-0 text-right text-body text-text-primary">{value}</span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-16">
      <Skeleton width={140} height={28} radius="full" />
      <div className="flex items-center gap-12 rounded-lg bg-surface-elevated p-16">
        <SkeletonCircle size={64} />
        <div className="flex-1">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={14} className="mt-8" />
        </div>
      </div>
      <Skeleton height={96} radius="lg" />
      <Skeleton height={140} radius="lg" />
    </div>
  );
}

export function OrderDetailScreen({ variant = 'active' }: OrderDetailScreenProps) {
  if (variant === 'missing') {
    return (
      <ScreenShell header={<Header variant="inner" title="Buyurtma tafsiloti" />}>
        <EmptyState
          icon={FileQuestion}
          title="Buyurtma topilmadi"
          action={{ label: 'Buyurtmalarimga qaytish', onClick: () => undefined }}
        />
      </ScreenShell>
    );
  }

  if (variant === 'loading') {
    return (
      <ScreenShell header={<Header variant="inner" title="Buyurtma tafsiloti" />}>
        <DetailSkeleton />
      </ScreenShell>
    );
  }

  const order: Order = ORDERS_BY_ID[ORDER_BY_VARIANT[variant]];
  const master = order.master;
  const actions = getDetailActions(order.status);
  const { label: statusHint } = STATUS_CHIPS[order.status];
  const hasAddressDetails = Boolean(
    order.address.entrance || order.address.floor || order.address.apartment,
  );

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma tafsiloti" />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            {actions.map((action, index) => (
              <Button
                key={action}
                variant={ACTION_VARIANT[action] ?? (index === 0 ? 'primary' : 'secondary')}
              >
                {DETAIL_ACTION_LABELS[action]}
              </Button>
            ))}
          </div>
        </StickyFooter>
      }
    >
      <div className="mt-4 flex flex-col gap-8">
        <StatusChip status={order.status} className="self-start" />
        <p className="text-body-sm text-text-secondary">{statusHint}</p>
      </div>

      {master ? (
        <MasterCard
          name={master.fullName}
          profession={master.profession}
          rating={master.ratingAvg}
          completedOrders={master.completedOrdersCount}
          experience={master.experienceLevel === 'EXPERIENCED' ? 'experienced' : 'new'}
          isCertified={master.hasGovCertificate}
          onOpen={() => undefined}
          className="mt-16"
        />
      ) : (
        <Card className="mt-16">
          <p className="text-body text-text-secondary">Usta hali tayinlanmagan</p>
        </Card>
      )}

      <Card className="mt-16">
        <div className="flex items-start justify-between gap-12">
          <p className="min-w-0 flex-1 text-h3 text-text-primary">{order.categoryName}</p>
          <p className="shrink-0 text-price text-text-primary tabular">{formatPrice(order.price)}</p>
        </div>
        <p className="mt-12 text-body text-text-primary">{order.description}</p>
        {order.isUrgent && (
          <InfoChip icon={Zap} tone="warning" className="mt-12">
            Shoshilinch
          </InfoChip>
        )}
      </Card>

      <Card className="mt-16">
        <MapPreview />
        <p className="mt-12 text-body text-text-primary">{order.address.label}</p>
        {/* Ixtiyoriy maydonlar bo'lmasa qatorlar butunlay yashiriladi. */}
        {hasAddressDetails && (
          <div className="mt-8 border-t border-border pt-8">
            {order.address.entrance && <DetailRow label="Kirish" value={order.address.entrance} />}
            {order.address.floor && <DetailRow label="Qavat" value={order.address.floor} />}
            {order.address.apartment && (
              <DetailRow label="Xonadon" value={order.address.apartment} />
            )}
          </div>
        )}
      </Card>

      <Card className="mt-16">
        <DetailRow label="Yaratilgan" value={formatDateTime(order.createdAt, NOW)} />

        {/* Sana MA'LUMOTdan olinadi, holatdan emas: `completedAt` — yagona manba. */}
        {order.completedAt && (
          <DetailRow label="Yakunlangan" value={formatDateTime(order.completedAt, NOW)} />
        )}

        {order.cancelReason && <DetailRow label="Bekor qilish sababi" value={order.cancelReason} />}

        {order.rating && (
          <div className="border-t border-border pt-12">
            <p className="text-body-sm text-text-secondary">Qo&apos;ygan bahoingiz</p>
            {/* Baho read-only — o'zgartirib bo'lmaydi (14.3-band, 20-punkt). */}
            <StarRating value={order.rating.stars} size="md" showValue className="mt-8" />
            {order.rating.comment && (
              <p className="mt-8 text-body text-text-primary">{order.rating.comment}</p>
            )}
          </div>
        )}
      </Card>

      {needsSafetyNotice(order.status) && (
        <Banner variant="danger" className="mt-16">
          Buyurtma xavfsizlik tekshiruvida. Operatorimiz siz bilan bog&apos;lanadi.
        </Banner>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
