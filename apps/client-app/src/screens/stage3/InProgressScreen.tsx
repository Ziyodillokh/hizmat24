import { Wrench } from '@phosphor-icons/react';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { Header } from '@/components/Header';
import { MasterCard } from '@/components/MasterCard';
import { Stepper } from '@/components/Stepper';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { OrderSummaryCard } from '@/screens/_shared/OrderSummaryCard';
import { isMasterPhoneVisible } from '@/lib/orderStateMachine';
import { ORDERS_BY_ID, NOW } from '@/mocks/orders';

/**
 * 18 · Ish jarayonida.
 *
 * Sof kuzatuv ekrani: bekor qilish tugmasi ham, boshqa holat oʻzgartiruvchi
 * tugma ham YOʻQ — keyingi holatni ilova oʻzi kutadi (14.3-band, 12-punkt).
 */
export type InProgressVariant = 'default' | 'offline';

export interface InProgressScreenProps {
  variant?: InProgressVariant;
}

export function InProgressScreen({ variant = 'default' }: InProgressScreenProps) {
  const order = ORDERS_BY_ID['o-progress'];
  const master = order.master;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma" />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            {isMasterPhoneVisible(order.status) && master?.phoneNumber && (
              <Button variant="primary">Qoʻngʻiroq qilish</Button>
            )}
            <Button variant="ghost">Qoʻllab-quvvatlashga murojaat</Button>
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

      <Banner variant="info" icon={Wrench} className="mt-16">
        Usta ishni boshladi
      </Banner>

      <OrderSummaryCard order={order} now={NOW} className="mt-16" />
      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
