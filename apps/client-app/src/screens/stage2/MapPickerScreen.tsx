import { LocateFixed, TriangleAlert } from 'lucide-react';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { SearchField } from '@/components/SearchField';
import { Skeleton } from '@/components/Skeleton';
import { Spinner } from '@/components/Spinner';
import { MapPreview } from '@/screens/_shared/MapPreview';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { ORDERS_BY_ID } from '@/mocks/orders';

/**
 * 09 · Xaritada manzil tanlash (2-qadam).
 *
 * Manzil majburiy va ikki qismdan iborat: xarita nuqtasi + matnli manzil
 * (1-bo'lim, 10-qoida). Shuning uchun nuqta tasdiqlanmaguncha "Shu yerda"
 * tugmasi ishlamaydi va matn aniqlanmagan holatda panel shimmer ko'rsatadi.
 *
 * Qadam indikatori bu ekranda chizilmaydi: 11-bo'limdagi "Ko'rinadi" ro'yxatida
 * u yo'q va to'liq ekran xaritada unga joy qolmaydi.
 */
export type MapPickerVariant =
  | 'default'
  | 'map-loading'
  | 'address-loading'
  | 'no-permission'
  | 'error';

export interface MapPickerScreenProps {
  variant?: MapPickerVariant;
}

export function MapPickerScreen({ variant = 'default' }: MapPickerScreenProps) {
  const { address } = ORDERS_BY_ID['o-assigned'];

  const isMapLoading = variant === 'map-loading';
  const isAddressLoading = variant === 'address-loading';
  // Ruxsat yo'q yoki xato bo'lsa tasdiqlanadigan nuqta ham, manzil matni ham yo'q —
  // shuning uchun pin va panel butunlay yashiriladi (bo'sh panel chizilmaydi).
  const isBlocked = variant === 'no-permission' || variant === 'error';

  return (
    <ScreenShell
      bleed
      header={<Header variant="inner" title="Manzilni tanlang" />}
      className="relative overflow-hidden"
    >
      <MapPreview size="full" showPin={!isMapLoading && !isBlocked} />

      {isMapLoading && (
        <>
          <Skeleton width="100%" height="100%" radius="xs" className="absolute inset-0" />
          {/* Spinner faqat to'rt joyda ruxsat etilgan, shulardan biri — 09-ekran xaritasi (12.1-band). */}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary">
            <Spinner size={32} />
          </span>
        </>
      )}


      {!isMapLoading && (
        <div className="absolute left-0 right-0 top-16 px-20">
          <SearchField floating placeholder="Manzilni qidirish" />
        </div>
      )}

      {variant === 'no-permission' && (
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 px-20">
          <Banner variant="warning" icon={TriangleAlert}>
            Joylashuvga ruxsat berilmagan
          </Banner>
          <div className="mt-16 flex flex-col gap-12">
            <Button variant="secondary">Sozlamalarni ochish</Button>
            <Button variant="ghost">Manzilni qo&apos;lda kiritish</Button>
          </div>
        </div>
      )}

      {variant === 'error' && (
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 px-20">
          <Banner variant="danger" icon={TriangleAlert}>
            Xatolik yuz berdi. Birozdan so&apos;ng qayta urinib ko&apos;ring.
          </Banner>
          <Button variant="secondary" className="mt-16">
            Qayta urinish
          </Button>
        </div>
      )}

      {!isMapLoading && !isBlocked && (
        // Tugma va panel bitta pastki ustunda: shunda tugma paneldan 16px yuqorida
        // turadi va joylashuvi shkaladan tashqari qiymatga bog'lanmaydi.
        <div className="absolute bottom-0 left-0 right-0">
          <div className="flex justify-end px-20 pb-16">
            {/* Dumaloq 48px tugma — matn yorlig'i faqat ekran o'quvchisi uchun (8.2-jadval). */}
            <button
              type="button"
              aria-label="Mening joylashuvim"
              className="flex h-48 w-48 items-center justify-center rounded-full border border-border bg-surface-raised shadow-e2 transition-transform active:scale-[0.98]"
            >
              <Icon icon={LocateFixed} size={24} className="text-primary" />
            </button>
          </div>

          <section className="rounded-t-xl bg-surface-modal p-20 shadow-e3">
            {isAddressLoading ? (
              // Manzil aniqlanmoqda — panel tuzilishi o'zgarmaydi, faqat matn o'rnida shimmer.
              <div className="flex h-24 items-center">
                <Skeleton width="80%" height={16} />
              </div>
            ) : (
              <p className="text-body-lg text-text-primary">{address.label}</p>
            )}
            <Button variant="primary" disabled={isAddressLoading} className="mt-16">
              Shu yerda
            </Button>
          </section>
        </div>
      )}
    </ScreenShell>
  );
}
