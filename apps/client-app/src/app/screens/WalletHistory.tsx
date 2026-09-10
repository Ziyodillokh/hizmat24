import { FileMagnifyingGlass, Receipt } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { SegmentControl } from '@/components/SegmentControl';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import {
  formatDayLabel,
  formatPrice,
  formatTime,
  orderDateGroup,
  orEmpty,
  splitFormattedPrice,
} from '@/lib/formatters';
import { serviceIcon } from '@/lib/serviceIcons';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { METHOD_LABELS, METHOD_SHORT_LABELS } from '@/lib/wallet';
import type { PaymentMethod, WalletTransaction } from '../types';
import { useWallet } from '../useWallet';

/**
 * Tranzaksiyalar tarixi.
 *
 * Tuzilma "Buyurtmalar" ekranidan aynan koʻchirilgan: filtr, sana boʻyicha
 * guruhlash, bir xil karta tili. Foydalanuvchi bu ekranni birinchi marta
 * ochganda ham uni allaqachon biladi.
 */
type TxFilter = 'all' | PaymentMethod;

const FILTER_ORDER: readonly TxFilter[] = ['all', 'escrow', 'cash', 'card'];

const FILTER_LABELS: Record<TxFilter, string> = {
  all: 'Barchasi',
  escrow: METHOD_SHORT_LABELS.escrow,
  cash: METHOD_SHORT_LABELS.cash,
  card: METHOD_SHORT_LABELS.card,
};

/** Plitka TUSI toʻlov usulini, GLIF esa xizmat turini bildiradi. */
const METHOD_TONES: Record<PaymentMethod, string> = {
  escrow: 'bg-success-surface text-success',
  card: 'bg-primary-surface text-primary-pressed',
  cash: 'bg-neutral-surface text-text-secondary',
};

function TransactionRow({
  transaction,
  timeLabel,
}: {
  transaction: WalletTransaction;
  timeLabel: string;
}) {
  const { value, currency } = splitFormattedPrice(transaction.amount);

  return (
    <div
      className={cn(
        'flex items-start gap-12 rounded-lg border border-transparent bg-surface-elevated p-12 shadow-e1',
        "[[data-theme='dark']_&]:border-border",
      )}
    >
      <span
        className={cn(
          'flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-sm',
          METHOD_TONES[transaction.method],
        )}
        aria-hidden
      >
        <Icon icon={serviceIcon(transaction.categoryIconKey)} size={20} weight="duotone" />
      </span>

      {/*
        Xizmat nomi OʻZ QATORIDA, toʻliq kenglikda — `OrderCard` dagi kabi.
        Nom va narx bitta qatorga qoʻyilganda "Kir yuvish mashinasini ulash"
        kabi uzun nomlar 393px ekranda ham kesilib qolardi.
      */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-body-lg text-text-primary">{transaction.categoryName}</p>

        <div className="mt-4 flex items-baseline justify-between gap-12">
          <p className="min-w-0 truncate text-body-sm text-text-secondary">
            {orEmpty(transaction.masterName)} · {METHOD_LABELS[transaction.method]}
          </p>
          <p className="shrink-0">
            <span className="tabular text-price text-text-primary">{value}</span>{' '}
            <span className="text-currency text-text-secondary">{currency}</span>
          </p>
        </div>

        <p className="tabular mt-2 text-caption text-text-secondary">
          {transaction.shortId} · {timeLabel}
        </p>
      </div>
    </div>
  );
}

export function WalletHistory() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { transactions } = useWallet();
  const [filter, setFilter] = useState<TxFilter>('all');

  const visible = useMemo(
    () => (filter === 'all' ? transactions : transactions.filter((item) => item.method === filter)),
    [transactions, filter],
  );

  const visibleTotal = visible.reduce((sum, item) => sum + item.amount, 0);

  /*
   * Sana boʻyicha guruhlash — "Buyurtmalar" ekranidagi bilan bir xil
   * funksiya. Roʻyxat allaqachon yangidan eskiga tartiblangan.
   */
  const groups = useMemo(() => {
    const result: { title: string; items: WalletTransaction[] }[] = [];

    for (const item of visible) {
      const title = orderDateGroup(item.paidAt, now);
      const last = result[result.length - 1];
      if (last && last.title === title) last.items.push(item);
      else result.push({ title, items: [item] });
    }

    return result;
    // Guruh sarlavhasi kun aniqligida hisoblanadi — `now` ni bogʻliqlikka
    // qoʻshish har daqiqada keraksiz qayta hisoblash beradi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Bitta usul boʻlsa filtr hech narsa qilmaydi — u holda chizilmaydi ham.
  const methodCount = new Set(transactions.map((item) => item.method)).size;
  const showFilter = transactions.length > 0 && methodCount > 1;

  return (
    <ScreenShell
      header={
        <Header
          variant="inner"
          title="Tranzaksiyalar tarixi"
          onBack={() => navigate(-1)}
        />
      }
    >
      {transactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Tranzaksiyalar yoʻq"
          description="Yakunlangan buyurtmalar toʻlovi shu yerda koʻrinadi"
          action={{ label: 'Ustani chaqirish', onClick: () => navigate('/app/services') }}
          inline
        />
      ) : (
        <>
          {showFilter && (
            <SegmentControl
              value={filter}
              onChange={setFilter}
              options={FILTER_ORDER.map((value) => ({ value, label: FILTER_LABELS[value] }))}
            />
          )}

          {/* Ikkala raqam ham bitta filtrlangan roʻyxatdan hisoblanadi. */}
          <div className="flex items-center justify-between gap-12 pt-8">
            <p className="shrink-0 text-body-sm text-text-secondary">
              {visible.length} ta tranzaksiya
            </p>
            <p className="tabular shrink-0 text-numeric-sm text-text-primary">
              {formatPrice(visibleTotal)}
            </p>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={FileMagnifyingGlass}
              title="Bu boʻlimda tranzaksiya yoʻq"
              description="Boshqa filtrni tanlab koʻring"
              className="mt-24"
              inline
            />
          ) : (
            groups.map((group) => (
              <section key={group.title} className="mt-20 first:mt-16">
                <h2 className="px-4 text-overline uppercase text-text-secondary">{group.title}</h2>
                <ul className="mt-8 flex flex-col gap-8">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      <TransactionRow
                        transaction={item}
                        timeLabel={
                          group.title === 'Bugun' || group.title === 'Kecha'
                            ? formatTime(item.paidAt)
                            : formatDayLabel(item.paidAt, now)
                        }
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
