import { BellSlash } from '@phosphor-icons/react';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/Button';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { NotificationRow } from '@/components/NotificationRow';
import { Skeleton, SkeletonCircle } from '@/components/Skeleton';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { NOTIFICATIONS, UNREAD_COUNT, notificationUiType } from '@/mocks/notifications';
import { NOW } from '@/mocks/orders';

/**
 * 25 · Bildirishnomalar.
 *
 * Sarlavha va matn serverdan TAYYOR keladi — UI oʻz matnini toʻqimaydi.
 * Push yetkazilmagan boʻlsa ham xabar shu roʻyxatda koʻrinadi (TZ 4-boʻlim).
 */
export type NotificationsVariant = 'ready' | 'all-read' | 'empty' | 'loading' | 'offline';

export interface NotificationsScreenProps {
  variant?: NotificationsVariant;
}

export function NotificationsScreen({ variant = 'ready' }: NotificationsScreenProps) {
  const items = variant === 'empty' ? [] : NOTIFICATIONS;
  const unread = variant === 'ready' ? UNREAD_COUNT : 0;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Bildirishnomalar" />}
      footer={<BottomNav active="home" onSelect={() => undefined} />}
    >
      {variant === 'offline' && <ConnectionBanner state="reconnecting" />}

      {/* Oʻqilmagan boʻlmasa qator ham, tugma ham BUTUNLAY yashiriladi. */}
      {unread > 0 && (
        <div className="flex items-center justify-between gap-12">
          <p className="text-caption text-text-secondary">{unread} ta oʻqilmagan</p>
          <Button variant="ghost" size="small" fullWidth={false}>
            Barchasini oʻqilgan deb belgilash
          </Button>
        </div>
      )}

      {variant === 'loading' ? (
        <ul className="mt-16 flex flex-col gap-12">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index} className="flex items-start gap-12 p-4">
              <SkeletonCircle size={40} />
              <div className="flex-1">
                <Skeleton width="50%" height={18} />
                <Skeleton width="80%" height={14} className="mt-8" />
              </div>
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <EmptyState
          icon={BellSlash}
          title="Bildirishnomalar yoʻq"
          description="Buyurtma bergach, holat oʻzgarishlari shu yerda koʻrinadi"
          inline
        />
      ) : (
        <ul className="mt-12 flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.id}>
              <NotificationRow
                type={notificationUiType(item.kind)}
                title={item.title}
                body={item.body}
                createdAt={item.sentAt}
                now={NOW}
                isUnread={variant === 'ready' && item.readAt === null}
                onSelect={() => undefined}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
