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
 * Chapda 40px tusli plitka · oʻngda sarlavha, matn (2 satrgacha) va nisbiy
 * vaqt. Oʻqilmagan qator sarlavha yonidagi nuqta bilan belgilanadi.
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

/** Doira foni — rang 14% opacity, ikona toʻliq rangda (9.9/9.12 bilan bir xil qoida). */
const TONE_CLASSES: Record<NotificationTone, string> = {
  primary: 'bg-primary-surface text-primary-pressed',
  warning: 'bg-warning-surface text-warning',
  success: 'bg-success-surface text-success',
  danger: 'bg-danger-surface text-danger',
  secondary: 'bg-neutral-surface text-text-secondary',
};

export interface NotificationRowProps {
  type: NotificationType;
  /** Sarlavha va matn serverdan tayyor keladi — UI oʻz matnini toʻqimaydi (25-ekran). */
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
        // Har bir qator — karta. Ilgari oʻqilganlari fonsiz matn boʻlib,
        // oʻqilmaganlari esa tusli blok edi: roʻyxat yarim yoʻlda uslubini
        // oʻzgartirgandek koʻrinardi va buzilgan taassurot berardi.
        'relative flex w-full items-start gap-12 rounded-lg p-12 text-left',
        'border border-transparent bg-surface-elevated shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        'transition-transform duration-press ease-std active:scale-[0.99]',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md',
          TONE_CLASSES[tone],
        )}
        aria-hidden
      >
        <Icon icon={icon} size={20} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-8">
          <span className="min-w-0 flex-1 text-title text-text-primary">{title}</span>
          {/* Oʻqilmagan belgisi sarlavha yonida: chap chekkadagi nuqta
              kartaning ichki maydonini yeb, matnni surib qoʻyardi. */}
          {isUnread && (
            <span className="mt-8 h-[8px] w-[8px] shrink-0 rounded-full bg-primary" aria-hidden />
          )}
        </span>
        <span className="mt-2 block line-clamp-2 text-body-sm text-text-secondary">{body}</span>
        <span className="mt-8 block text-caption text-text-secondary">
          {formatDateTime(createdAt, now)}
        </span>
      </span>
    </button>
  );
}
