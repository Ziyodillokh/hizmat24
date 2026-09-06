import type { KeyboardEvent } from 'react';
import { ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/formatters';
import { Card } from './Card';
import { Icon } from './Icon';

/**
 * Xizmat turi kartasi — spetsifikatsiya 9.6-bandi.
 *
 * Nomi ALOHIDA qatorda turadi. Ilgari nom va narx bitta qatorni boʻlishardi,
 * narx bloki esa qisqarmasdi ("taxminan 1 500 000 soʻm" ≈ 200px) — natijada
 * 390px ekranda nomga ~90px qolib, u "Rozetka…" boʻlib kesilardi va
 * foydalanuvchi xizmatni umuman oʻqiy olmasdi.
 *
 * Endi: 1-qator — nom (kerak boʻlsa 2 satr), 2-qator — tavsif va narx.
 * Shu tuzilishda uzun nom ham, katta summa ham toʻliq koʻrinadi.
 */
const CURRENCY_LABEL = "soʻm";

export interface ServiceCardProps {
  /** Xizmat nomi — serverdan keladi. */
  name: string;
  /** Tavsif kelmasligi mumkin: bunda qator umuman chizilmaydi, layout buzilmaydi (9.6-band). */
  description?: string | null;
  /** Soʻmdagi butun summa. Roʻyxatda narx taxminiy — buni roʻyxat sarlavhasi aytadi. */
  price: number;
  /** Xizmat turi ikonasi — outline, bitta oila (6.4-band). */
  icon: LucideIcon;
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
      className={cn('flex items-center gap-12 p-12', className)}
    >
      {/* Ichki blok yuzasi `surface-sunken` (3.1-band) — karta ustida ikkala temada ham ajralib turadi. */}
      <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md bg-surface-sunken">
        <Icon icon={icon} size={24} className="text-primary" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="line-clamp-2 text-title text-text-primary">{name}</span>

        <span className="flex min-w-0 items-baseline gap-8">
          <span className="tabular shrink-0 text-numeric-sm text-primary">{amount}</span>
          <span className="shrink-0 text-caption text-text-secondary">{CURRENCY_LABEL}</span>
          {/* Tavsif ixtiyoriy: yoʻq boʻlsa qator narx bilan cheklanadi. */}
          {description ? (
            <span className="truncate text-body-sm text-text-secondary">· {description}</span>
          ) : null}
        </span>
      </span>

      {isInteractive && (
        <Icon icon={ChevronRight} size={16} className="shrink-0 text-text-secondary" />
      )}
    </Card>
  );
}
