import { Warning } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { ReviewCard } from '@/components/ReviewCard';
import { StarRating } from '@/components/StarRating';
import { DashedChip } from '@/components/DashedChip';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { formatDayLabel } from '@/lib/formatters';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { reviewDate, SAMPLE_REVIEWS } from '@/mocks/reviews';
import type { OrderRating } from '@/lib/rating';
import { useApp } from '../store';
import type { LiveOrder } from '../types';

/**
 * Sharhlar sahifasi — bosh sahifadagi "Barchasini koʻrish" ning HAQIQIY
 * manzili.
 *
 * Birinchi blok yagona haqiqiy maʼlumot: foydalanuvchining oʻz baholari.
 * Namuna fikrlar ogohlantirish banneri va Demo belgisi ostida. Sarlavhada
 * "-imiz" yoʻq: bizda boʻlmagan maʼlumotga egalik daʼvo qilmaymiz.
 */
interface RatedOrder {
  order: LiveOrder;
  rating: OrderRating;
}

export function ReviewsScreen() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { orders } = useApp();

  const rated: RatedOrder[] = orders.flatMap((order) =>
    order.status === ORDER_STATUS.CLOSED && order.rating ? [{ order, rating: order.rating }] : [],
  );

  return (
    <ScreenShell
      header={<Header variant="inner" title="Mijozlar fikrlari" onBack={() => navigate(-1)} />}
    >
      <Banner variant="warning" icon={Warning} className="mt-16">
        «Namuna fikrlar» boʻlimidagi sharhlar toʻqima. Boshqa mijozlarning haqiqiy sharhlari
        server ulangach shu yerda koʻrinadi.
      </Banner>

      <h2 className="mt-24 text-h3 text-text-primary">Sizning baholaringiz</h2>
      {rated.length === 0 ? (
        <p className="mt-12 text-body-sm text-text-secondary">
          Hali baho bermagansiz. Yakunlangan buyurtmani baholasangiz, u shu yerda koʻrinadi.
        </p>
      ) : (
        <ul className="mt-12 flex flex-col gap-12">
          {rated.map(({ order, rating }) => (
            <li key={order.id}>
              <Card>
                <p className="text-title text-text-primary">{order.categoryName}</p>
                <div className="mt-4 flex items-center justify-between gap-8">
                  <StarRating value={rating.stars} size="sm" showValue />
                  {order.completedAt && (
                    <span className="text-caption text-text-secondary">
                      {formatDayLabel(order.completedAt, now)}
                    </span>
                  )}
                </div>
                {rating.comment && (
                  <p className="mt-8 text-body-sm text-text-primary">“{rating.comment}”</p>
                )}
                {rating.tags.length > 0 && (
                  <p className="mt-4 text-caption text-text-secondary">{rating.tags.join(' · ')}</p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-24 text-h3 text-text-primary">Namuna fikrlar</h2>
      {/* `span`, `button` EMAS: bajaradigan amali yoʻq. */}
      <DashedChip className="mt-12">Demo · namuna fikrlar</DashedChip>
      <ul className="mt-12 flex flex-col gap-12">
        {SAMPLE_REVIEWS.map((review) => (
          <li key={review.id}>
            <ReviewCard
              customerName={review.customerName}
              stars={review.stars}
              comment={review.comment}
              likeCount={review.likeCount}
              createdAt={reviewDate(review, now)}
              now={now}
              clampQuote={false}
            />
          </li>
        ))}
      </ul>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
