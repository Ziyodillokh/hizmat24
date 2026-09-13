import { CalendarX, ChatText, Clock, Lightning, MapPin, Money, Wrench, X } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { StepDots } from '@/components/StepDots';
import { DetailRow } from '@/components/order/DetailRow';
import { PriceBreakdown } from '@/components/order/PriceBreakdown';
import { ServiceSummaryCard } from '@/components/order/ServiceSummaryCard';
import { StepSection } from '@/components/order/StepSection';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { addressDetailsLine } from '@/lib/address';
import { formatPrice } from '@/lib/formatters';
import { firstMissingStep, ORDER_STEP_ROUTES } from '@/lib/orderFlow';
import { buildInvoice } from '@/lib/pricing';
import { isScheduleStale, timingLabel } from '@/lib/schedule';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { METHOD_LABELS } from '@/lib/wallet';
import { masterById } from '@/mocks/masters';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';
import { useAddresses } from '../../address-store';
import { tapFeedback } from '../../native';
import { useApp } from '../../store';
import { useToast } from '../../ToastHost';
import { useWallet } from '../../useWallet';
import { MissingStepGuard } from './MissingStepGuard';

/** 11 · Tasdiqlash — chek koʻrinishi, har tafsilot oʻz qalam tugmasi bilan. */
export function ConfirmStep() {
  const navigate = useNavigate();
  const { draft, createOrder, setDraftMaster } = useApp();
  const { noteAddressUsed } = useAddresses();
  const { level } = useWallet();
  const now = useMinuteClock();
  const showToast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const category = ALL_CATEGORIES.find((item) => item.id === draft.categoryId);
  const preferred = masterById(draft.preferredMasterId ?? undefined);
  const isStale = isScheduleStale(draft.scheduledAt, now);

  const invoice = useMemo(
    () => buildInvoice({ base: category?.basePrice ?? 0, isUrgent: draft.isUrgent, discountPercent: level.discountPercent }),
    [category?.basePrice, draft.isUrgent, level.discountPercent],
  );

  const edit = (route: string) => navigate(route, { state: { returnTo: ORDER_STEP_ROUTES.confirm } });

  const submit = () => {
    if (isSubmitting || isStale) return;
    setIsSubmitting(true);
    const orderId = createOrder(level.discountPercent);
    if (orderId) {
      if (draft.address) noteAddressUsed(draft.address);
      void tapFeedback();
      showToast('Buyurtma qabul qilindi', 'success');
      navigate(`/app/order/${orderId}/payment-receipt`, { replace: true });
    } else {
      setIsSubmitting(false);
      showToast('Buyurtma yaratilmadi — maʼlumotlar toʻliq emas', 'danger');
    }
  };

  const missing = firstMissingStep(draft, ['category', 'address', 'payment']);
  if (!category || !draft.address || !draft.paymentMethod || missing) {
    return <MissingStepGuard title="Tasdiqlash" missing={missing ?? { key: 'category', route: ORDER_STEP_ROUTES.services, title: 'Buyurtma maʼlumotlari toʻliq emas', cta: 'Toʻldirish' }} />;
  }

  const details = addressDetailsLine(draft.address);

  return (
    <ScreenShell
      header={<Header variant="inner" title="Tasdiqlash" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <p className="mb-8 text-center text-caption text-text-secondary">
            Tasdiqlangach buyurtmani tahrirlab boʻlmaydi — faqat bekor qilish mumkin
          </p>
          <Button variant="primary" loading={isSubmitting} disabled={isStale} onClick={submit}>
            Ustani chaqirish
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={4} />

      {isStale && (
        <Banner variant="warning" icon={CalendarX} className="mt-16">
          Tanlangan vaqt oʻtib ketdi. Davom etish uchun yangi vaqt tanlang.
          <Button variant="secondary" size="small" fullWidth={false} className="mt-8" onClick={() => edit(ORDER_STEP_ROUTES.schedule)}>
            Vaqtni yangilash
          </Button>
        </Banner>
      )}

      {/* Narx bu yerda YOʻQ — u pastdagi "Hisob" blokida; "Oʻzgartirish"
          havolasi bilan birga nom ikki satrga siqilib qolardi. */}
      <ServiceSummaryCard
        service={category}
        onChange={() => navigate(ORDER_STEP_ROUTES.services)}
        className="mt-16"
      />

      <Card className="mt-12 divide-y divide-border py-4">
        {preferred && (
          <DetailRow
            leading={<Avatar src={preferred.photoUrl} name={preferred.fullName} size={44} shape="square" />}
            icon={Wrench}
            label="Soʻralgan usta"
            value={preferred.fullName}
            detail="Bu soʻrov, kafolat emas — ustaning bandligi hali tekshirilmaydi"
            actionIcon={X}
            actionLabel="Usta tanlovini bekor qilish"
            onAction={() => setDraftMaster(null)}
          />
        )}
        <DetailRow icon={ChatText} label="Muammo" value={draft.description} actionLabel="Tavsifni oʻzgartirish" onAction={() => edit(ORDER_STEP_ROUTES.details)} />
        <DetailRow icon={MapPin} label="Manzil" value={draft.address.label} detail={details ?? undefined} actionLabel="Manzilni oʻzgartirish" onAction={() => edit(ORDER_STEP_ROUTES.address)} />
        <DetailRow
          icon={draft.isUrgent ? Lightning : Clock}
          label="Vaqt"
          value={timingLabel(draft, now)}
          detail={draft.isUrgent ? `Shoshilinch · +${formatPrice(invoice.urgentFee)}` : undefined}
          actionLabel="Vaqtni oʻzgartirish"
          onAction={() => edit(ORDER_STEP_ROUTES.schedule)}
        />
        <DetailRow icon={Money} label="Toʻlov" value={METHOD_LABELS[draft.paymentMethod]} actionLabel="Toʻlov usulini oʻzgartirish" onAction={() => edit(ORDER_STEP_ROUTES.payment)} />
      </Card>

      <StepSection title="Hisob">
        <Card>
          <PriceBreakdown invoice={invoice} isEstimate />
        </Card>
      </StepSection>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
