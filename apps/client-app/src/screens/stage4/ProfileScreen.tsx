import type { LucideIcon } from 'lucide-react';
import { Bell, ChevronRight, ClipboardList, Headset, Info, LogOut } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { BottomNav } from '@/components/BottomNav';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { Button } from '@/components/Button';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { maskPhone } from '@/lib/formatters';
import { USER, USER_WITHOUT_NAME } from '@/mocks/user';
import { UNREAD_COUNT } from '@/mocks/notifications';

/**
 * 26 · Profil — READ-ONLY.
 *
 * Profilni tahrirlash formasi, avatar yuklash, ism/telefon o'zgartirish,
 * "Manzillarim", to'lov usullari, til/tema tanlash CHIZILMAYDI
 * (14.4-band, 28–31-punkt).
 */
export type ProfileVariant = 'with-name' | 'without-name' | 'logout-confirm';

export interface ProfileScreenProps {
  variant?: ProfileVariant;
}

interface MenuItem {
  icon: LucideIcon;
  label: string;
  hint?: string;
  danger?: boolean;
}

const MENU: MenuItem[] = [
  { icon: ClipboardList, label: 'Buyurtmalar tarixi' },
  { icon: Bell, label: 'Bildirishnomalar', hint: 'Yoqilgan' },
  { icon: Headset, label: "Qo'llab-quvvatlash xizmati" },
  { icon: Info, label: 'Ilova haqida', hint: '1.0.0' },
  { icon: LogOut, label: 'Chiqish', danger: true },
];

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <button
      type="button"
      className="flex min-h-touch w-full items-center gap-12 border-b border-border px-4 py-12 text-left last:border-b-0"
    >
      <Icon
        icon={item.icon}
        size={20}
        className={item.danger ? 'text-danger' : 'text-text-secondary'}
      />
      <span
        className={cn('min-w-0 flex-1 text-body-lg', item.danger ? 'text-danger' : 'text-text-primary')}
      >
        {item.label}
      </span>
      {item.hint && <span className="shrink-0 text-body-sm text-text-secondary">{item.hint}</span>}
      {!item.danger && <Icon icon={ChevronRight} size={20} className="text-text-disabled" />}
    </button>
  );
}

export function ProfileScreen({ variant = 'with-name' }: ProfileScreenProps) {
  const user = variant === 'without-name' ? USER_WITHOUT_NAME : USER;
  const hasName = Boolean(user.fullName?.trim());

  return (
    <ScreenShell
      header={<Header variant="inner" title="Profil" />}
      footer={<BottomNav active="profile" unreadCount={UNREAD_COUNT} onSelect={() => undefined} />}
    >
      <div className="mt-4 flex flex-col items-center">
        <Avatar name={user.fullName} size={80} />
        {/* Ism yo'q bo'lsa ikkinchi qator BUTUNLAY yashiriladi (8.3-band). */}
        {hasName ? (
          <>
            <p className="mt-12 text-h2 text-text-primary">{user.fullName}</p>
            <p className="mt-4 text-body text-text-secondary">{maskPhone(user.phoneNumber)}</p>
          </>
        ) : (
          <p className="mt-12 text-h2 text-text-primary">{maskPhone(user.phoneNumber)}</p>
        )}
      </div>

      <nav className="mt-24">
        {MENU.map((item) => (
          <MenuRow key={item.label} item={item} />
        ))}
      </nav>

      <Modal open={variant === 'logout-confirm'} title="Chiqishni tasdiqlaysizmi?">
        <div className="mt-20 flex flex-col gap-12">
          <Button variant="destructive">Chiqish</Button>
          <Button variant="ghost">Yopish</Button>
        </div>
      </Modal>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
