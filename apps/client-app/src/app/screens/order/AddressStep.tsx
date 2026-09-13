import { BookmarkSimple } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AddressPartFields } from '@/components/AddressPartFields';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Input } from '@/components/Input';
import { SelectableChip } from '@/components/SelectableChip';
import { StepDots } from '@/components/StepDots';
import { Toggle } from '@/components/Toggle';
import { ServiceSummaryCard } from '@/components/order/ServiceSummaryCard';
import { StepSection } from '@/components/order/StepSection';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { ORDER_STEP_ROUTES, resolveNextRoute, saveOfferHint } from '@/lib/orderFlow';
import {
  ADDRESS_KIND_LABELS, ADDRESS_KINDS, ADDRESS_LABEL_MAX, ADDRESS_LABEL_MIN,
  buildAddress, canSaveAddress, EMPTY_ADDRESS_FORM, isSameAddress, toAddressForm,
  type AddressFormInput,
} from '@/lib/savedAddress';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';
import { useAddresses } from '../../address-store';
import { useApp } from '../../store';
import { useToast } from '../../ToastHost';
import { useReturnTo } from '../../useReturnTo';

/** 09b · Yangi manzil. Koordinata yoʻq — faqat matn (savedAddress.ts). */
export function AddressStep() {
  const navigate = useNavigate();
  const { draft, setDraftAddress } = useApp();
  const { addresses, addAddress, isFull, findDuplicateAddress } = useAddresses();
  const showToast = useToast();
  const returnTo = useReturnTo();

  const [form, setForm] = useState<AddressFormInput>(() => {
    const current = draft.address;
    if (!current) return EMPTY_ADDRESS_FORM;
    const match = addresses.find((item) => isSameAddress(item.address, current));
    if (match) return toAddressForm(match);
    return {
      ...EMPTY_ADDRESS_FORM,
      kind: 'other',
      label: current.label,
      entrance: current.entrance ?? '',
      floor: current.floor ?? '',
      apartment: current.apartment ?? '',
    };
  });
  const [shouldSave, setShouldSave] = useState(false);

  const category = ALL_CATEGORIES.find((item) => item.id === draft.categoryId);
  if (!category) return <Navigate to={ORDER_STEP_ROUTES.services} replace />;

  const patch = (partial: Partial<AddressFormInput>) => setForm((prev) => ({ ...prev, ...partial }));
  const isValid = canSaveAddress(form);
  const duplicate = findDuplicateAddress(form);
  const canOfferSave = !isFull && !duplicate;
  const isSaving = shouldSave && canOfferSave && isValid;
  const labelError = form.label.trim().length > 0 && !isValid ? `Kamida ${ADDRESS_LABEL_MIN} belgi` : undefined;

  const back = () => {
    // Notoʻgʻri manzil qoralamaga hech qachon kirmaydi.
    if (isValid) setDraftAddress(buildAddress(form));
    navigate(-1);
  };

  const submit = () => {
    if (!isValid) return;
    setDraftAddress(buildAddress(form));
    if (isSaving) {
      const id = addAddress(form);
      if (id) showToast('Manzil saqlandi', 'success');
    }
    navigate(resolveNextRoute(ORDER_STEP_ROUTES.schedule, returnTo));
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Yangi manzil" onBack={back} />}
      footer={
        <StickyFooter>
          <Button variant="primary" disabled={!isValid} onClick={submit}>
            {returnTo ? 'Saqlash' : 'Manzilni tasdiqlash'}
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={1} />
      <ServiceSummaryCard service={category} basePrice={category.basePrice} className="mt-16" />

      <StepSection title="Manzil" hint="Shahar, tuman, koʻcha va uy raqami — usta aynan shu matnni oʻqiydi">
        <Input
          value={form.label}
          onChange={(event) => patch({ label: event.target.value })}
          placeholder="Toshkent, Chilonzor 9-kvartal, 42-uy"
          maxLength={ADDRESS_LABEL_MAX}
          error={labelError}
        />
        <AddressPartFields
          values={{ entrance: form.entrance, floor: form.floor, apartment: form.apartment }}
          onChange={(key, value) => patch({ [key]: value })}
          className="mt-12"
        />
      </StepSection>

      {/* Har doim chiziladi — yozayotganda maydonlar ostida hech narsa sakramaydi. */}
      <Card className="mt-24">
        <div className="flex items-center gap-12">
          <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md bg-primary-surface text-primary-pressed" aria-hidden>
            <Icon icon={BookmarkSimple} size={20} weight="duotone" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-title text-text-primary">Manzilni saqlash</p>
            <p className="mt-2 text-body-sm text-text-secondary">{saveOfferHint({ isValid, isFull, duplicate })}</p>
          </div>
          <Toggle
            checked={isSaving}
            disabled={!isValid || !canOfferSave}
            onChange={setShouldSave}
            label="Manzilni saqlash"
          />
        </div>

        {isSaving && (
          <div role="group" aria-label="Manzil turi" className="mt-12 flex gap-8 border-t border-border pt-12">
            {ADDRESS_KINDS.map((kind) => (
              <SelectableChip key={kind} selected={form.kind === kind} onSelect={() => patch({ kind })}>
                {ADDRESS_KIND_LABELS[kind]}
              </SelectableChip>
            ))}
          </div>
        )}
      </Card>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
