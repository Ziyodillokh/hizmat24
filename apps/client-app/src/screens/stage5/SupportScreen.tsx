import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Clock, Phone, Send } from 'lucide-react';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { ORDERS_BY_ID } from '@/mocks/orders';

/**
 * 30 · Qo'llab-quvvatlash xizmati.
 *
 * Buyurtma ekranidan ochilganda buyurtma raqami avtomatik to'ldiriladi —
 * foydalanuvchi uni qo'lda ko'chirib yozmasin.
 */
export type SupportVariant = 'default' | 'with-order';

export interface SupportScreenProps {
  variant?: SupportVariant;
}

interface ChannelItem {
  icon: LucideIcon;
  label: string;
  value: string;
}

const CHANNELS: ChannelItem[] = [
  { icon: Phone, label: "Telefon orqali bog'lanish", value: '+998 71 200 24 24' },
  { icon: Send, label: 'Telegram orqali yozish', value: '@hizmat24_support' },
];

export function SupportScreen({ variant = 'default' }: SupportScreenProps) {
  const order = ORDERS_BY_ID['o-progress'];

  return (
    <ScreenShell header={<Header variant="inner" title="Qo'llab-quvvatlash xizmati" />}>
      <p className="mt-4 text-body text-text-secondary">
        Savolingiz bo&apos;lsa, quyidagi usullardan biri orqali bog&apos;laning.
      </p>

      <nav className="mt-20">
        {CHANNELS.map((channel) => (
          <button
            key={channel.label}
            type="button"
            className="flex min-h-touch w-full items-center gap-12 border-b border-border px-4 py-16 text-left last:border-b-0"
          >
            <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-surface-sunken">
              <Icon icon={channel.icon} size={20} className="text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body-lg text-text-primary">{channel.label}</span>
              <span className="block text-body-sm text-text-secondary">{channel.value}</span>
            </span>
            <Icon icon={ChevronRight} size={20} className="text-text-disabled" />
          </button>
        ))}
      </nav>

      {variant === 'with-order' && (
        <div className="mt-20 rounded-sm bg-surface-sunken p-16">
          <p className="text-caption text-text-secondary">Buyurtma raqami</p>
          <p className="mt-4 text-body-lg text-text-primary tabular tracking-[0.4px]">
            {order.shortId}
          </p>
        </div>
      )}

      <div className="mt-20 flex items-center gap-8">
        <Icon icon={Clock} size={16} className="text-text-secondary" />
        <p className="text-caption text-text-secondary">Har kuni 08:00 — 22:00</p>
      </div>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
