import type { KeyboardEvent } from 'react';
import { CaretRight, SealCheck, Star } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { formatRating } from '@/lib/formatters';
import { Avatar } from './Avatar';
import { MarqueeText } from './MarqueeText';
import { Card } from './Card';
import { Icon } from './Icon';

/**
 * Mutaxassislar roʻyxatidagi karta.
 *
 * `OrderCard` va `ServiceCard` bilan bir xil tuzilma: tepada mazmun, pastda
 * meta qatori, orasida karta chetigacha choʻzilgan chiziq.
 *
 * Meta qatorida reyting va bajarilgan ishlar soni turadi — ustani tanlashda
 * aynan shu ikki raqam hal qiladi, shuning uchun ular ismdan keyingi eng
 * koʻzga tashlanadigan element boʻlishi kerak.
 */
export interface MasterListCardProps {
  name: string;
  profession: string;
  rating: number;
  completedOrders: number;
  /** Ilova ichiga joylangan rasm; boʻlmasa ism bosh harfi chiziladi. */
  photoUrl?: string;
  /** Davlat sertifikati bor ustada ism yonida tasdiq belgisi chiziladi. */
  isCertified?: boolean;
  /** Yangi usta — kam ish bajargan; roʻyxatda ochiq belgilanadi. */
  isNew?: boolean;
  onOpen?: () => void;
  className?: string;
}

export function MasterListCard({
  name,
  profession,
  rating,
  completedOrders,
  photoUrl,
  isCertified = false,
  isNew = false,
  onOpen,
  className,
}: MasterListCardProps) {
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
      className={cn('p-12', className)}
    >
      <div className="flex items-start gap-12">
        <Avatar name={name} src={photoUrl} size={48} shape="square" className="shrink-0" />

        <div className="min-w-0 flex-1">
          {/* Ism va familiya bitta qatorda; sigʻmasa sekin suriladi. */}
          <MarqueeText text={name} className="text-title text-text-primary" />
          <p className="mt-2 truncate text-body-sm text-text-secondary">{profession}</p>
        </div>

        {isInteractive && (
          <Icon icon={CaretRight} size={16} className="mt-4 shrink-0 text-text-secondary" />
        )}
      </div>

      <span className="-mx-12 my-12 block h-px bg-border" aria-hidden />

      <div className="flex items-center justify-between gap-8">
        <span className="flex items-center gap-4">
          <Icon icon={Star} size={16} weight="fill" className="text-star" aria-hidden />
          <span className="tabular text-numeric-sm text-text-primary">{formatRating(rating)}</span>
          <span className="text-caption text-text-secondary">
            · {completedOrders} ta ish
          </span>
        </span>

        {/*
          Sertifikat belgisi pastki qatorda: ism yonida tursa, `MarqueeText`
          butun bo'sh joyni egallagani uchun u ismdan uzoqlashib, qator
          chetiga yopishib qolardi.
        */}
        {isCertified ? (
          <span className="flex shrink-0 items-center gap-4 rounded-full bg-primary-surface px-8 py-2 text-badge text-primary-pressed">
            <Icon icon={SealCheck} size={14} weight="fill" aria-hidden />
            Sertifikatli
          </span>
        ) : isNew ? (
          <span className="shrink-0 rounded-full bg-neutral-surface px-8 py-2 text-badge text-text-secondary">
            Yangi
          </span>
        ) : null}
      </div>
    </Card>
  );
}
