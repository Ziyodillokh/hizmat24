import { ArrowRight, Receipt, SealPercent, ShieldCheck } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { MenuGroup, type MenuSection } from '@/components/MenuGroup';
import { BonusCard } from '@/components/wallet/BonusCard';
import { MemberCard } from '@/components/wallet/MemberCard';
import { DashedChip } from '@/components/DashedChip';
import { PaymentMethodRow } from '@/components/wallet/PaymentMethodRow';
import { StatTile } from '@/components/wallet/StatTile';
import { TransactionRow } from '@/components/wallet/TransactionRow';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { formatDayLabel, formatMonth, formatPercent, splitFormattedPrice } from '@/lib/formatters';
import { useMinuteClock } from '@/lib/useMinuteClock';
import {
  cardHolder,
  DEMO_HISTORY_LABEL,
  hasDemoHistory,
  monthCaption,
  PAYMENT_OPTIONS,
  recentTransactions,
  spentOverline,
  totalCaption,
} from '@/lib/walletCard';
import { useApp } from '../store';
import { useWallet } from '../useWallet';
import { AppTabBar } from '../AppTabBar';

/**
 * "Karta" — Hizmat24 aʼzolik kartasi sahifasi.
 *
 * Bu HAMYON EMAS: balans, bank kartasi, Click/Payme hali yoʻq va ular
 * chiziqli "Tez orada" chipi bilan OCHIQ koʻrsatiladi, tugma sifatida emas.
 * Sahifadagi har bir raqam haqiqiy manbadan: shu oyda toʻlangan pul, real
 * daraja chegirmasi (checkoutʼda `createOrder(level.discountPercent)`),
 * soʻnggi toʻlovlar. Demo tarix bor boʻlsa u bitta chip bilan belgilanadi.
 *
 * Olti blok, ShareBar jadvallari YOʻQ: karta → ikki plitka → soʻnggi
 * toʻlovlar (chek) → toʻlov usullari → bonuslar chiptasi → himoya.
 */

/** Mijozdan olinadigan komissiya. Xizmat haqi ustaning ulushidan olinadi. */
const CLIENT_COMMISSION_PERCENT = 0;

const LIST_CARD_CLASSES = cn(
  'mt-8 overflow-hidden rounded-lg border border-transparent bg-surface-elevated shadow-e1',
  "[[data-theme='dark']_&]:border-border",
);

const OVERLINE_CLASSES = 'mt-20 px-4 text-overline uppercase text-text-secondary';

export function WalletTab() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const wallet = useWallet();
  const { fullName, phoneNumber } = useApp();

  const monthLabel = formatMonth(now, now);
  const holder = cardHolder(fullName, phoneNumber);
  const recent = recentTransactions(wallet.transactions);
  const isDemo = hasDemoHistory(wallet.transactions);
  const total = splitFormattedPrice(wallet.spentTotal);
  const monthTotal = splitFormattedPrice(wallet.spentThisMonth);
  const lastPaidAt = wallet.transactions[0]?.paidAt ?? null;

  const goToBonus = () => navigate('/app/wallet/bonus');
  const goToHistory = () => navigate('/app/wallet/history');

  /*
   * "Sizdan komissiya" BOSILMAYDI: `onSelect` siz qator `MenuGroup` da `div`
   * boʻlib chiziladi, chevron ham qoʻyilmaydi. "Hisob balansi · Tez orada"
   * qatori ATAYLAB yoʻq — balans vaʼda qilingan funksiya emas, unga "Tez
   * orada" yozish uni oʻylab topish boʻlardi.
   */
  const protection: MenuSection = {
    title: 'Toʻlov va himoya',
    items: [
      { icon: ShieldCheck, label: 'Kafolat va himoya', onSelect: () => navigate('/app/guarantee') },
      { icon: SealPercent, label: 'Sizdan komissiya', hint: formatPercent(CLIENT_COMMISSION_PERCENT) },
    ],
  };

  return (
    <ScreenShell header={<Header variant="inner" title="Karta" />} footer={<AppTabBar active="wallet" />}>
      {/*
        Demo chipi KARTADAN TEPADA: kartadagi oy summasi, daraja va plitkalar
        ham namunaviy tarixdan hisoblanadi — belgi faqat roʻyxat yonida tursa,
        eng katta raqamlar "haqiqiy" boʻlib oʻqilardi. Chip `span`, tugma EMAS.
      */}
      {isDemo && (
        <div className="mt-8 flex justify-end px-4">
          <DashedChip size="compact">{DEMO_HISTORY_LABEL}</DashedChip>
        </div>
      )}

      {/* 1 — Karta. Nol ham halol chiziladi: "0 soʻm · buyurtma yoʻq". */}
      <MemberCard
        holder={holder}
        level={wallet.level}
        spentThisMonth={wallet.spentThisMonth}
        overline={spentOverline(monthLabel)}
        caption={monthCaption(wallet.ordersThisMonth, lastPaidAt, now)}
        className={isDemo ? 'mt-4' : 'mt-8'}
      />

      {/* 2 — Ikki plitka: chegirma (real) va jami toʻlangan. Ikkalasi ham bosiladi. */}
      <div className="mt-12 grid grid-cols-2 gap-8">
        <StatTile
          label="Chegirma"
          value={formatPercent(wallet.level.discountPercent)}
          hint={`${wallet.level.label} daraja`}
          onSelect={goToBonus}
        />
        <StatTile
          label="Jami toʻlangan"
          value={total.value}
          unit={total.currency}
          hint={totalCaption(wallet.ordersTotal)}
          onSelect={goToHistory}
        />
      </div>

      {/* 3 — Soʻnggi toʻlovlar: chek sarlavhasi + uch qator + "barchasi" qatori. */}
      <section>
        <h2 className="mt-20 text-h3 text-text-primary">Soʻnggi toʻlovlar</h2>

        {wallet.hasHistory ? (
          <div className={LIST_CARD_CLASSES}>
            {/* Chek sarlavhasi: oy jami — kartadagi raqam bilan AYNAN bir xil manbadan. */}
            <div className="flex items-baseline justify-between gap-12 px-12 py-12">
              <p className="min-w-0 truncate text-body-sm text-text-secondary">
                {monthLabel} · {monthCaption(wallet.ordersThisMonth, lastPaidAt, now)}
              </p>
              <p className="tabular shrink-0 text-price text-text-primary">
                {monthTotal.value} <span className="text-currency text-text-secondary">{monthTotal.currency}</span>
              </p>
            </div>

            {recent.map((item) => (
              <TransactionRow
                key={item.id}
                transaction={item}
                dateLabel={formatDayLabel(item.paidAt, now)}
              />
            ))}

            <button
              type="button"
              onClick={goToHistory}
              className="flex min-h-touch w-full items-center justify-between gap-12 border-t border-border px-12 py-8 text-left transition-colors duration-press ease-std active:bg-surface-sunken"
            >
              <span className="text-body-sm font-semibold text-primary">Barcha tranzaksiyalar</span>
              <span className="tabular flex shrink-0 items-center gap-4 text-caption text-text-secondary">
                {wallet.ordersTotal} ta
                <Icon icon={ArrowRight} size={14} weight="bold" className="text-primary" aria-hidden />
              </span>
            </button>
          </div>
        ) : (
          <EmptyState
            icon={Receipt}
            title="Hali toʻlov yoʻq"
            description="Birinchi buyurtmangiz yakunlangach, toʻlangan pul shu yerda koʻrinadi"
            action={{ label: 'Ustani chaqirish', onClick: () => navigate('/app/services') }}
            className="mt-8"
            inline
            compact
          />
        )}
      </section>

      {/* 4 — Toʻlov usullari. Karta raqami yoʻq, chunki karta yoʻq. */}
      <section>
        <h2 className={OVERLINE_CLASSES}>Toʻlov usullari</h2>
        <div className={LIST_CARD_CLASSES}>
          {PAYMENT_OPTIONS.map((option, index) => (
            <PaymentMethodRow key={option.key} option={option} isFirst={index === 0} />
          ))}
        </div>
        <p className="mt-8 px-4 text-caption text-text-secondary">
          Pul ilova orqali oʻtmaydi — usul har buyurtmada alohida tanlanadi. Ilova karta
          maʼlumotini soʻramaydi va saqlamaydi.
        </p>
      </section>

      {/* 5 — Bonuslar chiptasi: daraja progressi + keshbek shtamplari, butun karta bosiladi. */}
      <section>
        <h2 className={OVERLINE_CLASSES}>Bonuslar</h2>
        <BonusCard wallet={wallet} onSelect={goToBonus} className="mt-8" />
      </section>

      {/* 6 — Kafolat va komissiya. */}
      <MenuGroup section={protection} />

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
