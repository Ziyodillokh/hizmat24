import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { MasterCard } from '@/components/MasterCard';
import { StarRating } from '@/components/StarRating';
import { Stepper } from '@/components/Stepper';
import { Textarea } from '@/components/Textarea';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatDateTime, formatPrice, orEmpty } from '@/lib/formatters';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { useApp } from '../store';
import { useToast } from '../ToastHost';
import { tapFeedback } from '../native';

const RATING_LABELS = ['Yomon', 'Qoniqarli', 'Yaxshi', 'Juda yaxshi', 'Ajoyib'] as const;

/** 19 · Ishni baholang. */
export function RateOrderScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { findOrder, rateOrder } = useApp();
  const showToast = useToast();

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');

  const order = orderId ? findOrder(orderId) : undefined;
  if (!order) return <Navigate to="/app/home" replace />;
  if (order.status !== ORDER_STATUS.COMPLETED_BY_MASTER) {
    return <Navigate to={`/app/order/${order.id}/receipt`} replace />;
  }

  const submit = () => {
    rateOrder(order.id, stars, comment.trim());
    void tapFeedback();
    showToast('Bahoingiz uchun rahmat', 'success');
    navigate(`/app/order/${order.id}/receipt`, { replace: true });
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma" />}
      footer={
        <StickyFooter>
          <Button variant="primary" disabled={stars === 0} onClick={submit}>
            Bahoni yuborish
          </Button>
        </StickyFooter>
      }
    >
      <Stepper status={order.status} className="-mx-20" />
      <h1 className="mt-20 text-h1 text-text-primary">Ishni baholang</h1>

      {order.master && (
        <MasterCard
          name={order.master.fullName}
          profession={order.master.profession}
          rating={order.master.ratingAvg}
          completedOrders={order.master.completedOrdersCount}
          experience={order.master.experienceLevel === 'EXPERIENCED' ? 'experienced' : 'new'}
          isCertified={order.master.hasGovCertificate}
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
        maxLength={2000}
        placeholder="Izoh (ixtiyoriy)"
        className="mt-24"
      />

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-16 py-12">
      <span className="shrink-0 text-body-sm text-text-secondary">{label}</span>
      <span className="min-w-0 text-right text-body-lg text-text-primary">{children}</span>
    </div>
  );
}

/** 20 · Chek. */
export function ReceiptScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { findOrder } = useApp();

  const order = orderId ? findOrder(orderId) : undefined;
  if (!order) return <Navigate to="/app/home" replace />;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Chek" onBack={() => navigate('/app/home')} />}
      footer={
        <StickyFooter>
          <Button variant="secondary" onClick={() => navigate('/app/services')}>
            Qayta buyurtma berish
          </Button>
        </StickyFooter>
      }
    >
      <div className="mt-4 rounded-lg border border-border bg-surface-elevated p-16">
        <Row label="Buyurtma raqami">
          <span className="tabular tracking-[0.4px]">{order.shortId}</span>
        </Row>
        <div className="border-t border-dashed border-border" />
        <Row label="Xizmat">{order.categoryName}</Row>
        <Row label="Usta">{orEmpty(order.master?.fullName)}</Row>
        <Row label="Baho">
          {order.rating ? (
            <StarRating value={order.rating.stars} size="sm" showValue />
          ) : (
            orEmpty(null)
          )}
        </Row>
        <Row label="Yakunlangan sana">
          {order.completedAt ? formatDateTime(order.completedAt, new Date()) : orEmpty(null)}
        </Row>

        <div className="border-t border-dashed border-border pt-16" />
        <div className="flex items-baseline justify-between gap-16">
          <span className="text-body-lg text-text-secondary">Jami</span>
          <span className="text-display text-text-primary tabular">{formatPrice(order.price)}</span>
        </div>
      </div>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
