import { ServicePhoto } from '@/components/order/ServicePhoto';
import { cn } from '@/lib/cn';
import { orEmpty, splitFormattedPrice } from '@/lib/formatters';
import type { WalletTransaction } from '@/app/types';

/**
 * Toʻlov qatori — "Karta" sahifasidagi soʻnggi toʻlovlar va tarix sahifasi
 * BITTA qatorni ishlatadi, foydalanuvchi ikkinchisini ochganda uni taniydi.
 *
 * Ikki MUVOZANATLI qator, 48×48 foto bilan bir xil balandlikda:
 *   1. xizmat nomi ····· sana
 *   2. usta ············ summa
 * Har qatorda chap matn kesiladi, oʻng qism kesilmaydi. Toʻlov usuli
 * yozilmaydi: ilova hozircha faqat naqd qabul qiladi — "· Naqd" har qatorda
 * takrorlanib joy yeydi va 360px da ustaning ismini kesib qoʻyardi.
 *
 * BOSILMAYDI — tranzaksiya tafsiloti ekrani yoʻq.
 */
export interface TransactionRowProps {
  transaction: WalletTransaction;
  /** "Bugun" · "Kecha" · "10-sentabr" yoki guruh ichida faqat soat "11:20". */
  dateLabel: string;
  isFirst?: boolean;
  className?: string;
}

export function TransactionRow({ transaction, dateLabel, isFirst = false, className }: TransactionRowProps) {
  const price = splitFormattedPrice(transaction.amount);

  return (
    <div className={cn('flex items-center gap-12 px-12 py-12', !isFirst && 'border-t border-border', className)}>
      <ServicePhoto
        serviceId={transaction.categoryId}
        iconKey={transaction.categoryIconKey}
        iconSize={24}
        className="h-[48px] w-[48px]"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-8">
          <p className="min-w-0 truncate text-title text-text-primary">{transaction.categoryName}</p>
          <p className="shrink-0 text-caption text-text-secondary">{dateLabel}</p>
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-8">
          <p className="min-w-0 truncate text-caption text-text-secondary">{orEmpty(transaction.masterName)}</p>
          <p className="tabular shrink-0 text-numeric-sm text-text-primary">
            {price.value} <span className="text-caption text-text-secondary">{price.currency}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
