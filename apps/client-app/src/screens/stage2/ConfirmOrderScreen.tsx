import { Clock, Lightning, Warning, WarningCircle } from '@phosphor-icons/react';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { StepDots } from '@/components/StepDots';
import { MapPreview } from '@/screens/_shared/MapPreview';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { serviceIcon } from '@/lib/serviceIcons';
import { formatApproxPrice } from '@/lib/formatters';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';
import { ORDERS_BY_ID } from '@/mocks/orders';

/**
 * 11 · Buyurtmani tasdiqlash (3-qadam).
 *
 * Buyurtma yaratilgach tahrirlanmaydi (1-boʻlim, 9-qoida), shuning uchun bu
 * ekran — oʻzgartirish mumkin boʻlgan OXIRGI nuqta: har bir xulosa bloki
 * yonida "Oʻzgartirish" turadi va pastda ogohlantiruvchi banner beriladi.
 */
export type ConfirmOrderVariant =
  | 'default'
  | 'submitting'
  | 'server-error'
  | 'rate-limited'
  | 'timeout';

export interface ConfirmOrderScreenProps {
  variant?: ConfirmOrderVariant;
  /** "Shoshilinch" yoqilmagan boʻlsa chip umuman chizilmaydi. */
  isUrgent?: boolean;
  /** Kirish/qavat/xonadon kiritilmagan boʻlsa qatorlar yashiriladi (11-ekran). */
  hasAddressDetails?: boolean;
}

/** 08-ekranda kiritilgan tavsif — 3 satrdan uzun, klipni koʻrsatish uchun. */
const DESCRIPTION =
  "Oshxonadagi kran bir necha kundan beri oqmoqda, tagida suv toʻplanyapti va shkaf ostini namlab yubordi. Ertalab joʻmrakni yopganimda ham tomchilash toʻxtamadi, shuning uchun prokladkani almashtirish kerak deb oʻylayman.";

/**
 * Server matni maketda 2 satrgacha blok sifatida koʻrsatiladi (12.3-band, A qism)
 * va UI tomonidan qayta yozilmaydi.
 */
const SERVER_ERROR_TEXT =
  "Tanlangan xizmat turi hozircha mavjud emas. Iltimos, boshqa xizmat turini tanlang.";

/** Cooldown taymeri — 8.2-banddagi "(00:59)" bilan bir xil shaklda. */
const RETRY_COUNTDOWN = '00:42';

function EditButton() {
  return (
    <Button variant="ghost" size="small" fullWidth={false}>
      Oʻzgartirish
    </Button>
  );
}

/** Manzil tafsiloti qatori: qiymat yoʻq boʻlsa qator butunlay chizilmaydi. */
function AddressDetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="flex items-baseline justify-between gap-12">
      <span className="text-body-sm text-text-secondary">{label}</span>
      <span className="text-body text-text-primary">{value}</span>
    </div>
  );
}

/**
 * Xato bloklari — 12.3-band. Server matni oʻzgartirilmaydi; "Qayta urinish"
 * tugmasi faqat soʻrov vaqti tugagan holatda qoʻyiladi, cooldown holatida esa
 * darhol urinish yangi xato beradi, shuning uchun oʻrniga taymer koʻrsatiladi.
 */
function SubmitError({ variant }: { variant: ConfirmOrderVariant }) {
  if (variant === 'server-error') {
    return (
      <Banner variant="danger" icon={WarningCircle} className="mt-16">
        {SERVER_ERROR_TEXT}
      </Banner>
    );
  }

  if (variant === 'rate-limited') {
    return (
      <Banner variant="danger" icon={WarningCircle} className="mt-16">
        <p>Juda koʻp urinish. Bir oz kuting va qayta urinib koʻring.</p>
        <InfoChip icon={Clock} className="mt-12">
          {RETRY_COUNTDOWN}
        </InfoChip>
      </Banner>
    );
  }

  if (variant === 'timeout') {
    return (
      <Banner variant="danger" icon={WarningCircle} className="mt-16">
        <p>Server javob bermadi. Qayta urinib koʻring.</p>
        <Button variant="secondary" size="small" fullWidth={false} className="mt-12">
          Qayta urinish
        </Button>
      </Banner>
    );
  }

  return null;
}

export function ConfirmOrderScreen({
  variant = 'default',
  isUrgent = true,
  hasAddressDetails = true,
}: ConfirmOrderScreenProps) {
  const category = ALL_CATEGORIES[0];
  const { address } = ORDERS_BY_ID['o-assigned'];
  const isSubmitting = variant === 'submitting';

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtmani tasdiqlash" />}
      footer={
        <StickyFooter>
          {/* Bosilishi bilan DARHOL disabled boʻladi — takroriy buyurtma yaratilmasin. */}
          <Button variant="primary" loading={isSubmitting}>
            Ustani chaqirish
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={2} />

      <h1 className="mt-20 text-h1 text-text-primary">Buyurtmani tasdiqlang</h1>

      {/* 1-blok: xizmat turi + taxminiy narx. */}
      <Card className="mt-20 flex items-center gap-12">
        <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-surface-sunken">
          <Icon icon={serviceIcon(category.iconKey)} size={24} className="text-primary" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-h3 text-text-primary">{category.name}</p>
          <p className="truncate text-body-sm text-text-secondary">
            {formatApproxPrice(category.basePrice)}
          </p>
        </div>
        <EditButton />
      </Card>

      {/* 2-blok: muammo tavsifi — 3 satrdan keyin kesiladi. */}
      <Card className="mt-12 flex items-start gap-12">
        <p className="min-w-0 flex-1 line-clamp-3 text-body text-text-primary">{DESCRIPTION}</p>
        <EditButton />
      </Card>

      {/* 3-blok: manzil — xarita preview, matn va ixtiyoriy qatorlar. */}
      <Card className="mt-12">
        <div className="flex items-start gap-12">
          <p className="min-w-0 flex-1 text-body text-text-primary">{address.label}</p>
          <EditButton />
        </div>

        <div className="mt-12">
          <MapPreview />
        </div>

        {hasAddressDetails && (
          <div className="mt-12 flex flex-col gap-8">
            <AddressDetailRow label="Kirish" value={address.entrance} />
            <AddressDetailRow label="Qavat" value={address.floor} />
            <AddressDetailRow label="Xonadon" value={address.apartment} />
          </div>
        )}
      </Card>

      {/* 4-blok: "Shoshilinch" faqat yoqilgan boʻlsa koʻrinadi. */}
      {isUrgent && (
        <InfoChip icon={Lightning} tone="warning" className="mt-12">
          Shoshilinch
        </InfoChip>
      )}

      <Banner variant="warning" icon={Warning} className="mt-24">
        Buyurtma berilgandan keyin uni tahrirlab boʻlmaydi.
      </Banner>

      <SubmitError variant={variant} />

      <div className="h-24" aria-hidden />
    </ScreenShell>
  );
}
