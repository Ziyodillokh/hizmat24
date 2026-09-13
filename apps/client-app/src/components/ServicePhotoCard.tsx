import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/formatters';
import { Icon } from './Icon';

/**
 * Katalog kartasi — ikki ustunli panjara uchun: tepada FOTO (3:2), ostida
 * nom, qisqa tavsif va taxminiy narx.
 *
 * Bosh sahifadagi `ServiceTile` bilan bir tilda: foto boʻlsa foto, boʻlmasa
 * soha ikonasi och koʻk katakchada — layout ikkalasida bir xil. Egasi
 * xizmatlarga foto qoʻshib borar ekan, `SERVICE_IMAGES` ga kalit qoʻshiladi,
 * karta oʻzgarmaydi.
 *
 * "Taxminiy" yozuvi 14.6-band talabi: roʻyxatdagi summa yakuniy emas va
 * buni har bir kartada aytish kerak.
 */
const CURRENCY_LABEL = 'soʻm';

export interface ServicePhotoCardProps {
  name: string;
  description?: string | null;
  price: number;
  icon: IconGlyph;
  imageUrl?: string | null;
  onSelect?: () => void;
  className?: string;
}

export function ServicePhotoCard({
  name,
  description,
  price,
  icon,
  imageUrl,
  onSelect,
  className,
}: ServicePhotoCardProps) {
  const isInteractive = Boolean(onSelect);
  const formatted = formatPrice(price);
  const amount = formatted.slice(0, formatted.lastIndexOf(CURRENCY_LABEL)).trim();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onSelect();
  };

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={cn(
        'flex h-full flex-col rounded-lg border border-transparent bg-surface-elevated p-8 shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        isInteractive &&
          'cursor-pointer transition-transform duration-press ease-emphasized active:scale-[0.98]',
        className,
      )}
    >
      <span
        className="flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-sm bg-primary-surface text-primary-pressed"
        aria-hidden
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <Icon icon={icon} size={32} weight="duotone" />
        )}
      </span>

      <p className="mt-8 line-clamp-2 text-title text-text-primary">{name}</p>
      {description ? (
        <p className="mt-2 line-clamp-1 text-caption text-text-secondary">{description}</p>
      ) : null}

      <div className="mt-auto flex items-baseline justify-between gap-8 pt-8">
        <span className="text-caption text-text-secondary">Taxminiy</span>
        <span className="tabular shrink-0 text-numeric-sm text-text-primary">
          {amount} <span className="text-caption text-text-secondary">{CURRENCY_LABEL}</span>
        </span>
      </div>
    </div>
  );
}
