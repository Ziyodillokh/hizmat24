import { ClipboardText, House, Storefront, User, UsersThree } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Pastki navigatsiya — beshta boʻlim.
 *
 * Xavfsiz zonani (home indicator) bu komponent EGALLAMAYDI — uni
 * `ScreenShell` dagi `BottomInset` beradi. Ikkalasi ham qoʻyganda 34px
 * ikki marta zahiralanardi va bu bosh sahifani past ekranlarda scrollga
 * majbur qilardi.
 *
 * Yorliqlar QISQA: 360px ekranda beshta tabga 72px dan tushadi va
 * "Mutaxassislar" yoki "Bosh sahifa" kabi uzun soʻz kesilib qolardi.
 * Ekran sarlavhalari toʻliq nomni saqlaydi — u yerda joy bor.
 */
export type TabKey = 'home' | 'orders' | 'market' | 'masters' | 'profile';

interface TabDefinition {
  key: TabKey;
  label: string;
  icon: IconGlyph;
}

const TABS: readonly TabDefinition[] = [
  { key: 'home', label: 'Asosiy', icon: House },
  { key: 'orders', label: 'Buyurtma', icon: ClipboardText },
  { key: 'market', label: 'Market', icon: Storefront },
  { key: 'masters', label: 'Ustalar', icon: UsersThree },
  { key: 'profile', label: 'Profil', icon: User },
];

type TabState = 'active' | 'inactive';

/**
 * Faol ikona toʻldiriladi: referens maketda aktiv tab shakl bilan ham,
 * rang bilan ham ajralib turadi. Faqat rangga tayanish — ilova butunlay
 * turkuaz boʻlgani uchun — eng sezilmas koʻrsatkich.
 */
const ICON_CLASSES: Record<TabState, string> = {
  // Toʻldirish endi Phosphor ogʻirligi orqali beriladi (`weight="fill"`) —
  // u glifning ichki detalini saqlagan holda shaklni toʻldiradi. Lucide'da
  // bu mumkin emasdi: `fill-*` utilitasi konturni bitta boʻlakka aylantirardi.
  active: 'text-primary-pressed',
  inactive: 'text-text-secondary',
};

const LABEL_CLASSES: Record<TabState, string> = {
  active: 'text-primary-pressed font-semibold',
  inactive: 'text-text-secondary',
};

/** 9.14-band: 99 dan ortiq oʻqilmagan bildirishnoma "99+" koʻrinishida. */
const UNREAD_BADGE_MAX = 99;

/**
 * 9.14-band: badge doirasi 18px. Bu — komponentning ichki oʻlchami, spacing
 * shkalasi emas (6.1-band: shkala faqat padding/margin/gap uchun).
 */
const UNREAD_BADGE_SIZE = 18;

export interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export function UnreadBadge({ count, className }: UnreadBadgeProps) {
  // Oʻqilmagan yoʻq boʻlsa badge butunlay yashiriladi — "0" yozilmaydi.
  if (count <= 0) return null;

  const label = count > UNREAD_BADGE_MAX ? `${UNREAD_BADGE_MAX}+` : String(count);

  return (
    <span
      style={{ height: UNREAD_BADGE_SIZE, minWidth: UNREAD_BADGE_SIZE }}
      className={cn(
        'flex items-center justify-center rounded-full px-4',
        'bg-danger-fill text-tab-label text-on-primary-deep',
        // Halqa badge ostidagi ikonani "kesib" oʻtadi. Usiz 18px lik qizil
        // disk qoʻngʻiroqning yuqori-oʻng shtrixini yeb qoʻyadi — bu xato
        // ilovaning beshta asosiy ekranidan toʻrttasida takrorlanardi.
        'ring-2',
        className,
      )}
    >
      {label}
    </span>
  );
}

export interface BottomNavProps {
  active: TabKey;
  onSelect: (tab: TabKey) => void;
  className?: string;
}

export function BottomNav({ active, onSelect, className }: BottomNavProps) {
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
                // 8px oraliq 56px lik panel ichida ikona va yorliqni ikkita
                // bogʻlanmagan obyekt qilib koʻrsatardi.
                className="relative flex h-full w-full flex-col items-center justify-center gap-2 px-2"
              >
                {/*
                  Aktiv boʻlim tepasidagi qisqa chiziq — uchinchi signal
                  (rang va toʻldirishdan tashqari). Beshta tab boʻlganda
                  faqat rang bilan ajratish yetarli emas: yorliqlar kichrayadi
                  va koʻz qaysi boʻlimda turganini darhol topa olmaydi.
                */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute inset-x-0 top-0 mx-auto h-[3px] w-[24px] rounded-b-full',
                    'transition-colors duration-state ease-std',
                    state === 'active' ? 'bg-primary-pressed' : 'bg-transparent',
                  )}
                />

                <span className="relative flex h-[26px] w-[40px] items-center justify-center">
                  <Icon
                    icon={tab.icon}
                    size={24}
                    weight={state === 'active' ? 'fill' : 'regular'}
                    className={ICON_CLASSES[state]}
                  />
                </span>
                <span className={cn('max-w-full truncate text-tab-label', LABEL_CLASSES[state])}>
                  {tab.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
