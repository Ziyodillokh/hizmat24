import { CreditCard, Medal, Money, Receipt, SealPercent, ShieldCheck, Wallet } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { MenuGroup, type MenuSection } from '@/components/MenuGroup';
import { ShareBar } from '@/components/ShareBar';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { formatDayLabel, formatMonth, formatMonthShort, formatPercent, formatPrice } from '@/lib/formatters';
import { serviceIcon } from '@/lib/serviceIcons';
import { useMinuteClock } from '@/lib/useMinuteClock';
import type { Breakdown, MonthBar } from '@/lib/wallet';
import { useWallet } from '../useWallet';
import { AppTabBar } from '../AppTabBar';

/**
 * "Karta va moliya" — mijozning sarflagan puli.
 *
 * Bu HAMYON EMAS: hisob balansi va uni toʻldirish toʻlov tizimi ulangach
 * paydo boʻladi. Hozircha sahifa faqat allaqachon toʻlangan pulni koʻrsatadi
 * va buni ochiq aytadi — mavjud boʻlmagan balansni "0 soʻm" deb chizish
 * ishlamaydigan tugmaning maʼlumot tomonidagi koʻrinishi boʻlardi.
 */

/** Mijozdan olinadigan komissiya. Xizmat haqi ustaning ulushidan olinadi. */
const CLIENT_COMMISSION_PERCENT = 0;

/** Toʻlov usuli qatoridagi ikona va plitka tusi. */
const METHOD_VISUALS: Record<string, { icon: typeof ShieldCheck; tone: string }> = {
  escrow: { icon: ShieldCheck, tone: 'bg-success-surface text-success' },
  card: { icon: CreditCard, tone: 'bg-primary-surface text-primary-pressed' },
  cash: { icon: Money, tone: 'bg-neutral-surface text-text-secondary' },
};

const CARD_CLASSES = cn(
  'mt-8 overflow-hidden rounded-lg border border-transparent bg-surface-elevated shadow-e1',
  "[[data-theme='dark']_&]:border-border",
);

/** Taqsimot qatori: nom, summa va ulush chizigʻi. Bosilmaydi — orqasida ekran yoʻq. */
function DistributionRow({
  row,
  index,
  icon,
  tone,
}: {
  row: Breakdown;
  index: number;
  icon: typeof ShieldCheck;
  tone: string;
}) {
  return (
    <div className={cn('flex items-center gap-12 px-12 py-12', index > 0 && 'border-t border-border')}>
      <span
        className={cn(
          'flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-sm',
          tone,
        )}
        aria-hidden
      >
        <Icon icon={icon} size={20} weight="duotone" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-12">
          <p className="min-w-0 truncate text-body-lg text-text-primary">{row.label}</p>
          <p className="tabular shrink-0 text-numeric-sm text-text-primary">
            {formatPrice(row.amount)}
          </p>
        </div>
        <div className="mt-8 flex items-center gap-8">
          <ShareBar value={row.percent} className="min-w-0 flex-1" />
          <span className="tabular shrink-0 text-caption text-text-secondary">
            {formatPercent(row.percent)}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Oylik dinamika qatori — ustunli diagramma emas: toʻliq summa sigʻishi kerak. */
function TrendRow({ row, index, now }: { row: MonthBar; index: number; now: Date }) {
  return (
    <div
      // `role` siz `aria-label` eʼlon qilinmaydi: nomsiz `generic` elementga
      // nom berib boʻlmaydi.
      role="group"
      aria-label={`${formatMonth(row.monthStart, now)}: ${formatPrice(row.amount)}`}
      className={cn('flex items-center gap-12 px-12 py-8', index > 0 && 'border-t border-border')}
    >
      <p className="shrink-0 basis-[72px] truncate text-body-sm text-text-secondary">
        {formatMonthShort(row.monthStart)}
      </p>
      <ShareBar value={row.percent} className="min-w-0 flex-1" />
      <p className="tabular shrink-0 text-numeric-sm text-text-primary">{formatPrice(row.amount)}</p>
    </div>
  );
}

export function WalletTab() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const wallet = useWallet();

  const monthLabel = formatMonth(now, now);
  const isMonthEmpty = wallet.monthTransactions.length === 0;

  const navigation: MenuSection = {
    title: 'Bonus va tarix',
    items: [
      {
        icon: Medal,
        label: 'Bonuslar',
        hint: wallet.level.label,
        onSelect: () => navigate('/app/wallet/bonus'),
      },
      {
        icon: Receipt,
        label: 'Tranzaksiyalar tarixi',
        hint: wallet.hasHistory ? `${wallet.transactions.length} ta` : undefined,
        onSelect: () => navigate('/app/wallet/history'),
      },
    ],
  };

  /*
   * Uchala qator ham BOSILMAYDI: ular holatni tushuntiradi, biror ekranga
   * olib bormaydi. `onSelect` berilmagan qator `MenuGroup` da `div` boʻlib
   * chiziladi va chevron ham qoʻyilmaydi.
   */
  const terms: MenuSection = {
    title: 'Toʻlov va himoya',
    items: [
      { icon: SealPercent, label: 'Sizdan komissiya', hint: formatPercent(CLIENT_COMMISSION_PERCENT) },
      { icon: ShieldCheck, label: 'Kafolatli toʻlov', hint: 'Yoqilgan' },
      { icon: Wallet, label: 'Hisob balansi', hint: 'Tez orada' },
    ],
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Karta va moliya" />}
      footer={<AppTabBar active="wallet" />}
    >
      {/* Hero — doim koʻrinadi va nolni ham halol koʻrsatadi. */}
      <div className="banner-field relative mt-4 overflow-hidden rounded-lg p-16">
        <p className="text-overline uppercase text-on-primary-deep/[0.92]">Shu oyda sarflangan</p>
        <p className="tabular mt-4 text-display text-on-primary-deep">
          {formatPrice(wallet.spentThisMonth)}
        </p>
        <p className="mt-4 text-caption text-on-primary-deep/[0.92]">
          {monthLabel} ·{' '}
          {wallet.ordersThisMonth > 0 ? `${wallet.ordersThisMonth} ta buyurtma` : 'buyurtma yoʻq'}
        </p>

        {/*
          Uchala qiymat ham QISQA son: 360px ekranda plitkaning ichki eni
          ~74px va pul summasi u yerga sigʻmaydi.
        */}
        <div className="mt-16 grid grid-cols-3 gap-8">
          <div className="rounded-sm bg-on-primary/[0.16] px-8 py-12 text-center">
            <p className="tabular text-h3 text-on-primary-deep">{wallet.ordersThisMonth}</p>
            <p className="mt-2 truncate text-caption text-on-primary-deep/[0.92]">Buyurtma</p>
          </div>
          <div className="rounded-sm bg-on-primary/[0.16] px-8 py-12 text-center">
            <p className="tabular text-h3 text-on-primary-deep">{wallet.ordersTotal}</p>
            <p className="mt-2 truncate text-caption text-on-primary-deep/[0.92]">Jami</p>
          </div>
          <div className="rounded-sm bg-on-primary/[0.16] px-8 py-12 text-center">
            <p className="tabular text-h3 text-on-primary-deep">
              {formatPercent(CLIENT_COMMISSION_PERCENT)}
            </p>
            <p className="mt-2 truncate text-caption text-on-primary-deep/[0.92]">Komissiya</p>
          </div>
        </div>
      </div>

      {/* Ikkala ichki sahifa scrollsiz koʻrinadigan joyda turishi shart. */}
      <MenuGroup section={navigation} />

      {!wallet.hasHistory && (
        <EmptyState
          icon={Receipt}
          title="Hali xarajat yoʻq"
          description="Birinchi buyurtmangiz yakunlangach, sarflangan pul shu yerda koʻrinadi"
          action={{ label: 'Ustani chaqirish', onClick: () => navigate('/app/services') }}
          className="mt-24"
          inline
        />
      )}

      {wallet.hasHistory && isMonthEmpty && (
        <p className="mt-12 px-4 text-body-sm text-text-secondary">
          Bu oyda hali xarajat yoʻq. Oxirgi toʻlov:{' '}
          {formatDayLabel(wallet.transactions[0].paidAt, now)}.
        </p>
      )}

      {wallet.groups.length > 0 && (
        <section>
          {/* Oy nomi sarlavhada: blok FAQAT joriy oyni koʻrsatadi. */}
          <div className="mt-20 flex items-baseline justify-between gap-12 px-4">
            <h2 className="min-w-0 truncate text-overline uppercase text-text-secondary">
              Soha boʻyicha
            </h2>
            <span className="shrink-0 text-caption text-text-secondary">{monthLabel}</span>
          </div>

          <div className={CARD_CLASSES}>
            {wallet.groups.map((row, index) => (
              <DistributionRow
                key={row.key}
                row={row}
                index={index}
                icon={serviceIcon(row.iconKey)}
                tone="bg-neutral-surface text-text-secondary"
              />
            ))}
          </div>
        </section>
      )}

      {wallet.methods.length > 0 && (
        <section>
          <div className="mt-20 flex items-baseline justify-between gap-12 px-4">
            <h2 className="min-w-0 truncate text-overline uppercase text-text-secondary">
              Toʻlov usuli
            </h2>
            <span className="shrink-0 text-caption text-text-secondary">{monthLabel}</span>
          </div>

          <div className={CARD_CLASSES}>
            {wallet.methods.map((row, index) => {
              const visual = METHOD_VISUALS[row.key] ?? METHOD_VISUALS.cash;
              return (
                <DistributionRow
                  key={row.key}
                  row={row}
                  index={index}
                  icon={visual.icon}
                  tone={visual.tone}
                />
              );
            })}
          </div>

          <p className="mt-8 px-4 text-body-sm text-text-secondary">
            Kafolatli toʻlovda pul ish yakunlangunga qadar platformada saqlanadi.
          </p>
        </section>
      )}

      {wallet.hasTrend && (
        <section>
          <h2 className="mt-20 px-4 text-overline uppercase text-text-secondary">Oxirgi 6 oy</h2>
          <div className={CARD_CLASSES}>
            {wallet.months.map((row, index) => (
              <TrendRow key={row.monthStart.toISOString()} row={row} index={index} now={now} />
            ))}
          </div>
        </section>
      )}

      <MenuGroup section={terms} />

      <p className="mt-8 px-4 text-body-sm text-text-secondary">
        Xizmat haqi ustaning komissiyasidan olinadi — siz faqat ish narxini toʻlaysiz. Hisob
        balansi va uni toʻldirish Click hamda Payme ulangach ishga tushadi; hozircha toʻlov
        usuli har bir buyurtmada alohida tanlanadi va karta ilovada saqlanmaydi.
      </p>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
