import { CreditCard, Info, LockSimple, Money, ShieldCheck } from '@phosphor-icons/react';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { StepDots } from '@/components/StepDots';
import { SummaryRow } from '@/components/SummaryRow';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { formatPercent, formatPrice } from '@/lib/formatters';
import { buildInvoice } from '@/lib/pricing';
import { timingLabel } from '@/lib/schedule';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { CASHBACK_BLOCK, METHOD_LABELS } from '@/lib/wallet';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';
import { useApp } from '../store';
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
  comingSoon: boolean;
}

/*
 * Naqd BIRINCHI turadi. Demoda Click birinchi; bizda teskari — yagona
 * tanlanadigan qator ikkita oʻlik qatordan keyin tursa, foydalanuvchi ikki
 * marta muvaffaqiyatsiz bosishga majbur boʻlardi.
 *
 * Ikona va tuslar hamyondagi taqsimot qatorlari bilan bir xil: foydalanuvchi
 * bu qatorni keyin tranzaksiyalar tarixida darhol tanib oladi.
 */
const METHODS: readonly MethodOption[] = [
  {
    key: 'cash',
    icon: Money,
    tone: 'bg-neutral-surface text-text-secondary',
    hint: 'Usta ish tugagach joyida toʻlaysiz',
    comingSoon: false,
  },
  {
    key: 'escrow',
    icon: ShieldCheck,
    tone: 'bg-success-surface text-success',
    hint: 'Click va Payme ulangach ishga tushadi',
    comingSoon: true,
  },
  {
    key: 'card',
    icon: CreditCard,
    tone: 'bg-primary-surface text-primary-pressed',
    hint: 'Click va Payme ulangach ishga tushadi',
    comingSoon: true,
  },
];

const CARD_CLASSES = cn(
  'mt-8 rounded-lg border border-transparent bg-surface-elevated p-16 shadow-e1',
  "[[data-theme='dark']_&]:border-border",
);

export function PaymentStep() {
  const navigate = useNavigate();
  const { draft, setDraftPayment } = useApp();
  const { level, cashback } = useWallet();
  const now = useMinuteClock();

  // Naqd oldindan tanlangan: u yagona tanlanadigan variant va boʻsh tanlov
  // faqat hech qachon yoqilmaydigan tugma berardi.
  const [method, setMethod] = useState<PaymentMethod>(draft.paymentMethod ?? 'cash');

  const category = ALL_CATEGORIES.find((item) => item.id === draft.categoryId);

  const invoice = useMemo(
    () =>
      buildInvoice({
        base: category?.basePrice ?? 0,
        isUrgent: draft.isUrgent,
        discountPercent: level.discountPercent,
      }),
    [category?.basePrice, draft.isUrgent, level.discountPercent],
  );

  if (!category || !draft.address) {
    return (
      <ScreenShell
        header={<Header variant="inner" title="Toʻlov" onBack={() => navigate('/app/home')} />}
      >
        <Banner variant="warning" className="mt-16">
          Avval xizmat turi va manzilni tanlang
        </Banner>
        <Button variant="secondary" className="mt-16" onClick={() => navigate('/app/services')}>
          Xizmat tanlash
        </Button>
      </ScreenShell>
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
    navigate('/app/new/confirm');
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Toʻlov" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          {/* `disabled` YOʻQ: naqd oldindan tanlangan, demak tugma hech
              qachon oʻchmaydi. Soxta validatsiya yozilmaydi. */}
          <Button variant="primary" onClick={submit}>
            Davom etish
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={3} />

      <h2 className="mt-20 px-4 text-overline uppercase text-text-secondary">Buyurtma</h2>
      <div className={CARD_CLASSES}>
        <SummaryRow label="Xizmat" value={category.name} />
        <SummaryRow label="Vaqt" value={timingLabel(draft, now)} />
        <SummaryRow label="Manzil" value={draft.address.label} />
      </div>

      {/* Demodagi "SSL · PCI DSS" daʼvosi koʻchirilmaydi — u ulanmagan
          holda yolgʻon boʻlardi. */}
      <div className="mt-16 flex items-start gap-8 px-4">
        <Icon icon={LockSimple} size={16} className="mt-2 shrink-0 text-text-secondary" aria-hidden />
        <p className="text-caption text-text-secondary">
          Ilova karta maʼlumotini soʻramaydi va saqlamaydi. Onlayn toʻlov ulanganda u Click yoki
          Payme sahifasida amalga oshiriladi.
        </p>
      </div>

      <h2 className="mt-24 px-4 text-overline uppercase text-text-secondary">
        Toʻlov usulini tanlang
      </h2>

      <Banner variant="info" icon={Info} className="mt-12">
        Click va Payme hali ulanmagan. Hozircha faqat naqd toʻlov ishlaydi — pul ilova orqali
        koʻchmaydi, usta ishni tugatgach summani joyida oladi.
      </Banner>

      <div
        role="radiogroup"
        aria-label="Toʻlov usuli"
        onKeyDown={onMethodKeyDown}
        className={cn(
          'mt-8 overflow-hidden rounded-lg border border-transparent bg-surface-elevated shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        {METHODS.map((item, index) => {
          const isSelected = item.key === method;

          return (
            <button
              key={item.key}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              disabled={item.comingSoon}
              onClick={() => setMethod(item.key)}
              className={cn(
                'flex min-h-touch w-full items-center gap-12 px-12 py-12 text-left',
                'transition-colors duration-state ease-std',
                index > 0 && 'border-t border-border',
                isSelected && 'bg-surface-sunken',
                !item.comingSoon && 'active:bg-surface-sunken',
              )}
            >
              <span
                className={cn(
                  'flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-sm',
                  item.comingSoon ? 'bg-neutral-surface text-text-disabled' : item.tone,
                )}
                aria-hidden
              >
                <Icon icon={item.icon} size={20} weight="duotone" />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    'block truncate text-body-lg',
                    item.comingSoon ? 'text-text-disabled' : 'text-text-primary',
                  )}
                >
                  {METHOD_LABELS[item.key]}
                </span>
                <span className="mt-2 block text-caption text-text-secondary">{item.hint}</span>
              </span>

              {item.comingSoon ? (
                <span className="shrink-0 text-body-sm text-text-secondary">Tez orada</span>
              ) : (
                // Haqiqiy radio nishoni: tanlanmaganda yadro UMUMAN yoʻq —
                // farq rangda emas, shaklda ham.
                <span
                  className={cn(
                    'flex h-20 w-20 shrink-0 items-center justify-center rounded-full',
                    isSelected
                      ? 'ring-2 ring-inset ring-primary'
                      : 'ring-1 ring-inset ring-border-strong',
                  )}
                  aria-hidden
                >
                  {isSelected && <span className="h-8 w-8 rounded-full bg-primary" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* `span`, `button` EMAS: bajaradigan amali yoʻq. */}
      <span className="ml-4 mt-12 inline-flex h-[32px] items-center rounded-full border border-dashed border-border-strong px-12 text-caption text-text-secondary">
        Demo · onlayn toʻlov hali ishlamaydi
      </span>

      <h2 className="mt-24 px-4 text-overline uppercase text-text-secondary">Hisob</h2>
      <div className={CARD_CLASSES}>
        <SummaryRow label="Xizmat narxi" value={formatPrice(invoice.base)} />
        {invoice.urgentFee > 0 && (
          <SummaryRow label="Shoshilinch yuborish" value={formatPrice(invoice.urgentFee)} />
        )}
        {/* Chegirma nol boʻlsa qator umuman chizilmaydi: "-0 soʻm" hech
            narsa aytmaydi, lekin xato bordir degan shubha tugʻdiradi. */}
        {invoice.discount > 0 && (
          <SummaryRow
            label={`Daraja chegirmasi · ${level.label} ${formatPercent(invoice.discountPercent)}`}
            value={formatPrice(-invoice.discount)}
            tone="success"
          />
        )}
        <SummaryRow label="Xizmat haqi" value="Bepul" tone="success" />

        <div className="border-t border-dashed border-border pt-16" />
        <div className="flex items-baseline justify-between gap-16">
          <span className="text-body-lg text-text-secondary">Jami</span>
          <span className="tabular text-display text-text-primary">
            {formatPrice(invoice.total)}
          </span>
        </div>
      </div>

      <p className="mt-8 px-4 text-caption text-text-secondary">
        Xizmat haqi ustaning komissiyasidan olinadi — sizdan komissiya olinmaydi.
      </p>

      {invoice.discount > 0 && (
        <button
          type="button"
          onClick={() => navigate('/app/wallet/bonus')}
          className="mt-8 px-4 text-caption text-primary-pressed"
        >
          Chegirma qanday ishlaydi?
        </button>
      )}

      {/*
        Keshbek SUMMASI yozilmaydi: blokning yigʻindisi boshqa buyurtmalar
        yopilishiga ham bogʻliq va hozir aytilgan raqam keyin oʻzgarardi.
      */}
      <p className="mt-12 px-4 text-caption text-text-secondary">
        Bu buyurtma yakunlangach keshbek bloki:{' '}
        {Math.min(cashback.filled + 1, CASHBACK_BLOCK)}/{CASHBACK_BLOCK}
      </p>

      <Banner variant="warning" className="mt-16">
        Usta yoʻlga chiqmagunicha bekor qilish bepul va hech qanday pul yechilmaydi. Naqd
        toʻlovda pul ilovada saqlanmaydi, shuning uchun qaytariladigan summa ham boʻlmaydi.
      </Banner>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
