import type { KeyboardEvent } from 'react';
import { MapPin, Star, Truck } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { formatRating } from '@/lib/formatters';
import { shopCover } from '@/lib/marketImages';
import type { ShopCategory } from '@/mocks/shops';
import { Card } from './Card';
import { Icon } from './Icon';

/**
 * Market doʻkoni kartasi.
 *
 * Tepada muqova: doʻkon fotosi hali yoʻq, shuning uchun uning oʻrnida
 * kategoriya belgisi katta oʻlchamda chiziladi. Muqova YAGONA yuzada —
 * ilgari har bir kategoriya oʻz tusida edi va bitta kartada uchta har xil
 * rangdagi element (plitka, ochiq/yopiq, yetkazish) toʻqnashardi; Dark
 * temada esa beshta tusdan uchtasi kartadan umuman ajralmasdi.
 *
 * Manzil kartada koʻrsatilmaydi — faqat tuman. 360px ekranda toʻliq manzil
 * sakkiz kartadan oltitasida kesilardi va aynan maʼno tashiydigan qismi
 * yoʻqolardi. Toʻliq manzil doʻkon sahifasida turadi.
 */
export interface ShopCardProps {
  name: string;
  category: ShopCategory;
  district: string;
  rating: number;
  reviews: number;
  isOpen: boolean;
  hasDelivery: boolean;
  onOpen?: () => void;
  className?: string;
}

export function ShopCard({
  name,
  category,
  district,
  rating,
  reviews,
  isOpen,
  hasDelivery,
  onOpen,
  className,
}: ShopCardProps) {
  const isInteractive = Boolean(onOpen);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onOpen || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onOpen();
  };

  return (
    <Card
      interactive={isInteractive}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={cn('overflow-hidden p-0', className)}
    >
      <div className="relative h-[96px] bg-surface-sunken">
        <img
          src={shopCover(category)}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
        />
        {/* Fotoning ustidagi yorliqlar oʻqilishi uchun pastdan yengil parda. */}
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-on-primary/[0.45] to-transparent"
        />

        <span
          className={cn(
            'absolute right-12 top-12 rounded-full px-8 py-2 text-badge',
            isOpen ? 'bg-success-surface text-success' : 'bg-neutral-surface text-text-secondary',
          )}
        >
          {isOpen ? 'Ochiq' : 'Yopiq'}
        </span>

        <span className="absolute bottom-12 left-12 rounded-full bg-surface-elevated/[0.92] px-8 py-2 text-badge text-text-secondary">
          {category}
        </span>
      </div>

      <div className="p-12">
        <p className="truncate text-title text-text-primary">{name}</p>
        <p className="mt-2 flex items-center gap-4 text-body-sm text-text-secondary">
          <Icon icon={MapPin} size={14} className="shrink-0" aria-hidden />
          <span className="truncate">{district}</span>
        </p>

        <span className="-mx-12 my-12 block h-px bg-border" aria-hidden />

        <div className="flex items-center justify-between gap-8">
          <span className="flex min-w-0 items-center gap-4">
            <Icon icon={Star} size={16} weight="fill" className="shrink-0 text-star" aria-hidden />
            <span className="tabular text-numeric-sm text-text-primary">{formatRating(rating)}</span>
            <span className="truncate text-caption text-text-secondary">· {reviews} ta sharh</span>
          </span>

          {hasDelivery && (
            <span className="flex shrink-0 items-center gap-4 rounded-full bg-primary-surface px-8 py-2 text-badge text-primary-pressed">
              <Icon icon={Truck} size={14} weight="fill" aria-hidden />
              Yetkazish
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
