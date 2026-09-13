import { SummaryRow } from '@/components/SummaryRow';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/formatters';
import { invoiceRows } from '@/lib/orderFlow';
import type { OrderInvoice } from '@/lib/pricing';

export interface PriceBreakdownProps {
  invoice: OrderInvoice;
  /** Qoralama bosqichida `true`: summa hali muzlatilmagan. */
  isEstimate?: boolean;
  className?: string;
}

export function PriceBreakdown({ invoice, isEstimate = false, className }: PriceBreakdownProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {invoiceRows(invoice).map((row) => (
        <SummaryRow key={row.key} label={row.label} value={row.value} tone={row.tone} />
      ))}
      <div className="mt-4 flex items-baseline justify-between gap-16 border-t border-dashed border-border pt-16">
        <span className="text-body-lg text-text-secondary">Jami</span>
        <span className="tabular text-display text-text-primary">{formatPrice(invoice.total)}</span>
      </div>
      <p className="mt-4 text-right text-caption text-text-secondary">
        {isEstimate ? 'Taxminiy — katalog narxidan hisoblangan' : 'Katalog narxidan hisoblangan'}
      </p>
    </div>
  );
}
