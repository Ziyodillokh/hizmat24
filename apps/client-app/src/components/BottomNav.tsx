import { Bell, ClipboardList, House, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Pastki navigatsiya — spetsifikatsiya 9.14-bandi.
 * h=56 + 34px home indicator zonasi. AYNAN 4 element (8.2-band);
 * "Xabarlar"/"Chat" tabi yo'q (14.2-band, 9-punkt).
 */
export type TabKey = 'home' | 'orders' | 'notifications' | 'profile';

interface TabDefinition {
  key: TabKey;
  label: string;
  icon: LucideIcon;
}

/** Tartib ham, yorliqlar ham 8.2-banddagi jadvaldan — o'zgartirilmaydi. */
const TABS: readonly TabDefinition[] = [
  { key: 'home', label: 'Bosh sahifa', icon: House },
  { key: 'orders', label: 'Buyurtmalarim', icon: ClipboardList },
  { key: 'notifications', label: 'Bildirishnomalar', icon: Bell },
  { key: 'profile', label: 'Profil', icon: User },
];

type TabState = 'active' | 'inactive';

/**
 * Faol ikona TO'LDIRILMAYDI — faqat rang va stroke o'zgaradi (6.4-band).
 * `[stroke-width:2]` kerak, chunki `Icon` 24px uchun 1.75 beradi va
 * CSS xossasi SVG atributidan ustun turadi.
 */
const ICON_CLASSES: Record<TabState, string> = {
  active: 'text-primary [stroke-width:2]',
  inactive: 'text-text-secondary',
};

const LABEL_CLASSES: Record<TabState, string> = {
  active: 'text-primary font-semibold',
  inactive: 'text-text-secondary',
};

/** 9.14-band: 99 dan ortiq o'qilmagan bildirishnoma "99+" ko'rinishida. */
const UNREAD_BADGE_MAX = 99;

/**
 * 9.14-band: badge doirasi 18px. Bu — komponentning ichki o'lchami, spacing
 * shkalasi emas (6.1-band: shkala faqat padding/margin/gap uchun).
 */
const UNREAD_BADGE_SIZE = 18;

export interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export function UnreadBadge({ count, className }: UnreadBadgeProps) {
  // O'qilmagan yo'q bo'lsa badge butunlay yashiriladi — "0" yozilmaydi.
  if (count <= 0) return null;

  const label = count > UNREAD_BADGE_MAX ? `${UNREAD_BADGE_MAX}+` : String(count);

  return (
    <span
      style={{ height: UNREAD_BADGE_SIZE, minWidth: UNREAD_BADGE_SIZE }}
      className={cn(
        'flex items-center justify-center rounded-full px-4',
        'bg-danger-fill text-tab-label text-on-primary-deep',
        className,
      )}
    >
      {label}
    </span>
  );
}

export interface BottomNavProps {
  active: TabKey;
  /** Bildirishnomalar tabidagi badge uchun (9.14-band). */
  unreadCount?: number;
  onSelect: (tab: TabKey) => void;
  className?: string;
}

export function BottomNav({ active, unreadCount = 0, onSelect, className }: BottomNavProps) {
  return (
    <nav className={cn('w-full border-t border-border bg-surface', className)}>
      <ul className="flex h-tab-bar items-stretch">
        {TABS.map((tab) => {
          const state: TabState = tab.key === active ? 'active' : 'inactive';

          return (
            <li key={tab.key} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(tab.key)}
                aria-current={state === 'active' ? 'page' : undefined}
                // 6.1-band: ikona ↔ matn oralig'i 8px.
                className="flex h-full w-full flex-col items-center justify-center gap-8 px-4"
              >
                <span className="relative">
                  <Icon icon={tab.icon} size={24} className={ICON_CLASSES[state]} />
                  {tab.key === 'notifications' && (
                    <UnreadBadge count={unreadCount} className="absolute -right-8 -top-4" />
                  )}
                </span>
                <span className={cn('max-w-full truncate text-tab-label', LABEL_CLASSES[state])}>
                  {tab.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {/* Home indicator zonasi — kontent shu yerga chizilmaydi (9.14-band). */}
      <div className="h-home-indicator" aria-hidden />
    </nav>
  );
}
