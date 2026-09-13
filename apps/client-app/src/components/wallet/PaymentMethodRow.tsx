import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { CheckCircle, DeviceMobile, Money, QrCode } from '@phosphor-icons/react';
import { DashedChip } from '@/components/DashedChip';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import type { PaymentOption, PaymentOptionKey } from '@/lib/walletCard';

/**
 * Toʻlov usuli qatori — BOSILMAYDI: usul har buyurtmada alohida tanlanadi
 * (`PaymentStep`), bu yerda faqat holat koʻrsatiladi.
 *
 * Ishlamaydigan usul `div` ichida chiziqli "Tez orada" chipi bilan turadi,
 * tugma emas va chevroni yoʻq — "bosildi, hech narsa boʻlmadi" holati
 * texnik jihatdan yuzaga kelmaydi. Bank/toʻlov tizimi logotipi yoʻq: umumiy
 * phosphor ikonalar — logotip "ulangan" degan taassurot berardi.
 */
const OPTION_ICONS: Record<PaymentOptionKey, IconGlyph> = {
  cash: Money,
  click: DeviceMobile,
  payme: QrCode,
};

export interface PaymentMethodRowProps {
  option: PaymentOption;
  /** Birinchi qatorda yuqori chiziq yoʻq. */
  isFirst?: boolean;
}

export function PaymentMethodRow({ option, isFirst = false }: PaymentMethodRowProps) {
  return (
    // `aria-disabled` yoʻq: qator interaktiv emas (rolsiz `div`), holatni
    // "Tez orada" chipining oʻzi oʻqiladigan matn sifatida bildiradi.
    <div className={cn('flex min-h-touch items-center gap-12 px-12 py-8', !isFirst && 'border-t border-border')}>
      <span
        className={cn(
          'flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-sm',
          option.isAvailable ? 'bg-primary-surface text-primary-pressed' : 'bg-neutral-surface text-text-disabled',
        )}
        aria-hidden
      >
        <Icon icon={OPTION_ICONS[option.key]} size={20} weight="duotone" />
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-body-lg', option.isAvailable ? 'text-text-primary' : 'text-text-secondary')}>
          {option.label}
        </p>
        {/* Izoh oʻraladi, qirqilmaydi: yagona ishlaydigan usulning tushuntirishi
            360px da "…toʻl…" boʻlib kesilmasligi kerak. */}
        <p className="text-body-sm text-text-secondary">{option.hint}</p>
      </div>

      {option.isAvailable ? (
        <span className="inline-flex shrink-0 items-center gap-4 text-caption text-success">
          <Icon icon={CheckCircle} size={16} weight="fill" aria-hidden />
          Faol
        </span>
      ) : (
        <DashedChip size="compact">Tez orada</DashedChip>
      )}
    </div>
  );
}
