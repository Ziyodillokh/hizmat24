import type { LucideIcon } from 'lucide-react';
import { BellRing, MapPin } from 'lucide-react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { StatusBar } from '@/preview/StatusBar';
import { BottomInset } from '@/screens/_shared/ScreenShell';

/**
 * 31 · Ruxsat so'rash ekranlari.
 *
 * Har biri uchun RAD ETILGAN varianti ham majburiy: unda nima ishlamasligi
 * tushuntiriladi va sozlamalarga yo'l ko'rsatiladi.
 */
export type PermissionKind = 'location' | 'notifications';

export interface PermissionScreenProps {
  kind?: PermissionKind;
  denied?: boolean;
}

interface PermissionCopy {
  icon: LucideIcon;
  title: string;
  description: string;
  deniedTitle: string;
  deniedDescription: string;
}

const COPY: Record<PermissionKind, PermissionCopy> = {
  location: {
    icon: MapPin,
    title: 'Joylashuvingiz kerak',
    description: 'Ustani sizga tez yuborishimiz uchun joylashuvingiz kerak',
    deniedTitle: 'Joylashuvga ruxsat berilmagan',
    deniedDescription:
      "Ruxsatsiz manzilni xaritada avtomatik aniqlab bo'lmaydi — uni qo'lda kiritishingiz kerak bo'ladi",
  },
  notifications: {
    icon: BellRing,
    title: 'Bildirishnomalarni yoqing',
    description: "Usta topilganda, yo'lga chiqqanda va yetib kelganda xabar beramiz",
    deniedTitle: "Bildirishnomalar o'chirilgan",
    deniedDescription:
      "Usta yetib kelganini o'z vaqtida bilmaysiz — buyurtma holatini ilovadan tekshirib turishingiz kerak bo'ladi",
  },
};

export function PermissionScreen({ kind = 'location', denied = false }: PermissionScreenProps) {
  const copy = COPY[kind];

  return (
    <div className="flex h-full min-h-full flex-col bg-surface">
      <StatusBar />

      <main className="flex flex-1 flex-col items-center justify-center px-20">
        <Icon
          icon={copy.icon}
          size={96}
          className={denied ? 'text-text-disabled' : 'text-primary'}
        />

        <h2 className="mt-24 text-center text-h2 text-text-primary">
          {denied ? copy.deniedTitle : copy.title}
        </h2>
        <p className="mt-8 text-center text-body text-text-secondary">
          {denied ? copy.deniedDescription : copy.description}
        </p>
      </main>

      <div className="shrink-0 px-20 pb-12 pt-24">
        <div className="flex flex-col gap-12">
          {denied ? (
            <Button variant="secondary">Sozlamalarni ochish</Button>
          ) : (
            <>
              <Button variant="primary">Ruxsat berish</Button>
              <Button variant="ghost">Keyinroq</Button>
            </>
          )}
        </div>
      </div>

      <BottomInset />
    </div>
  );
}
