import { Crosshair, Timer } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { Input } from '@/components/Input';
import { StepDots } from '@/components/StepDots';
import { SummaryRow } from '@/components/SummaryRow';
import { Textarea } from '@/components/Textarea';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { MapPreview } from '@/screens/_shared/MapPreview';
import { serviceIcon } from '@/lib/serviceIcons';
import { formatApproxPrice, formatPercent, formatPrice } from '@/lib/formatters';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';
import { buildInvoice } from '@/lib/pricing';
import { timingLabel } from '@/lib/schedule';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { METHOD_LABELS } from '@/lib/wallet';
import { useApp } from '../store';
import { useWallet } from '../useWallet';
import { useToast } from '../ToastHost';
import { tapFeedback } from '../native';

const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 2000;
const ADDRESS_MIN = 5;
const DETECTED_ADDRESS = "Toshkent, Chilonzor 9-kvartal, 42-uy";

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
    navigate('/app/new/map');
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

/** 09 · Xaritada manzil tanlash. */
export function MapStep() {
  const navigate = useNavigate();

  return (
    <ScreenShell
      bleed
      header={<Header variant="inner" title="Manzilni tanlang" onBack={() => navigate(-1)} />}
    >
      <div className="relative h-[420px]">
        <MapPreview size="full" />
        <button
          type="button"
          aria-label="Mening joylashuvim"
          className="absolute bottom-16 right-16 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-surface-raised shadow-e2"
        >
          <Icon icon={Crosshair} size={24} className="text-primary" />
        </button>
      </div>

      <div className="rounded-t-xl bg-surface-modal p-20 shadow-e3">
        <p className="text-body-lg text-text-primary">{DETECTED_ADDRESS}</p>
        <Button variant="primary" className="mt-16" onClick={() => navigate('/app/new/address')}>
          Shu yerda
        </Button>
      </div>
    </ScreenShell>
  );
}

/** 10 · Manzil tafsilotlari. */
export function AddressStep() {
  const navigate = useNavigate();
  const { setDraftAddress } = useApp();

  const [label, setLabel] = useState(DETECTED_ADDRESS);
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [apartment, setApartment] = useState('');

  const isValid = label.trim().length >= ADDRESS_MIN;

  const save = () => {
    setDraftAddress({
      label: label.trim(),
      entrance: entrance.trim() || undefined,
      floor: floor.trim() || undefined,
      apartment: apartment.trim() || undefined,
    });
    navigate('/app/new/schedule');
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Manzil tafsilotlari" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button variant="primary" disabled={!isValid} onClick={save}>
            Davom etish
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={1} />

      <MapPreview className="mt-16" />

      <Input
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        placeholder="Manzil"
        maxLength={300}
        error={label.trim().length > 0 && !isValid ? 'Kamida 5 belgi kiriting' : undefined}
        className="mt-20"
      />

      <div className="mt-12 flex gap-12">
        <Input
          value={entrance}
          onChange={(event) => setEntrance(event.target.value)}
          placeholder="Masalan: 2-kirish"
          maxLength={20}
        />
        <Input
          value={floor}
          onChange={(event) => setFloor(event.target.value)}
          placeholder="Qavat"
          maxLength={20}
        />
        <Input
          value={apartment}
          onChange={(event) => setApartment(event.target.value)}
          placeholder="Xonadon"
          maxLength={20}
        />
      </div>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

/** 11 · Buyurtmani tasdiqlash. */
export function ConfirmStep() {
  const navigate = useNavigate();
  const { draft, createOrder } = useApp();
  const { level } = useWallet();
  const now = useMinuteClock();
  const showToast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const category = ALL_CATEGORIES.find((item) => item.id === draft.categoryId);

  const submit = () => {
    setIsSubmitting(true);
    const orderId = createOrder(level.discountPercent);
    if (orderId) {
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
        ? '/app/new/map'
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
  const hasDetails = Boolean(address.entrance || address.floor || address.apartment);

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

      <Card className="mt-12">
        <p className="text-body text-text-primary">{draft.description}</p>
        {draft.isUrgent && (
          <InfoChip icon={Timer} tone="warning" className="mt-12">
            Shoshilinch
          </InfoChip>
        )}
      </Card>

      <Card className="mt-12">
        <MapPreview />
        <p className="mt-12 text-body text-text-primary">{address.label}</p>
        {hasDetails && (
          <p className="mt-4 text-body-sm text-text-secondary">
            {/* Raqamlar yorliqsiz berilsa "2 · 3-qavat · 45" maʼnosiz oʻqiladi. */}
            {[
              address.entrance && `${address.entrance}-podez`,
              address.floor && `${address.floor}-qavat`,
              address.apartment && `${address.apartment}-xonadon`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </Card>

      <Banner variant="warning" className="mt-16">
        Buyurtma berilgandan keyin uni tahrirlab boʻlmaydi.
      </Banner>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
