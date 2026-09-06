import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Skeleton } from '@/components/Skeleton';
import { StarRating } from '@/components/StarRating';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatDateTime, formatPrice, orEmpty } from '@/lib/formatters';
import { ORDERS_BY_ID, NOW } from '@/mocks/orders';

/**
 * 20 · Chek.
 *
 * Manzil, ish davomiyligi, to'lov usuli, soliq bo'linmasi, "PDF yuklab olish"
 * va "Ulashish" CHIZILMAYDI — bu ma'lumotlar mavjud emas (14.4-band, 33-punkt).
 */
export type ReceiptVariant = 'full' | 'partial' | 'loading';

export interface ReceiptScreenProps {
  variant?: ReceiptVariant;
}

/** Chek qatori — yorliq chapda, qiymat o'ngda; qiymat yo'q bo'lsa "—". */
function ReceiptRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-16 py-12">
      <span className="shrink-0 text-body-sm text-text-secondary">{label}</span>
      <span className="min-w-0 text-right text-body-lg text-text-primary">{children}</span>
    </div>
  );
}

export function ReceiptScreen({ variant = 'full' }: ReceiptScreenProps) {
  const order = ORDERS_BY_ID['o-closed'];
  const isPartial = variant === 'partial';

  return (
    <ScreenShell
      header={<Header variant="inner" title="Chek" />}
      footer={
        <StickyFooter>
          <Button variant="secondary">Qayta buyurtma berish</Button>
        </StickyFooter>
      }
    >
      {variant === 'loading' ? (
        <div className="mt-4 rounded-lg bg-surface-elevated p-16">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} height={20} className="mt-12 first:mt-0" />
          ))}
          <Skeleton height={38} className="mt-24" />
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-border bg-surface-elevated p-16">
          <ReceiptRow label="Buyurtma raqami">
            <span className="tabular tracking-[0.4px]">{order.shortId}</span>
          </ReceiptRow>

          <div className="border-t border-dashed border-border" />
          <ReceiptRow label="Xizmat">{order.categoryName}</ReceiptRow>
          <ReceiptRow label="Usta">
            {isPartial ? orEmpty(null) : orEmpty(order.master?.fullName)}
          </ReceiptRow>
          <ReceiptRow label="Baho">
            {isPartial || !order.rating ? (
              orEmpty(null)
            ) : (
              <StarRating value={order.rating.stars} size="sm" showValue />
            )}
          </ReceiptRow>
          <ReceiptRow label="Yakunlangan sana">
            {isPartial || !order.completedAt
              ? orEmpty(null)
              : formatDateTime(order.completedAt, NOW)}
          </ReceiptRow>

          <div className="border-t border-dashed border-border pt-16" />
          <div className="flex items-baseline justify-between gap-16">
            <span className="text-body-lg text-text-secondary">Jami</span>
            <span className="text-display text-text-primary tabular">
              {formatPrice(order.price)}
            </span>
          </div>
        </div>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
