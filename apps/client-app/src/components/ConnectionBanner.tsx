import { Warning } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { Icon } from './Icon';
import { Spinner } from './Spinner';

/**
 * Suzuvchi aloqa banneri — spetsifikatsiya 9.26 va 12.4-bandlari.
 * h=36, toʻliq kenglik, kontentni SURMAYDI — ustidan suzadi.
 * Chapda 16px ikona yoki spinner, matn `body-sm`.
 */
export type ConnectionBannerState = 'reconnecting' | 'stalled';

/**
 * 9.26-band: `stalled` foni — `warning` tokenining 14% shaffofligi.
 *
 * Shaffoflik Tailwindʼning standart `/[0.NN]` modifikatori orqali beriladi:
 * rang tokenlari RGB kanallari sifatida saqlanadi va `rgb(var(--color-x) / <alpha>)`
 * shaklida ochiladi (tokens/colors.ts, tailwind.config.ts). Yangi rang kiritilmaydi (3.4-band).
 */
const STATE_CLASSES: Record<ConnectionBannerState, string> = {
  reconnecting: 'bg-surface-sunken text-text-secondary',
  stalled: 'bg-warning/[0.14] text-warning',
};

const STATE_MESSAGES: Record<ConnectionBannerState, string> = {
  reconnecting: 'Aloqa tiklanmoqda…',
  stalled: 'Yangilanishlar to\'xtadi',
};

export interface ConnectionBannerProps {
  state: ConnectionBannerState;
  /** `stalled` holatida "Yangilash" tugmasi bosilganda chaqiriladi. */
  onRefresh?: () => void;
  className?: string;
}

export function ConnectionBanner({ state, onRefresh, className }: ConnectionBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        // `absolute` — banner kontentni pastga surmaydi (12.4-band).
        'absolute inset-x-0 top-0 z-10 flex h-[36px] items-center gap-8 px-20',
        STATE_CLASSES[state],
        className,
      )}
    >
      {state === 'reconnecting' ? (
        <Spinner size={16} className="text-current" />
      ) : (
        <Icon icon={Warning} size={16} />
      )}
      <span className="truncate text-body-sm">{STATE_MESSAGES[state]}</span>
      {state === 'stalled' && (
        <Button
          variant="ghost"
          size="small"
          fullWidth={false}
          onClick={onRefresh}
          // Ghost tugma banner rangida boʻladi; padding 0 — matn 20px chetga tekislanadi.
          className="ml-auto px-0 text-warning"
        >
          Yangilash
        </Button>
      )}
    </div>
  );
}
