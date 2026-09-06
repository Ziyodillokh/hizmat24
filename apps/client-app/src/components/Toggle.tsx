import { cn } from '@/lib/cn';

/**
 * Toggle ("Shoshilinch") — spetsifikatsiya 9.10-bandi.
 * w=52 h=32 radius/full. Off = `border-strong` fon, On = `primary` fon,
 * knob 28px oq + soya. Default holati — o'chiq (08-ekran).
 */
export interface ToggleProps {
  /** Boshqariladigan qiymat. Default `false` — 9.10-band talabi. */
  checked?: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Ilovada yagona toggle shu yorliq bilan keladi (8.2-band jadvali). */
  label?: string;
  className?: string;
}

// Knob soyasi `color/shadow` 20% — bu variant Tailwind elevatsiya tokenlarida
// yo'q, shuning uchun token o'zgaruvchisi orqali beriladi (3.4-band).
// Dark temada soya faqat modal ostidagi overlay uchun ishlatiladi, elevatsiya
// uchun emas (6.3-band; 14.7-band, 54-punkt) — `color/shadow` tokeni ham
// "Dark'da ishlatilmaydi" deb belgilangan, shuning uchun u yerda o'chiriladi.
const KNOB_SHADOW_CLASSES =
  "shadow-[0_1px_2px_rgb(var(--color-shadow)/0.2)] [[data-theme='dark']_&]:shadow-none";

export function Toggle({
  checked = false,
  onChange,
  disabled = false,
  label = 'Shoshilinch',
  className,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex h-32 w-[52px] shrink-0 items-center rounded-full p-2 transition-colors',
        checked ? 'bg-primary' : 'bg-border-strong',
        disabled && 'bg-border-strong/[0.38]',
        className,
      )}
    >
      <span
        className={cn(
          'block h-[28px] w-[28px] rounded-full bg-on-primary-deep transition-transform',
          KNOB_SHADOW_CLASSES,
          checked && 'translate-x-20',
        )}
      />
    </button>
  );
}
