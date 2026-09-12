import { Briefcase, House, Info, MapPin, Plus } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { addressDetailsLine } from '@/lib/address';
import { cn } from '@/lib/cn';
import { formatDayLabel } from '@/lib/formatters';
import {
  ADDRESS_KIND_LABELS,
  ADDRESS_LIMIT,
  addressTitle,
  type AddressKind,
  type SavedAddress,
} from '@/lib/savedAddress';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { useAddresses } from '../address-store';

/**
 * Manzillarim.
 *
 * Bu sahifa bitta aniq ishni tejaydi: bugun har bir buyurtmada manzil
 * qoʻldan yoziladi. Boshqa hech narsa vaʼda qilmaydi — koordinata yoʻq,
 * shuning uchun masofa, ETA va "eng yaqin usta" haqida bir soʻz ham
 * yozilmaydi.
 */
export const ADDRESS_KIND_ICONS: Record<AddressKind, IconGlyph> = {
  home: House,
  work: Briefcase,
  other: MapPin,
};

/**
 * Tur chipi — FAQAT nom berilgan boʻlsa.
 *
 * Nom boʻsh boʻlganda sarlavha allaqachon tur yorligʻi ("Uy"), shuning
 * uchun chip aynan shu soʻzni ikkinchi marta takrorlardi.
 */
export function kindChipFor(saved: SavedAddress) {
  if (!saved.name.trim()) return undefined;
  return <InfoChip tone="neutral">{ADDRESS_KIND_LABELS[saved.kind]}</InfoChip>;
}

/** Manzil qatori. Ikkala amal ham haqiqiy: tahrirlash va oʻchirish. */
export function AddressRow({
  saved,
  now,
  onSelect,
  action,
  className,
}: {
  saved: SavedAddress;
  now: Date;
  onSelect: () => void;
  /** Oʻng tomondagi belgi — tanlangan holat yoki qoʻshimcha ishora. */
  action?: React.ReactNode;
  className?: string;
}) {
  const details = addressDetailsLine(saved.address);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-12 rounded-lg p-12 text-left',
        'border border-transparent bg-surface-elevated shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        'transition-transform duration-press ease-std active:scale-[0.99]',
        className,
      )}
    >
      <span
        className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md bg-surface-sunken"
        aria-hidden
      >
        <Icon icon={ADDRESS_KIND_ICONS[saved.kind]} size={20} className="text-primary" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-8">
          <span className="min-w-0 flex-1 text-title text-text-primary">
            {addressTitle(saved)}
          </span>
          {action}
        </span>
        <span className="mt-2 block text-body-sm text-text-secondary">
          {saved.address.label}
        </span>
        {details && (
          <span className="mt-2 block text-caption text-text-secondary">{details}</span>
        )}
        {/*
          "Oxirgi marta ishlatilgan" — HAQIQIY qiymat, buyurtma berilganda
          yoziladi. Ishlatilmagan manzilda qator umuman chizilmaydi: "hech
          qachon" yozuvi hech narsa bermaydi.
        */}
        {saved.lastUsedAt && (
          <span className="mt-8 block text-caption text-text-secondary">
            Oxirgi buyurtma: {formatDayLabel(saved.lastUsedAt, now)}
          </span>
        )}
      </span>
    </button>
  );
}

export function AddressBookScreen() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { addresses, isFull } = useAddresses();

  return (
    <ScreenShell
      header={<Header variant="inner" title="Manzillarim" onBack={() => navigate(-1)} />}
      footer={
        addresses.length > 0 ? (
          <StickyFooter>
            <div className="flex flex-col gap-12">
              <Button
                variant="primary"
                leadingIcon={Plus}
                disabled={isFull}
                onClick={() => navigate('/app/addresses/new')}
              >
                Yangi manzil
              </Button>
              {/* Tugma oʻchirilgan boʻlsa SABAB aytiladi. */}
              {isFull && (
                <p className="text-center text-body-sm text-text-secondary">
                  {ADDRESS_LIMIT} ta manzil saqlangan — yangisini qoʻshish uchun birini
                  oʻchiring.
                </p>
              )}
            </div>
          </StickyFooter>
        ) : undefined
      }
    >
      {addresses.length === 0 ? (
        <>
          <EmptyState
            inline
            className="mt-24"
            icon={MapPin}
            title="Manzil saqlanmagan"
            description="Saqlangan manzil buyurtma berishda bir bosishda tanlanadi"
            action={{ label: 'Manzil qoʻshish', onClick: () => navigate('/app/addresses/new') }}
          />
          {/* Uzun tushuntirish `description` da emas: u ikki satrdan keyin kesiladi. */}
          <Banner variant="info" icon={Info} className="mt-20">
            Manzil faqat yozishni tejaydi. Ilovada xarita yoʻq, shuning uchun saqlangan manzil
            masofa yoki yetib kelish vaqtini hisoblashda ishlatilmaydi.
          </Banner>
        </>
      ) : (
        <>
          <p className="mt-4 text-body text-text-secondary">
            Buyurtma berishda shu roʻyxatdan tanlaysiz. Oxirgi ishlatilgan manzil yuqorida
            turadi.
          </p>

          <ul className="mt-20 flex flex-col gap-8">
            {addresses.map((item) => (
              <li key={item.id}>
                <AddressRow
                  saved={item}
                  now={now}
                  onSelect={() => navigate(`/app/addresses/${item.id}`)}
                  action={kindChipFor(item)}
                />
              </li>
            ))}
          </ul>

          <p className="mt-16 px-4 text-caption text-text-secondary">
            Manzillar faqat shu qurilmada saqlanadi. Ilovadan chiqsangiz oʻchiriladi.
          </p>
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
