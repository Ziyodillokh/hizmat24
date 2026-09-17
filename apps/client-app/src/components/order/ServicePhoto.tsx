import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { serviceIcon } from '@/lib/serviceIcons';
import { SERVICE_IMAGES } from '@/mocks/serviceImages';

/**
 * Xizmat rasmi — butun ilova uchun BITTA qoida.
 *
 * Rasm faqat `SERVICE_IMAGES` da kaliti bor kategoriya uchun (tap, toilet,
 * pipes, water-heater, plumbing-repair); qolganlari ikona bilan. Boshqa
 * kategoriyaning rasmi hech qachon "qarzga" olinmaydi — rasm illyustrativ
 * boʻlsa ham notoʻgʻri xizmatni koʻrsatish yolgʻon.
 */
export interface ServicePhotoProps {
  /**
   * Kategoriya `id` si — chaqiruvchilar uni uzatadi va u shu komponentning
   * shartnomasida qoladi: server ulangach rasm shu `id` boʻyicha emas,
   * `iconKey` boʻyicha topiladi, lekin chaqiruv joylari oʻzgarmaydi.
   */
  serviceId: string;
  iconKey: string;
  /** Rasmsiz kategoriya ikonasi: 84×56 uchun 32, 64×48 uchun 24. */
  iconSize?: 24 | 32;
  /** Oʻlcham va nisbat chaqiruvchidan: `h-[56px] w-[84px]` yoki `aspect-[16/9] w-full`. */
  className: string;
}

export function ServicePhoto({ iconKey, iconSize = 32, className }: ServicePhotoProps) {
  const src = SERVICE_IMAGES[iconKey];

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-sm bg-primary-surface text-accent-water',
        className,
      )}
      aria-hidden
    >
      {src ? (
        <img src={src} alt="" draggable={false} className="h-full w-full object-cover" />
      ) : (
        <Icon icon={serviceIcon(iconKey)} size={iconSize} weight="duotone" />
      )}
    </span>
  );
}
