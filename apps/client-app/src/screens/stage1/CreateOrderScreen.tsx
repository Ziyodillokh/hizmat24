import { Camera } from '@phosphor-icons/react';
import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { StepDots } from '@/components/StepDots';
import { Textarea } from '@/components/Textarea';
import { Toggle } from '@/components/Toggle';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { serviceIcon } from '@/lib/serviceIcons';
import { formatApproxPrice } from '@/lib/formatters';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';

const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 2000;

/**
 * 08 · Buyurtma berish (1-qadam: Muammo tavsifi).
 *
 * Surat biriktirish bloki ikki variantda: MVPʼda butunlay yoʻq, "kelajak"
 * variantida esa bloklangan holatda "Tez orada" yorligʻi bilan — fayl yuklash
 * servisi hali ulanmagan.
 */
export type CreateOrderVariant = 'empty' | 'too-short' | 'valid' | 'max' | 'with-attachments';

export interface CreateOrderScreenProps {
  variant?: CreateOrderVariant;
}

const INITIAL_TEXT: Record<CreateOrderVariant, string> = {
  empty: '',
  'too-short': 'Kran',
  valid: "Oshxonadagi kran oqmoqda, tagida suv toʻplanyapti.",
  max: 'A'.repeat(DESCRIPTION_MAX),
  'with-attachments': "Oshxonadagi kran oqmoqda, tagida suv toʻplanyapti.",
};

/** Variant B — fayl yuklash servisi ulanmagan, blok bloklangan holatda. */
function AttachmentBlock() {
  return (
    <div className="mt-24">
      <p className="text-caption text-text-secondary">Tez orada</p>
      <div className="mt-8 flex gap-12 opacity-[0.4]" aria-disabled>
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-[72px] w-[72px] rounded-xs border border-border bg-surface-sunken"
          />
        ))}
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-xs border border-border bg-surface-sunken">
          <Icon icon={Camera} size={24} className="text-text-secondary" />
        </div>
      </div>
    </div>
  );
}

export function CreateOrderScreen({ variant = 'valid' }: CreateOrderScreenProps) {
  const [description, setDescription] = useState(INITIAL_TEXT[variant]);
  const [isUrgent, setIsUrgent] = useState(false);
  const category = ALL_CATEGORIES[0];

  const isTooShort = description.trim().length > 0 && description.trim().length < DESCRIPTION_MIN;
  const canContinue = description.trim().length >= DESCRIPTION_MIN;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtma berish" />}
      footer={
        <StickyFooter>
          <Button variant="primary" disabled={!canContinue}>
            Davom etish
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={0} />

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
        <Button variant="ghost" size="small" fullWidth={false}>
          Oʻzgartirish
        </Button>
      </Card>

      <h3 className="mt-24 text-h3 text-text-primary">Muammoni tasvirlab bering</h3>

      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength={DESCRIPTION_MAX}
        placeholder="Masalan: oshxonadagi kran oqmoqda…"
        error={isTooShort ? 'Kamida 10 belgi' : undefined}
        className="mt-12"
      />

      {variant === 'with-attachments' && <AttachmentBlock />}

      <div className="mt-24 flex items-start justify-between gap-16">
        <div className="min-w-0 flex-1">
          <p className="text-body-lg text-text-primary">Shoshilinch</p>
          <p className="mt-2 text-body-sm text-text-secondary">
            Usta navbatdan tashqari yuboriladi
          </p>
        </div>
        <Toggle checked={isUrgent} onChange={setIsUrgent} label="Shoshilinch" />
      </div>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
