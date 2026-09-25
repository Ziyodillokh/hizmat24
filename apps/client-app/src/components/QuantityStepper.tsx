import { Minus, Plus } from '@phosphor-icons/react';
import { MAX_QUANTITY } from '@/lib/pricing';

/**
 * Miqdor tanlagich — «nechta kerak?».
 *
 * Bitta ish bir nechta joyda boʻlishi mumkin: masalan ikkita quvurni
 * tozalash. Ilgari bunda mijoz ikki marta buyurtma berishga majbur
 * edi va ikkita usta chiqib qolardi.
 *
 * Chegara `MAX_QUANTITY` — server ham aynan shuni tekshiradi.
 */
export function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const step = (delta: number) => {
    const next = value + delta;
    if (next < 1 || next > MAX_QUANTITY) return;
    onChange(next);
  };

  return (
    <div className="flex items-center gap-4 rounded-full border border-border p-4">
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= 1}
        aria-label="Bittaga kamaytirish"
        className="flex size-32 items-center justify-center rounded-full text-text-primary disabled:text-text-disabled"
      >
        <Minus size={16} weight="bold" aria-hidden />
      </button>

      <span
        aria-live="polite"
        aria-label={`Miqdor: ${value}`}
        className="min-w-24 text-center text-body-strong tabular-nums text-text-primary"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= MAX_QUANTITY}
        aria-label="Bittaga koʻpaytirish"
        className="flex size-32 items-center justify-center rounded-full text-text-primary disabled:text-text-disabled"
      >
        <Plus size={16} weight="bold" aria-hidden />
      </button>
    </div>
  );
}
