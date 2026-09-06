import { Clock } from 'lucide-react';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { InfoChip } from '@/components/InfoChip';
import { MasterCard } from '@/components/MasterCard';
import { Stepper } from '@/components/Stepper';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { OrderSummaryCard } from '@/screens/_shared/OrderSummaryCard';
import { canCancel, isMasterPhoneVisible } from '@/lib/orderStateMachine';
import { formatDuration } from '@/lib/formatters';
import { ORDERS_BY_ID, NOW } from '@/mocks/orders';

/**
 * 14 · Usta topildi.
 *
 * Bu ekran istalgan payt 12-ekranning "Boshqa usta qidirilmoqda" holatiga
 * qaytishi mumkin — bu xato emas, oqimning normal qismi (1-bo'lim, 15-qoida).
 */
export type MasterFoundVariant = 'default' | 'no-eta' | 'no-photo';

export interface MasterFoundScreenProps {
  variant?: MasterFoundVariant;
}

export function MasterFoundScreen({ variant = 'default' }: MasterFoundScreenProps) {
  const order = ORDERS_BY_ID['o-assigned'];
  const master = order.master;
  const etaMinutes = variant === 'no-eta' ? null : order.etaMinutes;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma" />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            {/* Telefon ko'rinmasa tugma disabled emas, BUTUNLAY yashiriladi (14.2-band, 11-punkt). */}
            {isMasterPhoneVisible(order.status) && master?.phoneNumber && (
              <Button variant="primary">Qo&apos;ng&apos;iroq qilish</Button>
            )}
            {canCancel(order.status) && <Button variant="secondary">Bekor qilish</Button>}
          </div>
        </StickyFooter>
      }
    >
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

      {/* Taxminiy vaqt yo'q bo'lsa chip butunlay yashiriladi — "0 daqiqa" yozilmaydi. */}
      {etaMinutes !== null && (
        <InfoChip icon={Clock} tone="primary" className="mt-16">
          Taxminiy vaqt: {formatDuration(etaMinutes)}
        </InfoChip>
      )}

      <OrderSummaryCard order={order} now={NOW} className="mt-16" />
    </ScreenShell>
  );
}
