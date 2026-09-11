import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { MasterCard } from '@/components/MasterCard';
import { StarRating } from '@/components/StarRating';
import { SummaryRow } from '@/components/SummaryRow';
import { Stepper } from '@/components/Stepper';
import { Textarea } from '@/components/Textarea';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatDateTime, formatPrice, orEmpty } from '@/lib/formatters';
import { Warning } from '@phosphor-icons/react';
import { Banner } from '@/components/Banner';
import { SelectableChip } from '@/components/SelectableChip';
import { canRate, hasReceipt } from '@/lib/orderStateMachine';
import {
  canSubmitRating,
  isNegativeRating,
  ratingLabel,
  ratingTagsFor,
  requiresReasonTag,
  shouldResetTags,
  submitHint,
} from '@/lib/rating';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { METHOD_LABELS } from '@/lib/wallet';
import { cn } from '@/lib/cn';
import { useApp } from '../store';
import { useToast } from '../ToastHost';
import { tapFeedback } from '../native';

/** 19 · Ishni baholang. */
export function RateOrderScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { findOrder, rateOrder } = useApp();
  const showToast = useToast();
  const now = useMinuteClock();

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const order = orderId ? findOrder(orderId) : undefined;
  if (!order) return <Navigate to="/app/home" replace />;

  // Holat qoʻlda tekshirilmaydi — qoida kutubxonada.
  if (!canRate(order.status)) {
    return hasReceipt(order.status) ? (
      <Navigate to={`/app/order/${order.id}/receipt`} replace />
    ) : (
      <Navigate to={`/app/order/${order.id}`} replace />
    );
  }

  /*
   * Yulduz ijobiydan salbiyga oʻtsa savol ham, teglar toʻplami ham
   * almashadi — eski tanlov yangi savol ostida maʼnosiz qolardi.
   */
  const handleStars = (next: number) => {
    if (shouldResetTags(stars, next)) setTags([]);
    setStars(next);
  };

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));

  const hint = submitHint(stars, tags);

  const submit = () => {
    rateOrder(order.id, { stars, comment, tags });
    void tapFeedback();
    // Past bahoda "rahmat" deyish quloqqa yot.
    if (isNegativeRating(stars)) showToast('Baho qabul qilindi');
    else showToast('Bahoingiz uchun rahmat', 'success');
    navigate(`/app/order/${order.id}/receipt`, { replace: true });
  };

  return (
    <ScreenShell
      header={
        <Header
          variant="inner"
          title="Baholash"
          // Chiqib ketish yoʻqotish emas: buyurtma aktiv roʻyxatda qoladi va
          // bosh sahifadagi karta orqali shu yerga qaytish mumkin.
          onBack={() => navigate('/app/home', { replace: true })}
        />
      }
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            <Button variant="primary" disabled={!canSubmitRating(stars, tags)} onClick={submit}>
              Bahoni yuborish
            </Button>
            {hint ? (
              <p className="text-center text-body-sm text-text-secondary">{hint}</p>
            ) : (
              <p className="text-center text-caption text-text-secondary">
                Baho yuborilgach buyurtma yopiladi. Bahoni keyin oʻzgartirib boʻlmaydi.
              </p>
            )}
          </div>
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
          photoUrl={order.master.photoUrl}
          experience={order.master.experienceLevel === 'EXPERIENCED' ? 'experienced' : 'new'}
          isCertified={order.master.hasGovCertificate}
          compact
          className="mt-16"
        />
      )}

      {/* Baho NIMAGA berilayotgani: summa, sana va toʻlov usuli. */}
      <div
        className={cn(
          'mt-12 rounded-lg border border-transparent bg-surface-elevated p-16 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <SummaryRow label="Xizmat" value={order.categoryName} />
        <SummaryRow
          label="Yakunlangan sana"
          value={order.completedAt ? formatDateTime(order.completedAt, now) : orEmpty(null)}
        />
        <SummaryRow label="Toʻlov usuli" value={METHOD_LABELS[order.paymentMethod]} />

        <div className="border-t border-dashed border-border pt-16" />
        <div className="flex items-baseline justify-between gap-16">
          <span className="text-body-lg text-text-secondary">Jami</span>
          <span className="tabular text-display text-text-primary">
            {formatPrice(order.invoice.total)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/app/order/${order.id}/proof`)}
        className="mt-12 px-4 text-caption text-primary-pressed"
      >
        Ish isbotini koʻrish
      </button>

      <h2 className="mt-24 text-h3 text-text-primary">Ishni qanday baholaysiz?</h2>
      <p className="mt-4 text-caption text-text-secondary">
        Yulduzga bosing — oʻzgartirish uchun boshqasini bosing
      </p>

      <div className="mt-16 flex flex-col items-center">
        <StarRating value={stars} size="lg" onChange={handleStars} />
        {ratingLabel(stars) && (
          <p className="mt-12 text-body text-text-primary">{ratingLabel(stars)}</p>
        )}
      </div>

      {stars > 0 && (
        <section className="mt-24">
          <h2 className="text-h3 text-text-primary">
            {isNegativeRating(stars) ? 'Nima notoʻgʻri ketdi?' : 'Nima yoqdi?'}
          </h2>
          {requiresReasonTag(stars) && (
            <p className="mt-4 text-caption text-text-secondary">
              Kamida bittasini tanlang — usta nimani tuzatishi kerakligini bilishi uchun.
            </p>
          )}
          <div className="mt-12 flex flex-wrap gap-8">
            {ratingTagsFor(stars).map((tag) => (
              <SelectableChip
                key={tag}
                selected={tags.includes(tag)}
                onSelect={() => toggleTag(tag)}
              >
                {tag}
              </SelectableChip>
            ))}
          </div>
        </section>
      )}

      {isNegativeRating(stars) && (
        <>
          {/* "Pulni qaytarish" tugmasi YOʻQ: naqd toʻlovda platforma pulni
              qaytara olmaydi va bunday vaʼda berilmaydi. */}
          <Banner variant="warning" icon={Warning} className="mt-16">
            Past baho ustaning reytingiga taʼsir qiladi. Pulni qaytarish va nizo ochish
            keyingi bosqichda ochiladi.
          </Banner>
          <button
            type="button"
            onClick={() => navigate('/app/support')}
            className="mt-12 px-4 text-caption text-primary-pressed"
          >
            Qoʻllab-quvvatlashga yozish
          </button>
        </>
      )}

      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        maxLength={2000}
        placeholder={isNegativeRating(stars) ? 'Nima boʻlganini yozing (ixtiyoriy)' : 'Izoh (ixtiyoriy)'}
        className="mt-24"
      />

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

/** 20 · Chek. */
export function ReceiptScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { findOrder } = useApp();
  const now = useMinuteClock();

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
      <div
        className={cn(
          'mt-4 rounded-lg border border-transparent bg-surface-elevated p-16 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <SummaryRow label="Buyurtma raqami" value={order.shortId} mono />
        <div className="border-t border-dashed border-border" />
        <SummaryRow label="Xizmat" value={order.categoryName} />
        <SummaryRow label="Usta" value={orEmpty(order.master?.fullName)} />
        <SummaryRow
          label="Baho"
          value={
            order.rating ? <StarRating value={order.rating.stars} size="sm" showValue /> : orEmpty(null)
          }
        />
        {/* Tanlangan teglar: usiz chiplar hech qayerda koʻrinmas edi. */}
        {order.rating && order.rating.tags.length > 0 && (
          <p className="pb-12 text-right text-caption text-text-secondary">
            {order.rating.tags.join(' · ')}
          </p>
        )}
        <SummaryRow
          label="Yakunlangan sana"
          value={order.completedAt ? formatDateTime(order.completedAt, now) : orEmpty(null)}
        />
        <SummaryRow label="Toʻlov usuli" value={METHOD_LABELS[order.paymentMethod]} />

        <div className="border-t border-dashed border-border pt-16" />
        <div className="flex items-baseline justify-between gap-16">
          <span className="text-body-lg text-text-secondary">Jami</span>
          <span className="text-display text-text-primary tabular">{formatPrice(order.invoice.total)}</span>
        </div>
      </div>

      {/* Ikki hujjat bir-birini takrorlamaydi, bir-biriga ulanadi: bu chek
          nima qilinganini, toʻlov cheki esa nima toʻlanganini aytadi. */}
      <button
        type="button"
        onClick={() => navigate(`/app/order/${order.id}/payment-receipt`)}
        className="mt-12 px-4 text-caption text-primary-pressed"
      >
        Toʻlov chekini koʻrish
      </button>

      <button
        type="button"
        onClick={() => navigate(`/app/order/${order.id}/proof`)}
        className="mt-8 block px-4 text-caption text-primary-pressed"
      >
        Ish isbotini koʻrish
      </button>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
