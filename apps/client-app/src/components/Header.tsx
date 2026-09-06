import type { ReactNode } from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPhone, greeting } from '@/lib/formatters';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { UnreadBadge } from './BottomNav';

/**
 * Header — spetsifikatsiya 9.15-bandi.
 * `home`: 44px avatar + salomlashuv/ism + qo'ng'iroq ikonasi.
 * `inner`: orqaga strelka + markazda sarlavha (`h3`) + ixtiyoriy amal.
 */
export type HeaderVariant = 'home' | 'inner';

/**
 * `hero` — Light temadagi tepa turkuaz blok ustidagi holat: salomlashuv, ism va
 * qo'ng'iroq ikonasi `on-primary` tokeni rangida chiziladi (4-bo'lim, 3-punkt).
 * Yorqin turkuaz ustiga oq matn ishlatilmaydi (4-bo'lim, 1-punkt) — `on-primary`
 * (#04302F) `surface-hero` (#1EC8C8) ustida 6,9:1 kontrast beradi.
 */
type HeaderTone = 'surface' | 'hero';

/**
 * `hero` tusi FAQAT Light temada kuchga kiradi: dekorativ turkuaz blok o'sha
 * temada mavjud (2.1-band, 3-punkt). Dark temada blok yo'q, shuning uchun
 * `data-theme='dark'` ostida oddiy yuza ranglariga qaytadi.
 *
 * Tus JS orqali emas, CSS orqali tanlanadi — shunda bitta komponent ikkala
 * temada ham to'g'ri ishlaydi va tuzilma o'zgarmaydi (14.7-band, 56-punkt).
 */
const GREETING_CLASSES: Record<HeaderTone, string> = {
  surface: 'text-text-secondary',
  hero: "text-on-primary [[data-theme='dark']_&]:text-text-secondary",
};

const TITLE_CLASSES: Record<HeaderTone, string> = {
  surface: 'text-text-primary',
  hero: "text-on-primary [[data-theme='dark']_&]:text-text-primary",
};

const BELL_CLASSES: Record<HeaderTone, string> = {
  surface: 'text-text-secondary',
  hero: "text-on-primary [[data-theme='dark']_&]:text-text-secondary",
};

export interface HeaderProps {
  variant?: HeaderVariant;
  /** `home`: ism bor bo'lsa ikkinchi qatorda ism (8.3-band). */
  name?: string | null;
  /** `home`: ism yo'q bo'lsa maskalangan raqam ko'rsatiladi (8.3-band). */
  phone?: string | null;
  /** `home`: salomlashuvni tanlash uchun joriy vaqt (8.3-band). */
  now?: Date;
  /** `home`: avatarni tashqaridan berish; berilmasa 9.28-komponent (Avatar) 44px o'lchamda. */
  avatar?: ReactNode;
  /** `home`: qo'ng'iroq ikonasidagi o'qilmaganlar soni. */
  unreadCount?: number;
  onNotificationsClick?: () => void;
  /** Light temadagi turkuaz blok ustida turganda `true`. */
  onHero?: boolean;
  /** `inner`: ekran sarlavhasi — 8.2-banddagi jadvaldan. */
  title?: string;
  onBack?: () => void;
  /** `inner`: o'ngdagi ixtiyoriy amal. */
  action?: ReactNode;
  className?: string;
}

/** 9.15-band: header avatari 44px. Chizishni 9.28-komponent bajaradi. */
const HEADER_AVATAR_SIZE = 44;

export function Header({
  variant = 'home',
  name,
  phone,
  now,
  avatar,
  unreadCount = 0,
  onNotificationsClick,
  onHero = false,
  title,
  onBack,
  action,
  className,
}: HeaderProps) {
  const tone: HeaderTone = onHero ? 'hero' : 'surface';
  const rootClasses = cn('flex h-header w-full items-center gap-12 px-20', className);

  if (variant === 'inner') {
    return (
      <header className={rootClasses}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Orqaga"
          className="flex h-touch w-touch shrink-0 items-center justify-start"
        >
          <Icon icon={ArrowLeft} size={24} className={BELL_CLASSES[tone]} />
        </button>
        <h2 className={cn('min-w-0 flex-1 truncate text-center text-h3', TITLE_CLASSES[tone])}>
          {title}
        </h2>
        {/* Amal bo'lmasa ham joy saqlanadi — sarlavha markazda qoladi. */}
        <div className="flex h-touch w-touch shrink-0 items-center justify-end">{action}</div>
      </header>
    );
  }

  // Raqam maskalanmaydi: bu foydalanuvchining O'Z bosh sahifasi va Profil
  // sahifasida ham raqam to'liq ko'rsatiladi — ikki joyda ikki xil format
  // ilovani nomuvofiq qilib ko'rsatardi.
  const identity = name?.trim() ? name.trim() : phone ? formatPhone(phone) : '';

  return (
    <header className={rootClasses}>
      {avatar ?? <Avatar name={name} size={HEADER_AVATAR_SIZE} />}
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-body-sm', GREETING_CLASSES[tone])}>
          {greeting(now ?? new Date())}
        </p>
        {/*
          `h3`, `h2` emas: maskalangan raqam ("+998 90 *** ** 67") 22px qalin
          holda bosh sahifadagi eng katta matnga aylanib, e'tiborni xizmatlardan
          o'g'irlab olardi. Salomlashuv bilan birga u ikkilamchi ma'lumot.
        */}
        <p className={cn('truncate text-h3', TITLE_CLASSES[tone])}>{identity}</p>
      </div>
      <button
        type="button"
        onClick={onNotificationsClick}
        aria-label="Bildirishnomalar"
        className="flex h-touch w-touch shrink-0 items-center justify-end"
      >
        <span className="relative">
          <Icon icon={Bell} size={24} className={BELL_CLASSES[tone]} />
          <UnreadBadge count={unreadCount} className="absolute -right-8 -top-4" />
        </span>
      </button>
    </header>
  );
}
