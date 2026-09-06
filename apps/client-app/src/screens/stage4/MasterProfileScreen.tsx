import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Header } from '@/components/Header';
import { Skeleton, SkeletonCircle } from '@/components/Skeleton';
import { StarRating } from '@/components/StarRating';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { ORDER_STATUS, isMasterPhoneVisible } from '@/lib/orderStateMachine';
import { MASTERS } from '@/mocks/masters';

/**
 * 27 · Usta profili — READ-ONLY.
 *
 * Sharhlar roʻyxati, narxlar, ish jadvali, portfolio, "kuzatish"/"saqlash"
 * tugmalari YOʻQ. Reyting yonida "N ta baho" ham yozilmaydi
 * (14.1-band, 5–6-punkt).
 */
export type MasterProfileVariant = 'with-phone' | 'without-phone' | 'loading';

export interface MasterProfileScreenProps {
  variant?: MasterProfileVariant;
}

export function MasterProfileScreen({ variant = 'with-phone' }: MasterProfileScreenProps) {
  const master = MASTERS.akmal;

  // Telefon koʻrinishi buyurtma holatiga bogʻliq — profil oʻzi hal qilmaydi.
  const orderStatus =
    variant === 'with-phone' ? ORDER_STATUS.MASTER_EN_ROUTE : ORDER_STATUS.CLOSED;
  const canCall = isMasterPhoneVisible(orderStatus) && Boolean(master.phoneNumber);

  if (variant === 'loading') {
    return (
      <ScreenShell header={<Header variant="inner" title="Usta profili" />}>
        <div className="mt-16 flex flex-col items-center">
          <SkeletonCircle size={120} />
          <Skeleton width={180} height={28} className="mt-16" />
          <Skeleton width={120} height={18} className="mt-8" />
          <Skeleton width={220} height={20} className="mt-16" />
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      header={<Header variant="inner" title="Usta profili" />}
      footer={
        <StickyFooter>
          {canCall ? (
            <Button variant="primary">Qoʻngʻiroq qilish</Button>
          ) : (
            /* Telefon yoʻq boʻlsa tugma disabled EMAS — butunlay yashiriladi. */
            <div className="flex flex-col gap-12">
              <p className="text-center text-body-sm text-text-secondary">
                Ish yakunlangan — savol boʻlsa qoʻllab-quvvatlash xizmatiga murojaat
                qiling
              </p>
              <Button variant="ghost">Qoʻllab-quvvatlashga murojaat</Button>
            </div>
          )}
        </StickyFooter>
      }
    >
      <div className="mt-16 flex flex-col items-center">
        <Avatar name={master.fullName} size={120} />
        <h1 className="mt-16 text-center text-h1 text-text-primary">{master.fullName}</h1>
        <p className="mt-4 text-body text-text-secondary">{master.profession}</p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          <Badge variant={master.experienceLevel === 'EXPERIENCED' ? 'experienced' : 'new'} />
          {master.hasGovCertificate && <Badge variant="certified" />}
        </div>

        <StarRating value={master.ratingAvg} size="md" showValue className="mt-16" />
        <p className="mt-8 text-body text-text-secondary">
          {master.completedOrdersCount} ta buyurtma bajargan
        </p>
      </div>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
