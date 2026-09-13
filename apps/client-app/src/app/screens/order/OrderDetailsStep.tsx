import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { StepDots } from '@/components/StepDots';
import { Textarea } from '@/components/Textarea';
import { RequestedMasterCard } from '@/components/order/RequestedMasterCard';
import { ServiceSummaryCard } from '@/components/order/ServiceSummaryCard';
import { StepSection } from '@/components/order/StepSection';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import {
  DESCRIPTION_MAX, DESCRIPTION_MIN, descriptionHint, firstMissingStep,
  ORDER_STEP_ROUTES, resolveNextRoute,
} from '@/lib/orderFlow';
import { masterById } from '@/mocks/masters';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';
import { useApp } from '../../store';
import { useReturnTo } from '../../useReturnTo';
import { MissingStepGuard } from './MissingStepGuard';

/** 08 · Buyurtma berish — muammo tavsifi. */
export function OrderDetailsStep() {
  const navigate = useNavigate();
  const { draft, setDraftDetails, setDraftMaster } = useApp();
  const returnTo = useReturnTo();
  const [description, setDescription] = useState(draft.description);

  const category = ALL_CATEGORIES.find((item) => item.id === draft.categoryId);
  const preferred = masterById(draft.preferredMasterId ?? undefined);
  const hint = descriptionHint(description);
  const isTyping = description.trim().length > 0;

  // Matn orqaga bosganda ham saqlanadi — foydalanuvchi yozganini yoʻqotmaydi.
  const leave = (to: string | -1) => {
    setDraftDetails(description);
    if (to === -1) navigate(-1);
    else navigate(to);
  };

  const missing = firstMissingStep(draft, ['category']);
  if (!category || missing) {
    return <MissingStepGuard title="Buyurtma berish" missing={missing ?? { key: 'category', route: ORDER_STEP_ROUTES.services, title: 'Avval xizmat turini tanlang', cta: 'Xizmat tanlash' }} />;
  }

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma berish" onBack={() => leave(-1)} />}
      footer={
        <StickyFooter>
          <Button
            variant="primary"
            disabled={hint !== null}
            onClick={() => leave(resolveNextRoute(ORDER_STEP_ROUTES.address, returnTo))}
          >
            {returnTo ? 'Saqlash' : 'Manzilga oʻtish'}
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={0} />

      <ServiceSummaryCard
        service={category}
        basePrice={category.basePrice}
        size="hero"
        onChange={() => leave(ORDER_STEP_ROUTES.services)}
        className="mt-16"
      />

      {preferred && (
        <RequestedMasterCard master={preferred} onRemove={() => setDraftMaster(null)} className="mt-12" />
      )}

      <StepSection
        title="Muammoni tasvirlab bering"
        hint={`Nima buzilgan, qayerda va qachondan beri — usta shu matnni oʻqib keladi. Kamida ${DESCRIPTION_MIN} belgi.`}
      >
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={DESCRIPTION_MAX}
          placeholder="Masalan: oshxonadagi kran oqmoqda, suv shkaf ostiga toʻplanyapti"
          error={isTyping && hint ? hint : undefined}
        />
      </StepSection>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
