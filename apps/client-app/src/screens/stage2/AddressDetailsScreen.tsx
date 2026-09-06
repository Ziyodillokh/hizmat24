import { useState } from 'react';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { Textarea } from '@/components/Textarea';
import { MapPreview } from '@/screens/_shared/MapPreview';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { ORDERS_BY_ID } from '@/mocks/orders';

/**
 * 10 · Manzil tafsilotlari (2-qadam davomi).
 *
 * Manzil matni majburiy (1-boʻlim, 10-qoida): kamida 5, koʻpi bilan 300 belgi.
 * Kirish, qavat, xonadon va izoh ixtiyoriy — boʻsh qoldirilgani serverga boʻsh
 * satr sifatida emas, umuman yuborilmaydi.
 */
const ADDRESS_MIN = 5;
const ADDRESS_MAX = 300;
const DETAIL_MAX = 20;
const COMMENT_MAX = 300;

export type AddressDetailsVariant = 'empty' | 'filled' | 'short-address';

export interface AddressDetailsScreenProps {
  variant?: AddressDetailsVariant;
}

interface AddressDraft {
  label: string;
  entrance: string;
  floor: string;
  apartment: string;
  comment: string;
}

const EMPTY_DRAFT: AddressDraft = {
  label: '',
  entrance: '',
  floor: '',
  apartment: '',
  comment: '',
};

const MOCK = ORDERS_BY_ID['o-assigned'].address;

const INITIAL_DRAFT: Record<AddressDetailsVariant, AddressDraft> = {
  empty: EMPTY_DRAFT,
  filled: {
    label: MOCK.label,
    entrance: MOCK.entrance ?? '',
    floor: MOCK.floor ?? '',
    apartment: MOCK.apartment ?? '',
    comment: "Domofon ishlamaydi, telefon qiling",
  },
  // 5 belgidan qisqa manzil — Input `error` holatida.
  'short-address': { ...EMPTY_DRAFT, label: 'Chil' },
};

/**
 * Mock xarita preview foni — haqiqiy xarita kutubxonasi ulanmagan, koʻcha toʻri
 * mavjud tokenlar bilan chiziladi. Bu blok faqat shu ekranga tegishli.
 */
export function AddressDetailsScreen({ variant = 'filled' }: AddressDetailsScreenProps) {
  const [draft, setDraft] = useState<AddressDraft>(INITIAL_DRAFT[variant]);

  // Immutabl yangilanish: har bir oʻzgarish yangi obyekt qaytaradi.
  const update = (field: keyof AddressDraft, value: string): void =>
    setDraft((current) => ({ ...current, [field]: value }));

  const label = draft.label.trim();
  const isTooShort = label.length > 0 && label.length < ADDRESS_MIN;
  const canSave = label.length >= ADDRESS_MIN;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Manzil tafsilotlari" />}
      footer={
        <StickyFooter>
          <Button variant="primary" disabled={!canSave}>
            Saqlash
          </Button>
        </StickyFooter>
      }
    >
      <MapPreview className="mt-20" />

      <Input
        value={draft.label}
        onChange={(event) => update('label', event.target.value)}
        maxLength={ADDRESS_MAX}
        placeholder="Manzil"
        aria-label="Manzil"
        error={isTooShort ? 'Kamida 5 belgi kiriting' : undefined}
        className="mt-20"
      />

      {/* Uch qisqa maydon yonma-yon — barchasi ixtiyoriy, har biri maksimum 20 belgi. */}
      <div className="mt-12 grid grid-cols-3 gap-12">
        <Input
          value={draft.entrance}
          onChange={(event) => update('entrance', event.target.value)}
          maxLength={DETAIL_MAX}
          placeholder="Masalan: 2-kirish"
          aria-label="Kirish"
        />
        <Input
          value={draft.floor}
          onChange={(event) => update('floor', event.target.value)}
          maxLength={DETAIL_MAX}
          placeholder="Qavat"
          aria-label="Qavat"
        />
        <Input
          value={draft.apartment}
          onChange={(event) => update('apartment', event.target.value)}
          maxLength={DETAIL_MAX}
          placeholder="Xonadon"
          aria-label="Xonadon"
        />
      </div>

      <Textarea
        value={draft.comment}
        onChange={(event) => update('comment', event.target.value)}
        maxLength={COMMENT_MAX}
        placeholder="Izoh (ixtiyoriy)"
        aria-label="Izoh (ixtiyoriy)"
        className="mt-12"
      />

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
