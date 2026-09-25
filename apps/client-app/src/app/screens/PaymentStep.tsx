import { ArrowRight, CreditCard, Medal, Money, ShieldCheck } from '@phosphor-icons/react';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { StepDots } from '@/components/StepDots';
import { InfoChip } from '@/components/InfoChip';
import { Card } from '@/components/Card';
import { ChoiceCard } from '@/components/order/ChoiceCard';
import { PriceBreakdown } from '@/components/order/PriceBreakdown';
import { ServiceSummaryCard } from '@/components/order/ServiceSummaryCard';
import { StepSection } from '@/components/order/StepSection';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatPercent } from '@/lib/formatters';
import { firstMissingStep, ORDER_STEP_ROUTES } from '@/lib/orderFlow';
import { buildInvoice } from '@/lib/pricing';
import { timingLabel } from '@/lib/schedule';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { CASHBACK_BLOCK, METHOD_LABELS } from '@/lib/wallet';
import { isMethodAvailable } from '@/lib/walletCard';
import { useCatalog } from '../catalog-store';
import { useApp } from '../store';
import { MissingStepGuard } from './order/MissingStepGuard';
import { useWallet } from '../useWallet';
import type { PaymentMethod } from '../types';

/**
 * Toʻlov usuli — buyurtma oqimining toʻrtinchi qadami.
 *
 * Click va Payme HALI ULANMAGAN. Shuning uchun faqat naqd tanlanadi, qolgan
 * ikkisi roʻyxatda koʻrinadi, lekin `disabled` atributi bilan: qator fokus
 * olmaydi va bosilmaydi, yaʼni "bosildi — hech narsa boʻlmadi" holati
 * texnik jihatdan yuzaga kelmaydi.
 *
 * Kafolatli toʻlov roʻyxatdan OLIB TASHLANMAYDI: kirish ekrani, tanishtiruv
 * va AI yordamchi mijozga aynan shuni vaʼda qilgan — uni jimgina yoʻqotish
 * vaʼdani boshqa turdagi buzish boʻlardi.
 */
interface MethodOption {
  key: PaymentMethod;
  icon: typeof Money;
  tone: string;
  hint: string;
  /** `METHOD_AVAILABILITY` dan — "Karta" sahifasi bilan bitta manba. */
  comingSoon: boolean;
}

/*
 * Naqd BIRINCHI turadi. Demoda Click birinchi; bizda teskari — yagona
 * tanlanadigan qator ikkita oʻlik qatordan keyin tursa, foydalanuvchi ikki
 * marta muvaffaqiyatsiz bosishga majbur boʻlardi.
 *
 * Ikona va tuslar "Karta" sahifasidagi `PaymentMethodRow` bilan bir tilda:
 * usul qaysi ekranda chiqmasin, foydalanuvchi uni bir koʻrinishda taniydi.
 */
const METHOD_SEEDS: readonly Omit<MethodOption, 'comingSoon'>[] = [
  {
    key: 'cash',
    icon: Money,
    tone: 'bg-neutral-surface text-text-secondary',
    hint: 'Ish tugagach ustaga joyida toʻlaysiz',
  },
  {
    key: 'escrow',
    icon: ShieldCheck,
    tone: 'bg-success-surface text-success',
    hint: 'Click va Payme ulangach ishga tushadi',
  },
  {
    key: 'card',
    icon: CreditCard,
    tone: 'bg-primary-surface text-primary-pressed',
    hint: 'Click va Payme ulangach ishga tushadi',
  },
];

const METHODS: readonly MethodOption[] = METHOD_SEEDS.map((item) => ({
  ...item,
  comingSoon: !isMethodAvailable(item.key),
}));

export function PaymentStep() {
  const navigate = useNavigate();
  const { draft, setDraftPayment } = useApp();
  const { level, cashback } = useWallet();
  const now = useMinuteClock();

  // Naqd oldindan tanlangan: u yagona tanlanadigan variant va boʻsh tanlov
  // faqat hech qachon yoqilmaydigan tugma berardi.
  const [method, setMethod] = useState<PaymentMethod>(draft.paymentMethod ?? 'cash');

  const { findCategory } = useCatalog();
  const category = findCategory(draft.categoryId);

  const invoice = useMemo(
    () =>
      buildInvoice({
        base: category?.basePrice ?? 0,
        isUrgent: draft.isUrgent,
        discountPercent: level.discountPercent,
      }),
    [category?.basePrice, draft.isUrgent, level.discountPercent],
  );

  const missing = firstMissingStep(draft, ['category', 'address']);
  if (!category || !draft.address || missing) {
    return (
      <MissingStepGuard
        title="Toʻlov"
        missing={
          missing ?? {
            key: 'category',
            route: ORDER_STEP_ROUTES.services,
            title: 'Avval xizmat turini tanlang',
            cta: 'Xizmat tanlash',
          }
        }
      />
    );
  }

  const selectable = METHODS.filter((item) => !item.comingSoon);

  const onMethodKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (selectable.length === 0) return;

    const current = selectable.findIndex((item) => item.key === method);
    const step =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? -1
          : 0;

    let next = -1;
    if (step !== 0) next = (current + step + selectable.length) % selectable.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = selectable.length - 1;
    if (next === -1) return;

    event.preventDefault();
    setMethod(selectable[next].key);
  };

  const submit = () => {
    setDraftPayment(method);
    navigate(ORDER_STEP_ROUTES.confirm);
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Toʻlov" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button variant="primary" onClick={submit}>Buyurtmani koʻrib chiqish</Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={2} />
      <ServiceSummaryCard
        service={category}
        basePrice={category.basePrice}
        meta={[timingLabel(draft, now), draft.address.label]}
        className="mt-16"
      />

      <StepSection
        title="Toʻlov usuli"
        hint="Hozircha faqat naqd ishlaydi. Ilova karta maʼlumotini soʻramaydi — Click va Payme ulanganda toʻlov ularning sahifasida boʻladi."
      >
        <div role="radiogroup" aria-label="Toʻlov usuli" onKeyDown={onMethodKeyDown} className="flex flex-col gap-8">
          {METHODS.map((item) => (
            <ChoiceCard
              key={item.key}
              icon={item.icon}
              tone={item.tone}
              title={METHOD_LABELS[item.key]}
              hint={item.hint}
              isSelected={item.key === method}
              disabled={item.comingSoon}
              tabIndex={item.key === method ? 0 : -1}
              onSelect={() => setMethod(item.key)}
            />
          ))}
        </div>
      </StepSection>

      <StepSection
        title="Hisob"
        trailing={invoice.discount > 0 ? (
          <InfoChip tone="primary" icon={Medal}>{level.label} · {formatPercent(level.discountPercent)}</InfoChip>
        ) : undefined}
      >
        <Card>
          <PriceBreakdown invoice={invoice} isEstimate />
        </Card>
        <p className="mt-8 px-4 text-caption text-text-secondary">
          Xizmat haqi ustaning komissiyasidan olinadi — sizdan komissiya olinmaydi. Bu buyurtma yakunlangach keshbek bloki: {Math.min(cashback.filled + 1, CASHBACK_BLOCK)}/{CASHBACK_BLOCK}.
        </p>
        <Button variant="ghost" size="small" fullWidth={false} trailingIcon={ArrowRight} onClick={() => navigate('/app/wallet/bonus')} className="-ml-16 mt-4">
          Chegirma va keshbek qanday ishlaydi?
        </Button>
      </StepSection>

      <Banner variant="warning" icon={ShieldCheck} className="mt-24">
        Usta yetib kelgunicha bekor qilish bepul — hech qanday pul yechilmaydi.
      </Banner>
      <Button variant="ghost" size="small" fullWidth={false} trailingIcon={ArrowRight} onClick={() => navigate('/app/guarantee')} className="-ml-16 mt-4">
        Bugungi himoya qanday ishlaydi?
      </Button>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
