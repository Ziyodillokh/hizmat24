import { WifiSlash, Wrench } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { ServiceCard } from '@/components/ServiceCard';
import { Skeleton, SkeletonCircle } from '@/components/Skeleton';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { serviceIcon } from '@/lib/serviceIcons';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';

/**
 * 02 · Kirish taklifi.
 *
 * Login majburiy, lekin xizmat turlari roʻyxati narxlari bilan loginʼsiz ham
 * koʻrinadi (1-boʻlim, 14-qoida) — shuning uchun roʻyxat bu ekranda qisqartirilgan
 * shaklda chiziladi. Roʻyxatdagi istalgan element bosilsa ham telefon ekraniga
 * oʻtiladi — bu yerdan toʻgʻridan-toʻgʻri buyurtma berib boʻlmaydi.
 */
export type OnboardingVariant = 'ready' | 'loading' | 'error';

export interface OnboardingScreenProps {
  variant?: OnboardingVariant;
}

/** Qisqartirilgan koʻrinish — birinchi 4 ta xizmat, server tartibida. */
const PREVIEW_COUNT = 4;
const SKELETON_ROWS = 4;

/** Roʻyxat yuklanishida faqat skeleton ishlatiladi, spinner emas (12.1-band). */
function ServiceListSkeleton() {
  return (
    <ul className="flex flex-col gap-12">
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <li key={index} className="flex items-center gap-12 rounded-lg bg-surface-elevated p-16">
          <SkeletonCircle size={44} />
          <div className="flex-1">
            <Skeleton width="55%" height={18} />
            <Skeleton width="35%" height={14} className="mt-8" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function OnboardingScreen({ variant = 'ready' }: OnboardingScreenProps) {
  const services = ALL_CATEGORIES.slice(0, PREVIEW_COUNT);

  // Internet yoʻq holatida ekranni toʻliq offline bloki egallaydi (12.3-band, B):
  // yagona amal "Qayta urinish", shuning uchun "Davom etish" sticky tugmasi ham chizilmaydi.
  if (variant === 'error') {
    return (
      <ScreenShell className="flex flex-col">
        <EmptyState
          icon={WifiSlash}
          title="Internetga ulanish yoʻq"
          action={{ label: 'Qayta urinish', onClick: () => undefined }}
        />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      footer={
        <StickyFooter>
          <Button variant="primary">Davom etish</Button>
        </StickyFooter>
      }
    >
      {/* Qisqa illyustratsiya — bitta outline ikona oilasi (6.4-band). */}
      <div className="flex justify-center pt-32">
        <Icon icon={Wrench} size={96} className="text-primary" aria-hidden />
      </div>

      <h1 className="mt-24 text-h1 text-text-primary">Ishonchli ustani 15 daqiqada toping</h1>
      <p className="mt-12 text-body text-text-secondary">
        Buyurtma bering — ustani tizim tayinlaydi.
      </p>

      <h2 className="mt-32 text-h2 text-text-primary">Xizmat turlari</h2>

      <div className="mt-16 pb-bottom-reserve">
        {variant === 'loading' ? (
          <ServiceListSkeleton />
        ) : (
          <ul className="flex flex-col gap-12">
            {services.map((category) => (
              <li key={category.id}>
                <ServiceCard
                  name={category.name}
                  description={category.description}
                  price={category.basePrice}
                  icon={serviceIcon(category.iconKey)}
                  onSelect={() => undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </ScreenShell>
  );
}
