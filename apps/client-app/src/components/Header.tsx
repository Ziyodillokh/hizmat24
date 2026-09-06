import { ArrowLeft, Bell } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatPhone, greeting } from '@/lib/formatters';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { UnreadBadge } from './BottomNav';

/**
 * Header — spetsifikatsiya 9.15-bandi.
 * `home`: 44px avatar + salomlashuv/ism + qoʻngʻiroq ikonasi.
 * `inner`: orqaga strelka + markazda sarlavha (`h3`) + ixtiyoriy amal.
 */
export type HeaderVariant = 'home' | 'inner';

/**
 * `hero` — Light temadagi tepa turkuaz blok ustidagi holat: salomlashuv, ism va
 * qoʻngʻiroq ikonasi `on-primary` tokeni rangida chiziladi (4-boʻlim, 3-punkt).
 * Yorqin turkuaz ustiga oq matn ishlatilmaydi (4-boʻlim, 1-punkt) — `on-primary`
 * (#04302F) `surface-hero` (#1EC8C8) ustida 6,9:1 kontrast beradi.
 */
type HeaderTone = 'surface' | 'hero';

/**
 * `hero` tusi endi IKKALA temada bir xil ishlaydi: hero maydoni chuqur teal,
 * ustidagi matn esa oq. Ilgari bu yerda har bir qator uchun alohida
 * `[[data-theme='dark']_&]:` tarmogʻi bor edi — chunki Lightʼdagi hero yorqin
 * tsian boʻlib, oq matnni koʻtara olmasdi.
 */
const GREETING_CLASSES: Record<HeaderTone, string> = {
  surface: 'text-text-secondary',
  hero: 'text-on-primary-deep/[0.78]',
};

const TITLE_CLASSES: Record<HeaderTone, string> = {
  surface: 'text-text-primary',
  hero: 'text-on-primary-deep',
};

const BELL_CLASSES: Record<HeaderTone, string> = {
  surface: 'text-text-secondary',
  hero: 'text-on-primary-deep/[0.85]',
};

export interface HeaderProps {
  variant?: HeaderVariant;
  /** `home`: ism bor boʻlsa ikkinchi qatorda ism (8.3-band). */
  name?: string | null;
  /** `home`: ism yoʻq boʻlsa maskalangan raqam koʻrsatiladi (8.3-band). */
  phone?: string | null;
  /** `home`: salomlashuvni tanlash uchun joriy vaqt (8.3-band). */
  now?: Date;
  /** `home`: avatarni tashqaridan berish; berilmasa 9.28-komponent (Avatar) 44px oʻlchamda. */
  avatar?: ReactNode;
  /** `home`: qoʻngʻiroq ikonasidagi oʻqilmaganlar soni. */
  unreadCount?: number;
  onNotificationsClick?: () => void;
  /** Light temadagi turkuaz blok ustida turganda `true`. */
  onHero?: boolean;
  /** `inner`: ekran sarlavhasi — 8.2-banddagi jadvaldan. */
  title?: string;
  onBack?: () => void;
  /** `inner`: oʻngdagi ixtiyoriy amal. */
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
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Orqaga"
            className="flex h-touch w-touch shrink-0 items-center justify-start"
          >
            <Icon icon={ArrowLeft} size={24} className={BELL_CLASSES[tone]} />
          </button>
        ) : (
          // Joy saqlanadi — sarlavha markazda qoladi.
          <span className="h-touch w-touch shrink-0" aria-hidden />
        )}
        <h2 className={cn('min-w-0 flex-1 truncate text-center text-h3', TITLE_CLASSES[tone])}>
          {title}
        </h2>
        {/* Amal boʻlmasa ham joy saqlanadi — sarlavha markazda qoladi. */}
        <div className="flex h-touch w-touch shrink-0 items-center justify-end">{action}</div>
      </header>
    );
  }

  // Raqam maskalanmaydi: bu foydalanuvchining OʻZ bosh sahifasi va Profil
  // sahifasida ham raqam toʻliq koʻrsatiladi — ikki joyda ikki xil format
  // ilovani nomuvofiq qilib koʻrsatardi.
  const identity = name?.trim() ? name.trim() : phone ? formatPhone(phone) : '';

  return (
    <header className={rootClasses}>
      {/* Hero ustida standart `surface-sunken` avatar ekranning eng toʻyingan
          zonasida oqargan teshik boʻlib koʻrinardi. */}
      {avatar ?? (
        <Avatar
          name={name}
          size={HEADER_AVATAR_SIZE}
          className={
            onHero
              ? 'bg-on-primary-deep/[0.16] text-on-primary-deep ring-1 ring-inset ring-on-primary-deep/[0.28]'
              : undefined
          }
        />
      )}
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-body-sm', GREETING_CLASSES[tone])}>
          {greeting(now ?? new Date())}
        </p>
        {/*
          `h3`, `h2` emas: maskalangan raqam ("+998 90 *** ** 67") 22px qalin
          holda bosh sahifadagi eng katta matnga aylanib, eʼtiborni xizmatlardan
          oʻgʻirlab olardi. Salomlashuv bilan birga u ikkilamchi maʼlumot.
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
          <UnreadBadge count={unreadCount} className="absolute -right-8 -top-8 ring-surface-hero" />
        </span>
      </button>
    </header>
  );
}
