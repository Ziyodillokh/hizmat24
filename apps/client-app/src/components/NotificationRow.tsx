import {
  BellRing,
  CheckCircle2,
  Headset,
  ListOrdered,
  Navigation,
  ShieldAlert,
  UserCheck,
  Wrench,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/formatters';
import { Icon } from './Icon';

/**
 * Bildirishnoma qatori — spetsifikatsiya 9.13-bandi, tur xaritasi 25-ekrandan.
 * Chapda 40px doira ikona · o'ngda sarlavha (body-lg/600), matn (body-sm,
 * 2 satrgacha) va nisbiy vaqt (caption). O'qilmagan: primary 6% fon + 6px nuqta.
 */

/** 25-ekran jadvalidagi 9 ta tur. Serverdan shu nomlar keladi. */
export type NotificationType =
  | 'MASTER_ASSIGNED'
  | 'MASTER_EN_ROUTE'
  | 'MASTER_ARRIVED'
  | 'QUEUED'
  | 'WORK_STARTED'
  | 'WORK_COMPLETED'
  | 'ORDER_CANCELLED'
  | 'SAFETY_FLAGGED'
  | 'OPERATOR_SEARCHING';

export type NotificationTone = 'primary' | 'warning' | 'success' | 'danger' | 'secondary';

export interface NotificationVisual {
  icon: LucideIcon;
  tone: NotificationTone;
}

/** 25-ekran: "9 ta tur uchun ikona va rang xaritasi" — aynan shu jadval. */
export const NOTIFICATION_ICONS: Record<NotificationType, NotificationVisual> = {
  MASTER_ASSIGNED: { icon: UserCheck, tone: 'primary' },
  MASTER_EN_ROUTE: { icon: Navigation, tone: 'primary' },
  MASTER_ARRIVED: { icon: BellRing, tone: 'warning' },
  QUEUED: { icon: ListOrdered, tone: 'warning' },
  WORK_STARTED: { icon: Wrench, tone: 'primary' },
  WORK_COMPLETED: { icon: CheckCircle2, tone: 'success' },
  ORDER_CANCELLED: { icon: XCircle, tone: 'secondary' },
  SAFETY_FLAGGED: { icon: ShieldAlert, tone: 'danger' },
  OPERATOR_SEARCHING: { icon: Headset, tone: 'warning' },
};

/** Doira foni — rang 14% opacity, ikona to'liq rangda (9.9/9.12 bilan bir xil qoida). */
const TONE_CLASSES: Record<NotificationTone, string> = {
  primary: 'bg-primary/[0.14] text-primary',
  warning: 'bg-warning/[0.14] text-warning',
  success: 'bg-success/[0.14] text-success',
  danger: 'bg-danger/[0.14] text-danger',
  secondary: 'bg-text-secondary/[0.14] text-text-secondary',
};

export interface NotificationRowProps {
  type: NotificationType;
  /** Sarlavha va matn serverdan tayyor keladi — UI o'z matnini to'qimaydi (25-ekran). */
  title: string;
  body: string;
  createdAt: Date;
  /** Vaqt "Bugun"/"Kecha" ga nisbatan hisoblanadi (8.5-band). */
  now: Date;
  isUnread?: boolean;
  onSelect?: () => void;
  className?: string;
}

export function NotificationRow({
  type,
  title,
  body,
  createdAt,
  now,
  isUnread = false,
  onSelect,
  className,
}: NotificationRowProps) {
  const { icon, tone } = NOTIFICATION_ICONS[type];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex w-full items-start gap-12 rounded-lg p-16 text-left',
        'transition-transform active:scale-[0.99]',
        // O'qilmagan qator: yengil primary fon + chap chekkadagi nuqta uchun joy.
        isUnread ? 'bg-primary/[0.06] pl-24' : 'bg-transparent',
        className,
      )}
    >
      {isUnread && (
        <span
          className="absolute left-8 top-1/2 h-[6px] w-[6px] -translate-y-1/2 rounded-full bg-primary"
          aria-hidden
        />
      )}

      <span
        className={cn(
          'flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full',
          TONE_CLASSES[tone],
        )}
        aria-hidden
      >
        <Icon icon={icon} size={20} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-body-lg font-semibold text-text-primary">{title}</span>
        <span className="mt-4 block line-clamp-2 text-body-sm text-text-secondary">{body}</span>
        <span className="mt-8 block text-caption text-text-secondary">
          {formatDateTime(createdAt, now)}
        </span>
      </span>
    </button>
  );
}
