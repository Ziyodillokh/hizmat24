import { Quotes, ThumbsUp } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { formatDayLabel } from '@/lib/formatters';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { StarRating } from './StarRating';

/**
 * "Mijozlarimiz fikrlari" kartasi (egasining maketi): avatar, ism, sana,
 * yulduzlar, qoʻshtirnoqli iqtibos va "foydali" soni.
 *
 * Maketdagi toʻrt qator (ism → sana → yulduzlar → layk) birinchi ekranga
 * sigʻmasdi; shuning uchun ism va layk BIR satrda, yulduzlar va sana BIR
 * satrda — sarlavha bloki avatar balandligi (36px) ichida qoladi.
 *
 * Avatar faqat bosh harf: ustalarning fotolarini mijoz nomi ostida
 * koʻrsatish — bir odamni boshqasi sifatida taqdim etish.
 */
export interface ReviewCardProps {
  customerName: string;
  stars: number;
  comment: string;
  /** "Foydali" belgilari soni — faqat koʻrsatkich, bosib boʻlmaydi. */
  likeCount: number;
  createdAt: Date;
  /** Sana "Bugun"/"Kecha" ga nisbatan hisoblanadi. */
  now: Date;
  /** Bosh sahifada ikki satr; toʻliq roʻyxatda butun matn. */
  clampQuote?: boolean;
  className?: string;
}

/*
 * Komponent `@/mocks` ni bilmaydi (OrderCard, NotificationRow kabi): mock
 * fayl oʻzini vaqtinchalik deb eʼlon qilgan, karta esa server maʼlumoti
 * bilan ham xuddi shu propslar orqali chiziladi.
 */
export function ReviewCard({
  customerName,
  stars,
  comment,
  likeCount,
  createdAt,
  now,
  clampQuote = true,
  className,
}: ReviewCardProps) {
  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-lg border border-transparent bg-surface-elevated p-12 shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        '[@media(max-height:800px)]:p-8',
        className,
      )}
    >
      <div className="flex items-center gap-8">
        <Avatar name={customerName} size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-8">
            <p className="truncate text-body-sm font-semibold text-text-primary">
              {customerName}
            </p>
            {/* Faqat koʻrsatkich, `button` EMAS: layk modeli yoʻq, bosilganda
                hech narsa oʻzgarmaydi. */}
            <span
              className="tabular inline-flex shrink-0 items-center gap-4 text-caption text-text-secondary"
              aria-label={`${likeCount} kishiga foydali boʻldi`}
            >
              <Icon icon={ThumbsUp} size={14} aria-hidden />
              {likeCount}
            </span>
          </div>
          <div className="flex items-center gap-8">
            <StarRating value={stars} size="sm" />
            <span className="truncate text-caption text-text-secondary">
              {formatDayLabel(createdAt, now)}
            </span>
          </div>
        </div>
      </div>
      <p
        className={cn(
          'mt-8 text-body-sm text-text-primary [@media(max-height:800px)]:mt-4',
          clampQuote && 'line-clamp-2 min-h-[2.375rem]',
        )}
      >
        <Icon
          icon={Quotes}
          size={14}
          weight="fill"
          className="mr-2 inline align-[-2px] text-primary"
          aria-hidden
        />
        “{comment}”
      </p>
    </article>
  );
}
