import { Receipt } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { DashedChip } from '@/components/DashedChip';
import { TransactionRow } from '@/components/wallet/TransactionRow';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { formatDayLabel, formatPrice, formatTime, orderDateGroup } from '@/lib/formatters';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { DEMO_HISTORY_LABEL, hasDemoHistory } from '@/lib/walletCard';
import type { WalletTransaction } from '../types';
import { useWallet } from '../useWallet';

/**
 * Tranzaksiyalar tarixi.
 *
 * Tuzilma "Buyurtmalar" ekranidan koʻchirilgan: sana boʻyicha guruhlar, har
 * guruh bitta karta, qatorlar ingichka chiziq bilan (chek). Foydalanuvchi bu
 * ekranni birinchi marta ochganda ham uni allaqachon biladi.
 *
 * Toʻlov usuli boʻyicha filtr YOʻQ: ilova hozircha faqat naqd qabul qiladi,
 * demo tarix ham naqd — bitta usul boʻlsa filtr hech narsa qilmaydi.
 * Filtr Click/Payme ulangach, ikkinchi usul paydo boʻlganda qaytadi.
 */
interface DateGroup {
  title: string;
  items: WalletTransaction[];
}

const GROUP_CARD_CLASSES = cn(
  'mt-8 overflow-hidden rounded-lg border border-transparent bg-surface-elevated shadow-e1',
  "[[data-theme='dark']_&]:border-border",
);

/** Roʻyxat allaqachon yangidan eskiga tartiblangan — guruhlar ketma-ket yigʻiladi. */
function groupByDate(items: readonly WalletTransaction[], now: Date): DateGroup[] {
  return items.reduce<DateGroup[]>((groups, item) => {
    const title = orderDateGroup(item.paidAt, now);
    const last = groups[groups.length - 1];
    if (last && last.title === title) {
      return [...groups.slice(0, -1), { ...last, items: [...last.items, item] }];
    }
    return [...groups, { title, items: [item] }];
  }, []);
}

export function WalletHistory() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { transactions, spentTotal } = useWallet();
  const isDemo = hasDemoHistory(transactions);

  // Guruh sarlavhasi kun aniqligida — `now` har daqiqada oʻzgaradi, lekin
  // guruhlash faqat roʻyxat oʻzgarganda qayta hisoblanadi.
  const groups = useMemo(
    () => groupByDate(transactions, now),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions],
  );

  return (
    <ScreenShell
      header={<Header variant="inner" title="Tranzaksiyalar tarixi" onBack={() => navigate(-1)} />}
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
          {/* Ikkala raqam ham bitta roʻyxatdan hisoblanadi. */}
          <div className="flex items-center justify-between gap-12 pt-12">
            <p className="shrink-0 text-body-sm text-text-secondary">
              {transactions.length} ta tranzaksiya
            </p>
            <p className="tabular shrink-0 text-numeric-sm text-text-primary">
              {formatPrice(spentTotal)}
            </p>
          </div>

          {/* `span`, tugma EMAS — demo yozuvlar haqiqiy deb oʻqilmasin. */}
          {isDemo && (
            <DashedChip size="compact" className="mt-8">{DEMO_HISTORY_LABEL}</DashedChip>
          )}

          {groups.map((group) => (
            <section key={group.title} className="mt-20" aria-label={group.title}>
              <h2 className="px-4 text-overline uppercase text-text-secondary">{group.title}</h2>
              <div className={GROUP_CARD_CLASSES}>
                {group.items.map((item, index) => (
                  <TransactionRow
                    key={item.id}
                    transaction={item}
                    isFirst={index === 0}
                    dateLabel={
                      group.title === 'Bugun' || group.title === 'Kecha'
                        ? formatTime(item.paidAt)
                        : formatDayLabel(item.paidAt, now)
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
