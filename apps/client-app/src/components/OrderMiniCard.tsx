import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/formatters';
import type { OrderStatus } from '@/lib/orderStateMachine';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import { StatusChip } from './StatusChip';

/**
 * Ixcham buyurtma kartasi — bosh sahifadagi ikki ustunli tavsiya blokining
 * elementi.
 *
 * MUHIM: bu USTA kartasi EMAS (14.1-band). Mijoz ustani tanlamaydi — tizim
 * o'zi tayinlaydi, shuning uchun kartada usta ismi, reytingi va "ustani
 * tanlash" tugmasi bo'lmaydi. Referensdan faqat VIZUAL naqsh olinadi:
 * kvadrat ikona bloki, ustidagi matn va pastda to'liq kenglikdagi tugma.
 */

/**
 * Karta ~165px kenglikda turadi, shuning uchun ichki ustun `min-w-0` bo'lishi
 * shart: aks holda uzun xizmat nomi flex elementini kengaytirib, kartani
 * gridan chiqarib yuboradi.
 */
const INFO_CLASSES = 'flex min-w-0 flex-col items-start gap-8 text-left';

/**
 * 8.4-band: narx raqami `price` (tabular figures) bilan, yonidagi "so'm" esa
 * `currency` `text-secondary` bilan chiziladi. Matnning o'zi formatPrice() dan
 * keladi — bu yerda faqat tipografiya uchun bo'laklarga ajratiladi, qo'lda
 * formatlash yo'q.
 */
const CURRENCY_LABEL = "so'm";

function splitFormattedPrice(amount: number): { value: string; currency: string } {
  const formatted = formatPrice(amount);
  const currencyAt = formatted.lastIndexOf(CURRENCY_LABEL);
  // Yorliq topilmasa butun satr raqam sifatida chiziladi — kesilgan matn chiqmaydi.
  const value = currencyAt === -1 ? formatted.trim() : formatted.slice(0, currencyAt).trim();
  return { value, currency: CURRENCY_LABEL };
}

export interface OrderMiniCardProps {
  /** Xizmat turi ikonasi — lucide glifi (6.4-band). */
  serviceIcon: LucideIcon;
  /** Xizmat nomi serverdan keladi, UI o'z matnini to'qimaydi. */
  serviceName: string;
  status: OrderStatus;
  /** So'mdagi butun summa — formatlash faqat formatPrice() orqali (8.4-band). */
  price: number;
  /** Tugma matni chaqiruvchi ekrandan keladi — holatga mos yorliq (23-ekran). */
  actionLabel: string;
  onSelect?: () => void;
  onAction?: () => void;
  className?: string;
}

export function OrderMiniCard({
  serviceIcon,
  serviceName,
  status,
  price,
  actionLabel,
  onSelect,
  onAction,
  className,
}: OrderMiniCardProps) {
  const { value, currency } = splitFormattedPrice(price);

  const info: ReactNode = (
    <>
      {/*
        Referensdagi kvadrat avatar o'rni. Yuza `surface-sunken` — karta ustida
        ikkala temada ham ajralib turadi (3.1 va 3.2-bandlar).
      */}
      <span
        className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-xs bg-surface-sunken"
        aria-hidden
      >
        <Icon icon={serviceIcon} size={24} className="text-primary" />
      </span>

      {/* Tor kartada nom ikki qatorgacha o'sadi, undan keyin kesiladi. */}
      <span className="line-clamp-2 w-full text-body-lg text-text-primary">{serviceName}</span>

      {/*
        Chip standart balandligi 28px va matni bitta qatorga mo'ljallangan.
        Tor ustunda uzun yorliq ("Ish yakunlandi — baholang") sig'maydi, shuning
        uchun balandlik erkin qoldiriladi: matn kesilmaydi, ikkinchi qatorga
        o'tadi.
      */}
      <StatusChip status={status} className="h-auto min-h-[28px] max-w-full py-4" />
    </>
  );

  return (
    <Card
      // Grid qatorida ikkala karta bir xil balandlikda cho'ziladi; `h-full`
      // bo'lmasa tugmalar turli sathda qolib ketadi.
      className={cn('flex h-full flex-col gap-12', className)}
    >
      {/*
        Butun karta emas, faqat ma'lumot qismi bosiladi: shunda tugma tugma
        ichida joylashmaydi va ekran o'quvchi ikkala amalni alohida e'lon qiladi.
      */}
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className={cn(INFO_CLASSES, 'transition-transform active:scale-[0.99]')}
        >
          {info}
        </button>
      ) : (
        <div className={INFO_CLASSES}>{info}</div>
      )}

      {/* `mt-auto` narx va tugmani kartaning pastki chetiga bosadi. */}
      <p className="mt-auto truncate">
        <span className="tabular text-price text-text-primary">{value}</span>{' '}
        <span className="text-currency text-text-secondary">{currency}</span>
      </p>

      <Button size="small" variant="secondary" onClick={onAction}>
        {actionLabel}
      </Button>
    </Card>
  );
}
