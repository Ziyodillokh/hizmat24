import { BookmarkSimple, MapPin } from '@phosphor-icons/react';
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
  ADDRESS_KIND_LABELS, ADDRESS_KINDS, ADDRESS_LABEL_MAX,
  buildAddress, canSaveAddress, EMPTY_ADDRESS_FORM, isSameAddress, toAddressForm,
  type AddressFormInput,
} from '@/lib/savedAddress';
import { cityBadge, streetProblem, withCity, withoutCity } from '@/lib/serviceArea';
import { useAddresses } from '../../address-store';
import { useServiceCity } from '../../service-area-store';
import { useCatalog } from '../../catalog-store';
import { useApp } from '../../store';
import { useToast } from '../../ToastHost';
import { useReturnTo } from '../../useReturnTo';

/**
 * 09b · Yangi manzil. Koordinata yoʻq — faqat matn (savedAddress.ts).
 *
 * Shahar TANLANMAYDI: platforma hozir faqat bitta shaharda ishlaydi
 * (P3) va uni tanlatish — boʻlmagan tanlovni bor qilib koʻrsatish
 * boʻlardi. Foydalanuvchi koʻcha va uyni yozadi, shahar esa maydonning
 * oldida qulflangan holda turadi va serverga ketadigan matnga qoʻshiladi.
 */
export function AddressStep() {
  const navigate = useNavigate();
  const { draft, setDraftAddress } = useApp();
  const { addresses, addAddress, isFull, findDuplicateAddress } = useAddresses();
  const showToast = useToast();
  const returnTo = useReturnTo();
  const city = useServiceCity();

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

  const { findCategory } = useCatalog();
  const category = findCategory(draft.categoryId);
  if (!category) return <Navigate to={ORDER_STEP_ROUTES.services} replace />;

  const patch = (partial: Partial<AddressFormInput>) => setForm((prev) => ({ ...prev, ...partial }));
  const street = withoutCity(form.label, city);
  const streetError = street.trim().length > 0 ? streetProblem(street) : null;
  const isValid = canSaveAddress(form) && streetProblem(street) === null;
  const duplicate = findDuplicateAddress(form);
  const canOfferSave = !isFull && !duplicate;
  const isSaving = shouldSave && canOfferSave && isValid;

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

      <StepSection title="Manzil" hint="Koʻcha, uy va mahalla — usta aynan shu matnni oʻqiydi">
        {/*
          Shahar qulflangan: platforma hozir faqat shu yerda ishlaydi.
          Kiritish maydoni emas, yorliq — bosib boʻlmaydigan tugma qoʻyish
          taqiqlangan.
        */}
        <div className="mb-8 flex items-center gap-8 rounded-md bg-surface-sunken px-16 py-12">
          <Icon icon={MapPin} size={20} weight="duotone" className="shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-body-strong text-text-primary">{cityBadge(city)}</p>
            <p className="text-caption text-text-secondary">
              Hozircha faqat shu shaharda xizmat koʻrsatamiz
            </p>
          </div>
        </div>
        <Input
          value={street}
          onChange={(event) => patch({ label: withCity(event.target.value, city) })}
          placeholder="Uychi koʻchasi 12, 4-uy"
          maxLength={ADDRESS_LABEL_MAX}
          error={streetError ?? undefined}
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
