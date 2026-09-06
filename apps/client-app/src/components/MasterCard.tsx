import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { Avatar } from './Avatar';
import { Badge } from './Badge';
import { Card } from './Card';
import { StarRating } from './StarRating';

/**
 * Usta kartasi — spetsifikatsiya 9.7-bandi.
 * 64px avatar · ism `h3` · kasbi `body` `text-secondary` · "Yangi"/"Tajribali" badge ·
 * "Sertifikatli" chipi (agar mavjud bo'lsa) · yulduz + reyting · "142 ta buyurtma bajargan".
 * Kartada "Buyurtma berish" tugmasi YO'Q — usta tanlanmaydi (14.1-band, 3-punkt).
 */
export type MasterExperience = 'new' | 'experienced';

export interface MasterCardProps {
  name: string;
  /** Kasbi — masalan "Elektrik". */
  profession: string;
  rating: number;
  completedOrders: number;
  experience?: MasterExperience;
  isCertified?: boolean;
  /** 19-ekran uchun ixcham variant: 44px avatar, bajarilgan buyurtmalar qatorisiz. */
  compact?: boolean;
  /** Kartani bosish usta profilini ochadi (14 va 15-ekranlar). */
  onOpen?: () => void;
  className?: string;
}

export function MasterCard({
  name,
  profession,
  rating,
  completedOrders,
  experience = 'new',
  isCertified = false,
  compact = false,
  onOpen,
  className,
}: MasterCardProps) {
  const isInteractive = Boolean(onOpen);

  // `role="button"` e'lon qilingan element klaviatura bilan ham ishlashi shart:
  // haqiqiy <button> emas, shuning uchun Enter/Space ni o'zimiz ushlaymiz.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onOpen?.();
  };

  return (
    <Card
      interactive={isInteractive}
      onClick={onOpen}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={cn('flex items-start gap-12', className)}
    >
      <Avatar name={name} size={compact ? 44 : 64} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-h3 text-text-primary">{name}</p>
        <p className="truncate text-body text-text-secondary">{profession}</p>

        <div className="mt-8 flex flex-wrap items-center gap-8">
          <Badge variant={experience} />
          {isCertified && <Badge variant="certified" />}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-12">
          <StarRating value={rating} size="sm" showValue />
          {/* Reyting yonida "N ta baho" yozilmaydi (14.1-band, 6-punkt). */}
          {!compact && (
            <span className="text-body-sm text-text-secondary">{completedOrders} ta buyurtma bajargan</span>
          )}
        </div>
      </div>
    </Card>
  );
}
