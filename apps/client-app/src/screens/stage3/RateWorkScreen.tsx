import { useState } from 'react';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { MasterCard } from '@/components/MasterCard';
import { StarRating } from '@/components/StarRating';
import { Stepper } from '@/components/Stepper';
import { Textarea } from '@/components/Textarea';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { ORDERS_BY_ID } from '@/mocks/orders';

const COMMENT_MAX = 2000;

/** Tanlangan yulduzlar soniga mos matn (19-ekran). */
const RATING_LABELS = ['Yomon', 'Qoniqarli', 'Yaxshi', 'Juda yaxshi', 'Ajoyib'] as const;

/**
 * 19 · Ishni baholang.
 *
 * Baholangach buyurtma DARHOL "Yakunlandi" holatiga o'tadi va chek ekrani
 * ochiladi; baho tahrirlanmaydi va qayta yuborilmaydi (1-bo'lim, 7-qoida).
 */
export type RateWorkVariant = 'empty' | 'selected' | 'submitting' | 'error';

export interface RateWorkScreenProps {
  variant?: RateWorkVariant;
}

export function RateWorkScreen({ variant = 'selected' }: RateWorkScreenProps) {
  const order = ORDERS_BY_ID['o-completed'];
  const master = order.master;

  const [stars, setStars] = useState(variant === 'empty' ? 0 : 5);
  const [comment, setComment] = useState('');

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma" />}
      footer={
        <StickyFooter>
          {/* Yulduz tanlanmaguncha yuborish mumkin emas. */}
          <Button variant="primary" disabled={stars === 0} loading={variant === 'submitting'}>
            Bahoni yuborish
          </Button>
        </StickyFooter>
      }
    >
      <Stepper status={order.status} className="-mx-20" />

      <h1 className="mt-20 text-h1 text-text-primary">Ishni baholang</h1>

      {master && (
        <MasterCard
          name={master.fullName}
          profession={master.profession}
          rating={master.ratingAvg}
          completedOrders={master.completedOrdersCount}
          experience={master.experienceLevel === 'EXPERIENCED' ? 'experienced' : 'new'}
          isCertified={master.hasGovCertificate}
          compact
          className="mt-16"
        />
      )}

      <div className="mt-24 flex flex-col items-center">
        <StarRating value={stars} size="lg" onChange={setStars} />
        {stars > 0 && (
          <p className="mt-12 text-body text-text-primary">{RATING_LABELS[stars - 1]}</p>
        )}
      </div>

      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={COMMENT_MAX}
        placeholder="Izoh (ixtiyoriy)"
        className="mt-24"
      />

      {/*
        Xato holatida server matni `info` banner sifatida ko'rsatiladi va ekran
        avtomatik chek ekraniga o'tadi — baho baribir qabul qilingan bo'lishi
        mumkin, shuning uchun bu xato emas (11-bo'lim, 19-ekran).
      */}
      {variant === 'error' && (
        <Banner variant="info" className="mt-16">
          Bu buyurtma allaqachon baholangan
        </Banner>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
