import { CaretRight } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/formatters';
import { Card } from './Card';
import { Icon } from './Icon';

/**
 * Xizmat turi kartasi — spetsifikatsiya 9.6-bandi.
 *
 * `OrderCard` bilan bir xil tuzilma: tepada mazmun (ikona, nom, tavsif),
 * pastda meta qatori (narx), orasida karta chetigacha choʻzilgan chiziq.
 * Ikkala roʻyxat ham bitta "karta tili" da gapiradi.
 *
 * Narx oʻz qatorida turgani uchun u hech qachon nomni siqmaydi — ilgari
 * ular bitta qatorni boʻlishardi va nom "Rozetka…" boʻlib kesilardi.
 * "Taxminiy narx" yozuvi 14.6-band talabini bajaradi: roʻyxatdagi summa
 * yakuniy emas va buni har bir kartada aytish kerak.
 */
const CURRENCY_LABEL = 'soʻm';

export interface ServiceCardProps {
  /** Xizmat nomi — serverdan keladi. */
  name: string;
  /** Tavsif kelmasligi mumkin: bunda qator umuman chizilmaydi, layout buzilmaydi (9.6-band). */
  description?: string | null;
  /** Soʻmdagi butun summa. */
  price: number;
  /** Xizmat turi ikonasi — outline, bitta oila (6.4-band). */
  icon: IconGlyph;
  onSelect?: () => void;
  className?: string;
}

export function ServiceCard({
  name,
  description,
  price,
  icon,
  onSelect,
  className,
}: ServiceCardProps) {
  const isInteractive = Boolean(onSelect);

  // `formatPrice` "150 000 soʻm" qaytaradi — raqam va valyutani alohida
  // tipografiya bilan chizish uchun qoʻshimchani kesib olamiz.
  const formatted = formatPrice(price);
  const amount = formatted.slice(0, formatted.lastIndexOf(CURRENCY_LABEL)).trim();

  // Karta `div` ustiga qurilgani uchun klaviatura bilan ochilishi qoʻlda beriladi.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onSelect();
  };

  return (
    <Card
      interactive={isInteractive}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={cn('p-12', className)}
    >
      <div className="flex items-start gap-12">
        <span
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md bg-primary-surface"
          aria-hidden
        >
          <Icon icon={icon} size={24} weight="duotone" className="text-primary-pressed" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-title text-text-primary">{name}</p>
          {/* Tavsif ixtiyoriy: yoʻq boʻlsa qator umuman chizilmaydi. */}
          {description ? (
            <p className="mt-2 line-clamp-1 text-body-sm text-text-secondary">{description}</p>
          ) : null}
        </div>

        {isInteractive && (
          <Icon icon={CaretRight} size={16} className="mt-4 shrink-0 text-text-secondary" />
        )}
      </div>

      <span className="-mx-12 my-12 block h-px bg-border" aria-hidden />

      <div className="flex items-baseline justify-between gap-8">
        <span className="text-caption text-text-secondary">Taxminiy narx</span>
        <span className="tabular shrink-0 text-price text-text-primary">
          {amount} <span className="text-currency text-text-secondary">{CURRENCY_LABEL}</span>
        </span>
      </div>
    </Card>
  );
}
