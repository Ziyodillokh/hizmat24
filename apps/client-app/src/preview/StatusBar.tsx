import { BatteryFull, Signal, Wifi } from 'lucide-react';
import { Icon } from '@/components/Icon';
import { useViewportMode } from './viewport';

/**
 * iOS status bar — 7-bo'lim: har bir MAKETA frame'ida 9:41 va signal/wifi/batareya.
 * "9:41" tizim elementi, shuning uchun 24-soatlik format qoidasidan istisno (8.5-band).
 *
 * Haqiqiy qurilmada soxta bar chizilmaydi — telefonning o'zinikisi bor. Uning
 * o'rniga notch ostidagi xavfsiz zona uchun bo'shliq qoldiriladi.
 */
export function StatusBar() {
  const mode = useViewportMode();

  if (mode === 'device') {
    return <div className="shrink-0 pt-safe-top" aria-hidden />;
  }

  return (
    <div className="flex h-status-bar shrink-0 items-end justify-between px-20 pb-8 text-text-primary">
      <span className="text-body-lg font-semibold tabular">9:41</span>
      <div className="flex items-center gap-4">
        <Icon icon={Signal} size={16} />
        <Icon icon={Wifi} size={16} />
        <Icon icon={BatteryFull} size={24} />
      </div>
    </div>
  );
}
