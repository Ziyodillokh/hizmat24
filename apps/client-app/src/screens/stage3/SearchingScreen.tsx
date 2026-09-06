import { Headset, Search } from 'lucide-react';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { RadarBlock } from '@/components/RadarBlock';
import { Stepper } from '@/components/Stepper';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { OrderSummaryCard } from '@/screens/_shared/OrderSummaryCard';
import { ORDERS_BY_ID, NOW } from '@/mocks/orders';

/**
 * 12 · Usta qidirilmoqda.
 *
 * Uchta holat majburiy. `other-master` — bu XATO EMAS: usta javob bermaganda
 * buyurtma qidiruvga qaytadi, bu oqimning normal qismi (1-boʻlim, 15-qoida),
 * shuning uchun rang neytral, qizil emas.
 */
export type SearchingVariant = 'searching' | 'operator' | 'other-master';

export interface SearchingScreenProps {
  variant?: SearchingVariant;
}

const HEADING: Record<SearchingVariant, string> = {
  searching: 'Usta qidirilmoqda…',
  operator: 'Usta qidirilmoqda',
  'other-master': 'Boshqa usta qidirilmoqda',
};

export function SearchingScreen({ variant = 'searching' }: SearchingScreenProps) {
  const order = ORDERS_BY_ID['o-searching'];
  const isOperator = variant === 'operator';

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma" />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            {/* Operator holatida ham bekor qilish ALBATTA faol qoladi. */}
            <Button variant="secondary">Bekor qilish</Button>
            {isOperator && <Button variant="ghost">Qoʻllab-quvvatlashga murojaat</Button>}
          </div>
        </StickyFooter>
      }
    >
      <Stepper status={order.status} className="-mx-20" />

      <div className="mt-32 flex flex-col items-center">
        {/* Operator holatida radar TOʻXTAYDI — statik operator ikonasi qoladi. */}
        <RadarBlock
          variant={isOperator ? 'static' : 'animated'}
          icon={isOperator ? Headset : Search}
        />

        <h2 className="mt-24 text-center text-h2 text-text-primary">{HEADING[variant]}</h2>

        {variant === 'searching' && (
          <p className="mt-8 text-body text-text-secondary tabular">0:14</p>
        )}

        {variant === 'other-master' && (
          <p className="mt-8 text-center text-body text-text-secondary">
            Avvalgi usta javob bermadi. Siz uchun boshqa usta qidirilmoqda.
          </p>
        )}
      </div>

      {/* Operator holatida taxminiy vaqt va navbat raqami KOʻRSATILMAYDI. */}
      {isOperator && (
        <Banner variant="warning" className="mt-24">
          Hozircha boʻsh usta yoʻq — operatorimiz buyurtmangizni qoʻlda koʻrib
          chiqadi
        </Banner>
      )}

      <OrderSummaryCard order={order} now={NOW} className="mt-24" />
      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
