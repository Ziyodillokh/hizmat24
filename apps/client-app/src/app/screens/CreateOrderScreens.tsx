import { MapPin, Plus, Timer, Wrench } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { AddressPartFields } from '@/components/AddressPartFields';
import { Input } from '@/components/Input';
import { StepDots } from '@/components/StepDots';
import { SummaryRow } from '@/components/SummaryRow';
import { Textarea } from '@/components/Textarea';
import { Toggle } from '@/components/Toggle';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { serviceIcon } from '@/lib/serviceIcons';
import { addressDetailsLine } from '@/lib/address';
import { formatApproxPrice, formatPercent, formatPrice } from '@/lib/formatters';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';
import { masterById } from '@/mocks/masters';
import { buildInvoice } from '@/lib/pricing';
import { timingLabel } from '@/lib/schedule';
import {
  ADDRESS_KIND_LABELS,
  ADDRESS_LABEL_MAX,
  ADDRESS_LABEL_MIN,
  buildAddress,
  canSaveAddress,
  EMPTY_ADDRESS_FORM,
  isSameAddress,
  toAddressForm,
  type AddressFormInput,
} from '@/lib/savedAddress';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { METHOD_LABELS } from '@/lib/wallet';
import { useAddresses } from '../address-store';
import { useApp } from '../store';
import { useWallet } from '../useWallet';
import { useToast } from '../ToastHost';
import { tapFeedback } from '../native';
import { AddressRow, kindChipFor } from './AddressBook';

const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 2000;

/** 08 · Buyurtma berish — muammo tavsifi. */
export function OrderDetailsStep() {
  const navigate = useNavigate();
  const { draft, setDraftDetails } = useApp();

  const [description, setDescription] = useState(draft.description);

  const category = ALL_CATEGORIES.find((item) => item.id === draft.categoryId);
  const isTooShort = description.trim().length > 0 && description.trim().length < DESCRIPTION_MIN;
  const canContinue = description.trim().length >= DESCRIPTION_MIN;

  const next = () => {
    setDraftDetails(description);
    navigate('/app/new/address');
  };

  if (!category) {
    return (
      <ScreenShell header={<Header variant="inner" title="Buyurtma berish" onBack={() => navigate('/app/home')} />}>
        <Banner variant="warning" className="mt-16">
          Avval xizmat turini tanlang
        </Banner>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma berish" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button variant="primary" disabled={!canContinue} onClick={next}>
            Davom etish
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={0} />

      {/*
        Nom `truncate` emas: "Oʻzgartirish" tugmasi qisqarmagani uchun uzun
        xizmat nomi "Rozetka oʻrna…" boʻlib kesilardi. Endi nom ikki satrgacha
        oʻsadi, amal esa oddiy matnli havola — u kamroq joy egallaydi.
      */}
      <Card className="mt-20 flex items-center gap-12 p-12">
        <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md bg-surface-sunken">
          <Icon icon={serviceIcon(category.iconKey)} size={24} className="text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-title text-text-primary">
            {category.name}
          </p>
          <p className="truncate text-body-sm text-text-secondary">
            {formatApproxPrice(category.basePrice)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/services')}
          className="shrink-0 text-caption text-primary"
        >
          Oʻzgartirish
        </button>
      </Card>

      <h3 className="mt-24 text-h3 text-text-primary">Muammoni tasvirlab bering</h3>
      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength={DESCRIPTION_MAX}
        placeholder="Masalan: oshxonadagi kran oqmoqda…"
        error={isTooShort ? 'Kamida 10 belgi' : undefined}
        className="mt-12"
      />

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

/**
 * 09 · Manzilni tanlash.
 *
 * ILGARI BU EKRAN XARITA EDI va u ikki marta yolgʻon gapirardi: ekran
 * "Manzilni tanlang" deb turib, qattiq yozilgan "Toshkent, Chilonzor
 * 9-kvartal, 42-uy" ni aniqlangan manzil sifatida koʻrsatardi, "Mening
 * joylashuvim" tugmasi esa hech qanday `onClick` ga ega emas edi —
 * ilovada `@capacitor/geolocation` ham, xarita kutubxonasi ham oʻrnatilmagan.
 *
 * Endi ekran haqiqiy ishni bajaradi: saqlangan manzilni tanlaysiz. Saqlangan
 * manzil boʻlmasa ekran umuman koʻrsatilmaydi va foydalanuvchi toʻgʻridan
 * toʻgʻri formaga tushadi — boʻsh oraliq ekran ortiqcha bosish edi.
 */
export function SavedAddressStep() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { draft, setDraftAddress } = useApp();
  const { addresses } = useAddresses();

  if (!draft.categoryId) return <Navigate to="/app/services" replace />;
  if (addresses.length === 0) return <Navigate to="/app/new/address/new" replace />;

  const choose = (id: string) => {
    const saved = addresses.find((item) => item.id === id);
    if (!saved) return;
    setDraftAddress(saved.address);
    void tapFeedback();
    navigate('/app/new/schedule');
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Manzilni tanlang" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button
            variant="secondary"
            leadingIcon={Plus}
            onClick={() => navigate('/app/new/address/new')}
          >
            Boshqa manzil kiritish
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={1} />

      <p className="mt-20 text-body text-text-secondary">
        Saqlangan manzillaringiz. Oxirgi ishlatilgani yuqorida turadi.
      </p>

      <ul className="mt-16 flex flex-col gap-8">
        {addresses.map((item) => (
          <li key={item.id}>
            <AddressRow
              saved={item}
              now={now}
              onSelect={() => choose(item.id)}
              action={kindChipFor(item)}
            />
          </li>
        ))}
      </ul>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

/**
 * 10 · Manzil tafsilotlari.
 *
 * Forma `draft.address` dan tiklanadi. Ilgari u qattiq yozilgan manzildan
 * boshlanardi va `draft` ni umuman oʻqimasdi: foydalanuvchi manzilini
 * yozib, keyingi qadamga oʻtib, orqaga bosganda oʻz matnini yoʻqotardi va
 * oʻrnida yana soxta manzilni koʻrardi.
 */
export function AddressStep() {
  const navigate = useNavigate();
  const { draft, setDraftAddress } = useApp();
  const { addresses, addAddress, isFull, findDuplicateAddress } = useAddresses();
  const showToast = useToast();

  const [form, setForm] = useState<AddressFormInput>(() => {
    const current = draft.address;
    if (!current) return EMPTY_ADDRESS_FORM;

    // Qoralamadagi manzil saqlanganlardan biri boʻlsa, uning turi va nomi
    // ham tiklanadi — foydalanuvchi "Uy" ni qayta tanlab oʻtirmaydi.
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

  const isValid = canSaveAddress(form);
  const duplicate = findDuplicateAddress(form);
  // Takror manzilni qayta saqlash taklif qilinmaydi: u allaqachon roʻyxatda.
  const canOfferSave = !isFull && !duplicate;

  const submit = () => {
    if (!isValid) return;

    setDraftAddress(buildAddress(form));

    if (shouldSave && canOfferSave) {
      const id = addAddress(form);
      if (id) showToast('Manzil saqlandi', 'success');
    }

    navigate('/app/new/schedule');
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Manzil tafsilotlari" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button variant="primary" disabled={!isValid} onClick={submit}>
            Davom etish
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={1} />

      <h3 className="mt-20 text-h3 text-text-primary">Manzil</h3>
      <p className="mt-4 text-caption text-text-secondary">
        Shahar, tuman va uy raqami — usta shu matnni oʻqiydi
      </p>
      <Input
        value={form.label}
        onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
        placeholder="Toshkent, Chilonzor 9-kvartal, 42-uy"
        maxLength={ADDRESS_LABEL_MAX}
        error={
          form.label.trim().length > 0 && !isValid ? `Kamida ${ADDRESS_LABEL_MIN} belgi` : undefined
        }
        className="mt-12"
      />

      <AddressPartFields
        values={{ entrance: form.entrance, floor: form.floor, apartment: form.apartment }}
        onChange={(key, value) => setForm((prev) => ({ ...prev, [key]: value }))}
        className="mt-12"
      />

      {/*
        Saqlash TAKLIF qilinadi, majburlanmaydi va default oʻchiq: manzil —
        shaxsiy maʼlumot va uni qurilmada qoldirishni foydalanuvchi hal
        qiladi.
      */}
      {canOfferSave && isValid && (
        <Card className="mt-20 flex items-center gap-12">
          <div className="min-w-0 flex-1">
            <p className="text-title text-text-primary">Bu manzilni saqlash</p>
            <p className="mt-2 text-body-sm text-text-secondary">
              Keyingi buyurtmada bir bosishda tanlaysiz
            </p>
          </div>
          <Toggle
            checked={shouldSave}
            onChange={setShouldSave}
            label="Bu manzilni saqlash"
            className="shrink-0"
          />
        </Card>
      )}

      {duplicate && (
        <p className="mt-12 px-4 text-caption text-text-secondary">
          Bu manzil allaqachon saqlangan: {ADDRESS_KIND_LABELS[duplicate.kind]}.
        </p>
      )}

      {isFull && !duplicate && (
        <p className="mt-12 px-4 text-caption text-text-secondary">
          Saqlangan manzillar roʻyxati toʻlgan — bu manzil faqat shu buyurtmada ishlatiladi.
        </p>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

/** 11 · Buyurtmani tasdiqlash. */
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

  const submit = () => {
    setIsSubmitting(true);
    const orderId = createOrder(level.discountPercent);
    if (orderId) {
      // Roʻyxat tartibi HAQIQIY ishlatishdan chiqadi — shu yerda yoziladi.
      if (draft.address) noteAddressUsed(draft.address);
      void tapFeedback();
      showToast('Buyurtma qabul qilindi', 'success');
      navigate(`/app/order/${orderId}/payment-receipt`, { replace: true });
    } else {
      // Jimgina muvaffaqiyatsizlik qolmaydi: sabab aytiladi.
      setIsSubmitting(false);
      showToast('Buyurtma yaratilmadi — maʼlumotlar toʻliq emas', 'danger');
    }
  };

  if (!category || !draft.address || !draft.paymentMethod) {
    // Boshi berk koʻcha qolmaydi: yetishmayotgan qadamga yoʻl beriladi.
    const target = !category
      ? '/app/services'
      : !draft.address
        ? '/app/new/address'
        : '/app/new/payment';

    return (
      <ScreenShell header={<Header variant="inner" title="Buyurtmani tasdiqlash" onBack={() => navigate('/app/home')} />}>
        <Banner variant="warning" className="mt-16">
          Buyurtma maʼlumotlari toʻliq emas
        </Banner>
        <Button variant="secondary" className="mt-16" onClick={() => navigate(target)}>
          Toʻldirish
        </Button>
      </ScreenShell>
    );
  }

  /*
   * Tasdiqlash ekranidagi summa chekdagi bilan AYNAN bir xil boʻlishi shart,
   * shuning uchun ikkalasi ham `buildInvoice` dan chiqadi.
   */
  const invoice = buildInvoice({
    base: category.basePrice,
    isUrgent: draft.isUrgent,
    discountPercent: level.discountPercent,
  });

  const { address } = draft;
  const details = addressDetailsLine(address);

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtmani tasdiqlash" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button variant="primary" loading={isSubmitting} onClick={submit}>
            Ustani chaqirish
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={4} />
      <h1 className="mt-20 text-h1 text-text-primary">Buyurtmani tasdiqlang</h1>

      <Card className="mt-16">
        <div className="flex items-start justify-between gap-12">
          <p className="min-w-0 flex-1 text-h3 text-text-primary">{category.name}</p>
          <p className="tabular shrink-0 text-price text-text-primary">
            {formatPrice(invoice.total)}
          </p>
        </div>

        <span className="-mx-16 my-16 block h-px bg-border" aria-hidden />

        <SummaryRow label="Xizmat narxi" value={formatPrice(invoice.base)} />
        {invoice.urgentFee > 0 && (
          <SummaryRow label="Shoshilinch yuborish" value={formatPrice(invoice.urgentFee)} />
        )}
        {invoice.discount > 0 && (
          <SummaryRow
            label={`Daraja chegirmasi (${formatPercent(invoice.discountPercent)})`}
            value={formatPrice(-invoice.discount)}
            tone="success"
          />
        )}
        <SummaryRow label="Vaqt" value={timingLabel(draft, now)} />
        <SummaryRow label="Toʻlov usuli" value={METHOD_LABELS[draft.paymentMethod]} />
      </Card>

      {/*
        Tanlangan usta SOʻROV sifatida koʻrsatiladi. Ilgari tanlov hech
        qayerda koʻrinmasdi va buyurtmaga boshqa odam tayinlanardi.
      */}
      {preferred && (
        <Card className="mt-12 flex items-start gap-12">
          <span
            className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md bg-surface-sunken"
            aria-hidden
          >
            <Icon icon={Wrench} size={20} className="text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-title text-text-primary">{preferred.fullName}</p>
            <p className="mt-2 text-body-sm text-text-secondary">
              Siz shu ustani soʻradingiz. Usta band boʻlsa nima boʻlishini backend hal qiladi —
              hozircha bu tekshiruv yoʻq.
            </p>
            {/* Tanlov qoralamada qoladi, shuning uchun uni bekor qilish yoʻli
                ham boʻlishi kerak — aks holda eski tanlov jimgina qoʻllanardi. */}
            <button
              type="button"
              onClick={() => setDraftMaster(null)}
              className="mt-8 text-caption text-primary-pressed"
            >
              Tanlovni bekor qilish
            </button>
          </div>
        </Card>
      )}

      <Card className="mt-12">
        <p className="text-body text-text-primary">{draft.description}</p>
        {draft.isUrgent && (
          <InfoChip icon={Timer} tone="warning" className="mt-12">
            Shoshilinch
          </InfoChip>
        )}
      </Card>

      {/*
        `MapPreview` OLIB TASHLANDI: yozilgan matn yonida xarita chizish
        geokodlash boʻlgandek koʻrsatardi. Koordinata yoʻq, plitka serveri
        yoʻq — `MasterEnRoute` da shu qaror allaqachon qabul qilingan.
      */}
      <Card className="mt-12 flex items-start gap-12">
        <Icon icon={MapPin} size={20} className="mt-2 shrink-0 text-text-secondary" />
        <div className="min-w-0 flex-1">
          <p className="text-body text-text-primary">{address.label}</p>
          {details && <p className="mt-4 text-body-sm text-text-secondary">{details}</p>}
        </div>
      </Card>

      <Banner variant="warning" className="mt-16">
        Buyurtma berilgandan keyin uni tahrirlab boʻlmaydi.
      </Banner>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
