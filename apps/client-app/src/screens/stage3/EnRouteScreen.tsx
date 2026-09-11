import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { MasterCard } from '@/components/MasterCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Stepper } from '@/components/Stepper';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { canCancel, isMasterPhoneVisible } from '@/lib/orderStateMachine';
import { formatDuration } from '@/lib/formatters';
import { ORDERS_BY_ID } from '@/mocks/orders';

/**
 * 15 · Usta yoʻlda.
 *
 * Xarita, ustaning harakatlanuvchi markeri va "yoʻlga chiqdi 14:32" kabi
 * timeline CHIZILMAYDI — bu maʼlumotlar mijozga berilmaydi (14.1-band, 7–8-punkt).
 */
export type EnRouteVariant = 'default' | 'no-eta' | 'offline';

export interface EnRouteScreenProps {
  variant?: EnRouteVariant;
}

export function EnRouteScreen({ variant = 'default' }: EnRouteScreenProps) {
  const order = ORDERS_BY_ID['o-enroute'];
  const master = order.master;
  const etaMinutes = variant === 'no-eta' ? null : order.etaMinutes;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma" />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            {isMasterPhoneVisible(order.status) && master?.phoneNumber && (
              <Button variant="primary">Qoʻngʻiroq qilish</Button>
            )}
            {canCancel(order.status) && <Button variant="secondary">Bekor qilish</Button>}
            <p className="text-center text-body-sm text-text-secondary">
              Bu — bekor qilishning oxirgi imkoniyati.
            </p>
          </div>
        </StickyFooter>
      }
    >
      {variant === 'offline' && <ConnectionBanner state="reconnecting" />}

      <Stepper status={order.status} className="-mx-20" />

      {master && (
        <MasterCard
          name={master.fullName}
          profession={master.profession}
          rating={master.ratingAvg}
          completedOrders={master.completedOrdersCount}
          experience={master.experienceLevel === 'EXPERIENCED' ? 'experienced' : 'new'}
          isCertified={master.hasGovCertificate}
          onOpen={() => undefined}
          className="mt-20"
        />
      )}

      <div className="mt-24">
        {etaMinutes === null ? (
          <p className="text-h3 text-text-primary">Hisoblanmoqda</p>
        ) : (
          <>
            <p className="text-h3 text-text-primary">
              {formatDuration(etaMinutes)}da yetib keladi
            </p>
            {/* Progress hech qachon 100% koʻrsatmaydi — maksimum 92%. */}
            <ProgressBar indeterminate className="mt-12" />
          </>
        )}
        <p className="mt-8 text-caption text-text-secondary">{order.address.label}</p>
      </div>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
