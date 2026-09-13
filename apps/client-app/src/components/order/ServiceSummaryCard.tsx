import { CaretRight } from '@phosphor-icons/react';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { formatApproxPrice } from '@/lib/formatters';
import { serviceIcon } from '@/lib/serviceIcons';
import { SERVICE_IMAGES } from '@/mocks/serviceImages';

/**
 * Tanlangan xizmat — oqimning har qadamida bir xil karta.
 * Rasm illyustrativ (serviceImages.ts); rasmsiz kategoriya soha ikonasi
 * bilan chiziladi. Narx har doim "taxminan" — katalog narxi kafolat emas.
 */
export interface ServiceSummaryCardProps {
  service: { id: string; iconKey: string; name: string };
  /** Berilmasa narx qatori chizilmaydi (chekda summa hisob kartasida). */
  basePrice?: number;
  /** `hero` — tavsif qadamida rasm toʻliq kenglikda 16:9; `compact` — 84×56 miniatyura. */
  size?: 'hero' | 'compact';
  /** Qoʻshimcha satrlar (vaqt, manzil) — faqat mavjud maʼlumot. */
  meta?: readonly string[];
  /** Berilsa "Oʻzgartirish" havolasi (44px teginish nishoni). */
  onChange?: () => void;
  className?: string;
}

function Photo({ service, className }: { service: ServiceSummaryCardProps['service']; className: string }) {
  const src = SERVICE_IMAGES[service.id];
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-sm bg-primary-surface text-accent-water', className)}
      aria-hidden
    >
      {src ? (
        <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
      ) : (
        <Icon icon={serviceIcon(service.iconKey)} size={32} weight="duotone" />
      )}
    </span>
  );
}

function ChangeLink({ onChange }: { onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="-my-8 -mr-8 inline-flex min-h-touch shrink-0 items-center gap-4 whitespace-nowrap px-8 text-body-sm font-semibold text-primary transition-opacity duration-press ease-std active:opacity-70"
    >
      Oʻzgartirish
      <Icon icon={CaretRight} size={14} weight="bold" aria-hidden />
    </button>
  );
}

export function ServiceSummaryCard({
  service, basePrice, size = 'compact', meta = [], onChange, className,
}: ServiceSummaryCardProps) {
  const text = (
    <div className="min-w-0 flex-1">
      <p className="line-clamp-2 text-title text-text-primary">{service.name}</p>
      {basePrice !== undefined && (
        <p className="tabular mt-2 text-body-sm text-text-secondary">{formatApproxPrice(basePrice)}</p>
      )}
      {meta.map((line) => (
        <p key={line} className="mt-2 truncate text-caption text-text-secondary">{line}</p>
      ))}
    </div>
  );

  if (size === 'hero') {
    return (
      <Card className={cn('p-8', className)}>
        <Photo service={service} className="aspect-[16/9] w-full" />
        <div className="flex items-center gap-12 px-8 pb-4 pt-12">
          {text}
          {onChange && <ChangeLink onChange={onChange} />}
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('flex items-center gap-12 p-8', className)}>
      <Photo service={service} className="h-[56px] w-[84px]" />
      {text}
      {onChange && <ChangeLink onChange={onChange} />}
    </Card>
  );
}
