import { Headset } from 'lucide-react';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { Header } from '@/components/Header';
import { Stepper } from '@/components/Stepper';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { OrderSummaryCard } from '@/screens/_shared/OrderSummaryCard';
import { RadarBlock } from '@/components/RadarBlock';
import { formatDuration } from '@/lib/formatters';
import { ORDERS_BY_ID, NOW } from '@/mocks/orders';

/**
 * 13 · Siz navbatdasiz.
 *
 * Asosiy element — navbat OʻRNI, taxminiy vaqt emas. Raqam jonli sanoq bilan
 * yangilanmaydi: u faqat haqiqatan oʻzgarganda oʻzgaradi va uzoq vaqt qotib
 * turishi normal (14.6-band, 44-punkt).
 */
export type QueuedVariant = 'position' | 'no-estimate' | 'operator' | 'offline';

export interface QueuedScreenProps {
  variant?: QueuedVariant;
}

export function QueuedScreen({ variant = 'position' }: QueuedScreenProps) {
  const order = ORDERS_BY_ID['o-queued'];
  const isOperator = variant === 'operator';

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma" />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            <Button variant="secondary">Bekor qilish</Button>
            {isOperator && <Button variant="ghost">Qoʻllab-quvvatlashga murojaat</Button>}
          </div>
        </StickyFooter>
      }
    >
      {variant === 'offline' && <ConnectionBanner state="reconnecting" />}

      <Stepper status={order.status} className="-mx-20" />

      {isOperator ? (
        <>
          {/* Operator holatida navbat raqami bloki BUTUNLAY yashiriladi. */}
          <div className="mt-32 flex flex-col items-center">
            <RadarBlock variant="static" icon={Headset} />
          </div>
          <Banner variant="warning" className="mt-24">
            Hozircha boʻsh usta yoʻq — operatorimiz buyurtmangizni qoʻlda koʻrib
            chiqadi
          </Banner>
        </>
      ) : (
        <div className="mt-32 flex flex-col items-center">
          <p className="text-display text-text-primary tabular">~{order.queuePosition}</p>
          <p className="mt-8 text-body text-text-primary">Navbatdagi oʻrningiz</p>
          <p className="mt-4 text-body-sm text-text-secondary">
            {variant === 'no-estimate'
              ? 'Hisoblanmoqda'
              : `Taxminiy kutish: ${formatDuration(20)}`}
          </p>
        </div>
      )}

      <OrderSummaryCard order={order} now={NOW} className="mt-32" />
      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
