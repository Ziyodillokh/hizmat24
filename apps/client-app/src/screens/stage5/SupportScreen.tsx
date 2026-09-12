import { CaretRight, Clock, PaperPlaneTilt, Phone } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { useMinuteClock } from '@/lib/useMinuteClock';
import {
  SUPPORT_PHONE,
  SUPPORT_PHONE_LABEL,
  SUPPORT_TELEGRAM_LABEL,
  SUPPORT_TELEGRAM_URL,
  supportStatusLine,
} from '@/lib/support';

/**
 * 30 · Qoʻllab-quvvatlash xizmati.
 *
 * Buyurtma raqami bloki `variant` bilan emas, `orderShortId` mavjudligi
 * bilan boshqariladi. Ilgari ekran mock buyurtmaning raqamini koʻrsatardi:
 * jonli ilovada bu foydalanuvchiga BEGONA raqamni "sizning buyurtmangiz"
 * deb koʻrsatish edi.
 */
export interface SupportScreenProps {
  /** Buyurtmadan ochilganda — HAQIQIY raqam. Berilmasa blok chizilmaydi. */
  orderShortId?: string;
  /** Berilmasa sarlavhada orqaga strelkasi chizilmaydi. */
  onBack?: () => void;
  /** Berilmasa «Murojaatlarim» havolasi chizilmaydi (preview galereyasi). */
  onDisputes?: () => void;
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
 *
 * Raqam va manzil `lib/support.ts` dan: ular uchta ekranda koʻrsatiladi va
 * takrorlansa bir joyda oʻzgarib, boshqasida eski qolardi.
 */
const CHANNELS: ChannelItem[] = [
  {
    icon: Phone,
    label: 'Telefon orqali bogʻlanish',
    value: SUPPORT_PHONE_LABEL,
    href: `tel:${SUPPORT_PHONE}`,
  },
  {
    icon: PaperPlaneTilt,
    label: 'Telegram orqali yozish',
    value: SUPPORT_TELEGRAM_LABEL,
    href: SUPPORT_TELEGRAM_URL,
  },
];

export function SupportScreen({ orderShortId, onBack, onDisputes }: SupportScreenProps) {
  const now = useMinuteClock();

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

      {orderShortId && (
        <div className="mt-20 rounded-sm bg-surface-sunken p-16">
          <p className="text-caption text-text-secondary">Buyurtma raqami</p>
          <p className="tabular mt-4 text-body-lg tracking-[0.4px] text-text-primary">
            {orderShortId}
          </p>
        </div>
      )}

      {/* Ish vaqti jonli: yopiq boʻlsa, qachon ochilishi aytiladi. */}
      <div className="mt-20 flex items-center gap-8">
        <Icon icon={Clock} size={16} className="text-text-secondary" />
        <p className="text-caption text-text-secondary">{supportStatusLine(now)}</p>
      </div>

      {onDisputes && (
        <Button variant="ghost" className="mt-20" onClick={onDisputes}>
          Murojaatlarim
        </Button>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
