import { useState } from 'react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { SelectableChip } from '@/components/SelectableChip';
import { Sheet } from '@/components/Sheet';
import { Textarea } from '@/components/Textarea';
import { EnRouteScreen } from '@/screens/stage3/EnRouteScreen';

const REASON_MIN = 3;
const REASON_MAX = 500;

/** 28-ekrandagi sabab chiplari — 8.2-boʻlim jadvalidan. */
const REASONS = [
  'Fikrimdan qaytdim',
  'Juda uzoq kutdim',
  "Muammo oʻzi hal boʻldi",
  "Narx toʻgʻri kelmadi",
  'Boshqa sabab',
] as const;

const OTHER_REASON = 'Boshqa sabab';

/**
 * 28 · Bekor qilish sababi (bottom sheet).
 *
 * Sabab MAJBURIY (1-boʻlim, 5-qoida): tanlanmaguncha yoki erkin matn 3 belgiga
 * yetmaguncha bekor qilish tugmasi ishlamaydi.
 */
export type CancelReasonVariant = 'empty' | 'selected' | 'other-short' | 'submitting' | 'confirm';

export interface CancelReasonSheetProps {
  variant?: CancelReasonVariant;
}

const INITIAL_REASON: Record<CancelReasonVariant, string | null> = {
  empty: null,
  selected: 'Juda uzoq kutdim',
  'other-short': OTHER_REASON,
  submitting: 'Fikrimdan qaytdim',
  confirm: 'Fikrimdan qaytdim',
};

export function CancelReasonSheet({ variant = 'selected' }: CancelReasonSheetProps) {
  const [reason, setReason] = useState<string | null>(INITIAL_REASON[variant]);
  const [note, setNote] = useState(variant === 'other-short' ? 'Uz' : '');

  const isOther = reason === OTHER_REASON;
  const canSubmit = isOther ? note.trim().length >= REASON_MIN : reason !== null;

  return (
    <div className="relative h-full">
      <EnRouteScreen />

      <Sheet open title="Bekor qilish sababi">
        <div className="flex flex-wrap gap-8">
          {REASONS.map((item) => (
            <SelectableChip
              key={item}
              selected={reason === item}
              onSelect={() => setReason(item)}
            >
              {item}
            </SelectableChip>
          ))}
        </div>

        {/* Erkin matn maydoni faqat "Boshqa sabab" tanlanganda ochiladi. */}
        {isOther && (
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={REASON_MAX}
            placeholder="Sababni yozing"
            error={
              note.trim().length > 0 && note.trim().length < REASON_MIN
                ? 'Kamida 3 belgi'
                : undefined
            }
            className="mt-16"
          />
        )}

        <div className="mt-20 flex flex-col gap-12">
          <Button
            variant="destructive"
            disabled={!canSubmit}
            loading={variant === 'submitting'}
          >
            Bekor qilish
          </Button>
          <Button variant="ghost">Yopish</Button>
        </div>
      </Sheet>

      {/* Tasdiqlash dialogi — bekor qilish qaytarib boʻlmaydigan amal. */}
      <Modal open={variant === 'confirm'} title="Buyurtmani rostdan bekor qilasizmi?">
        <div className="mt-20 flex flex-col gap-12">
          <Button variant="destructive">Ha, bekor qilish</Button>
          <Button variant="ghost">Yoʻq</Button>
        </div>
      </Modal>
    </div>
  );
}
