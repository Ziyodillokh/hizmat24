import { CheckCircle, Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { StepDots } from '@/components/StepDots';
import { ServiceSummaryCard } from '@/components/order/ServiceSummaryCard';
import { StepSection } from '@/components/order/StepSection';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { ORDER_STEP_ROUTES, preselectedAddressId, resolveNextRoute } from '@/lib/orderFlow';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { useAddresses } from '../../address-store';
import { tapFeedback } from '../../native';
import { useCatalog } from '../../catalog-store';
import { useApp } from '../../store';
import { useReturnTo } from '../../useReturnTo';
import { AddressRow, kindChipFor } from '../AddressBook';

/** 09a · Saqlangan manzilni tanlash. Boʻsh roʻyxatda toʻgʻridan-toʻgʻri formaga oʻtadi. */
export function SavedAddressStep() {
  const navigate = useNavigate();
  const { draft, setDraftAddress } = useApp();
  const { addresses } = useAddresses();
  const now = useMinuteClock();
  const returnTo = useReturnTo();
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    preselectedAddressId(addresses, draft.address),
  );

  const { findCategory } = useCatalog();
  const category = findCategory(draft.categoryId);
  if (!category) return <Navigate to={ORDER_STEP_ROUTES.services} replace />;
  if (addresses.length === 0) {
    return <Navigate to={ORDER_STEP_ROUTES.addressNew} replace state={{ returnTo }} />;
  }

  const next = () => {
    const saved = addresses.find((item) => item.id === selectedId);
    if (!saved) return;
    setDraftAddress(saved.address);
    void tapFeedback();
    navigate(resolveNextRoute(ORDER_STEP_ROUTES.schedule, returnTo));
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Manzil" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button variant="primary" disabled={selectedId === null} onClick={next}>
            {returnTo ? 'Saqlash' : 'Vaqtni tanlash'}
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={1} />
      <ServiceSummaryCard service={category} basePrice={category.basePrice} className="mt-16" />

      <StepSection title="Qayerga kelsin?" hint="Faqat shu qurilmada saqlanadi. Oxirgi ishlatilgani yuqorida turadi">
        <ul role="radiogroup" aria-label="Saqlangan manzillar" className="flex flex-col gap-8">
          {addresses.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <li key={item.id}>
                <AddressRow
                  saved={item}
                  now={now}
                  isSelected={isSelected}
                  onSelect={() => setSelectedId(item.id)}
                  action={
                    isSelected
                      ? <Icon icon={CheckCircle} size={24} weight="fill" className="text-primary" aria-hidden />
                      : kindChipFor(item)
                  }
                />
              </li>
            );
          })}
        </ul>

        {/* Ikkilamchi amal roʻyxat ostida — footerda bitta asosiy tugma qoladi. */}
        <button
          type="button"
          onClick={() => navigate(ORDER_STEP_ROUTES.addressNew, { state: { returnTo } })}
          className="mt-12 flex min-h-[52px] w-full items-center justify-center gap-8 rounded-lg border border-dashed border-border-strong text-body-sm font-semibold text-primary transition-colors duration-press ease-std active:bg-surface-sunken"
        >
          <Icon icon={Plus} size={20} weight="bold" aria-hidden />
          Boshqa manzil kiritish
        </button>
      </StepSection>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
