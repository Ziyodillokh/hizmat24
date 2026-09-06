import { CaretRight, Clock, PaperPlaneTilt, Phone } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { ORDERS_BY_ID } from '@/mocks/orders';

/**
 * 30 · Qoʻllab-quvvatlash xizmati.
 *
 * Buyurtma ekranidan ochilganda buyurtma raqami avtomatik toʻldiriladi —
 * foydalanuvchi uni qoʻlda koʻchirib yozmasin.
 */
export type SupportVariant = 'default' | 'with-order';

export interface SupportScreenProps {
  variant?: SupportVariant;
  /** Berilmasa sarlavhada orqaga strelkasi chizilmaydi. */
  onBack?: () => void;
}

interface ChannelItem {
  icon: IconGlyph;
  label: string;
  value: string;
  /** Bosilganda ochiladigan manzil: `tel:` yoki Telegram. */
  href: string;
}

/*
 * Qatorlar HAQIQATAN ochiladi. Ilgari ular oddiy `<button>` edi va hech
 * qanday `onClick` yoʻq edi: foydalanuvchi shevronni koʻrib bosardi, hech
 * nima boʻlmasdi. Ishlamaydigan boshqaruv ilovani buzuq koʻrsatadi.
 */
const CHANNELS: ChannelItem[] = [
  {
    icon: Phone,
    label: 'Telefon orqali bogʻlanish',
    value: '+998 71 200 24 24',
    href: 'tel:+998712002424',
  },
  {
    icon: PaperPlaneTilt,
    label: 'Telegram orqali yozish',
    value: '@hizmat24_support',
    href: 'https://t.me/hizmat24_support',
  },
];

export function SupportScreen({ variant = 'default', onBack }: SupportScreenProps) {
  const order = ORDERS_BY_ID['o-progress'];

  return (
    <ScreenShell
      header={<Header variant="inner" title="Qoʻllab-quvvatlash xizmati" onBack={onBack} />}
    >
      <p className="mt-4 text-body text-text-secondary">
        Savolingiz boʻlsa, quyidagi usullardan biri orqali bogʻlaning.
      </p>

      <nav className="mt-20">
        {CHANNELS.map((channel) => (
          <a
            key={channel.label}
            href={channel.href}
            className="flex min-h-touch w-full items-center gap-12 border-b border-border px-4 py-16 text-left last:border-b-0"
          >
            <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-surface-sunken">
              <Icon icon={channel.icon} size={20} className="text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body-lg text-text-primary">{channel.label}</span>
              <span className="block text-body-sm text-text-secondary">{channel.value}</span>
            </span>
            <Icon icon={CaretRight} size={16} className="shrink-0 text-text-secondary" />
          </a>
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
