import type { ReactNode } from 'react';
import { Check, ShieldAlert } from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { StarRating } from '@/components/StarRating';
import { StatusBar } from '@/preview/StatusBar';
import { BottomInset } from '@/screens/_shared/ScreenShell';
import { ORDERS_BY_ID } from '@/mocks/orders';

/**
 * 16 · Ustani tasdiqlang — BLOKLOVCHI EKRAN.
 *
 * Ataylab boshqa ekranlarga oʻxshamaydi: stepper yoʻq, banner-hero yoʻq,
 * dekorativ rasm yoʻq, butun fon neytral `surface`. Bu foydalanuvchiga
 * "bu boshqa narsa, diqqat qiling" signalini beradi.
 *
 * Bu ekranda BEKOR QILISH TUGMASI YOʻQ va orqaga qaytish yopilgan —
 * bu holatda bekor qilish tizim darajasida taqiqlangan (1-boʻlim, 4-qoida).
 */
export type ConfirmMasterVariant = 'default' | 'confirming';

export interface ConfirmMasterScreenProps {
  variant?: ConfirmMasterVariant;
}

/**
 * Verifikatsiya chipi — 16-bandda AYNAN shu koʻrinishda taʼriflangan
 * (success 12% fon, 14px check). 9.12-dagi `Badge` bu yerda mos kelmaydi:
 * u "Sertifikatli" ni `primary` tusida chizadi. Shuning uchun bu ekranga xos
 * kichik blok — kutubxonaga yangi komponent qoʻshilmaydi (14.7-band, 58-punkt).
 */
function VerificationChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[28px] items-center gap-4 rounded-full bg-success/[0.12] px-12 text-caption text-success">
      <Icon icon={Check} size={14} />
      {children}
    </span>
  );
}

export function ConfirmMasterScreen({ variant = 'default' }: ConfirmMasterScreenProps) {
  const order = ORDERS_BY_ID['o-arrived'];
  const master = order.master;

  if (!master) return null;

  return (
    <div className="flex h-full min-h-full flex-col bg-surface">
      <StatusBar />

      <main className="flex flex-1 flex-col items-center px-20 pt-24">
        <Avatar name={master.fullName} size={120} className="ring-[3px] ring-primary" />

        <h1 className="mt-16 text-center text-h1 text-text-primary">{master.fullName}</h1>
        <p className="mt-4 text-body text-text-secondary">{master.profession}</p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          {master.experienceLevel === 'EXPERIENCED' && (
            <VerificationChip>Tajribali</VerificationChip>
          )}
          {master.hasGovCertificate && <VerificationChip>Sertifikatli</VerificationChip>}
        </div>

        <div className="mt-12 flex items-center gap-12">
          <StarRating value={master.ratingAvg} size="md" showValue />
          <span className="text-body-sm text-text-secondary">
            {master.completedOrdersCount} ta buyurtma bajargan
          </span>
        </div>

        <Banner variant="warning" icon={ShieldAlert} className="mt-24 w-full">
          Kelgan odam suratdagi ustaga oʻxshamasa — «Yoʻq, bu boshqa odam» tugmasini
          bosing.
        </Banner>
      </main>

      {/*
        Ikkala tugma VERTIKAL, bir xil oʻlchamda (h=56) va bir xil vizual
        ogʻirlikda. "Yoʻq" hech qachon kichik, kulrang yoki matnli havola
        koʻrinishida boʻlmaydi — dark pattern taqiqlanadi (14.3-band, 60-punkt).
      */}
      <div className="shrink-0 px-20 pb-12 pt-24">
        <div className="flex flex-col gap-12">
          <Button variant="primary" loading={variant === 'confirming'} className="h-[56px]">
            Ha, shu usta
          </Button>
          <Button variant="destructive-outline" className="h-[56px]">
            Yoʻq, bu boshqa odam
          </Button>
        </div>
      </div>

      <BottomInset />
    </div>
  );
}
