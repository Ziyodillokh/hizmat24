import { BatteryFull, Signal, Wifi } from 'lucide-react';
import { Icon } from '@/components/Icon';
import { useViewportMode } from './viewport';

/**
 * iOS status bar — 7-boʻlim: har bir MAKETA frameʼida 9:41 va signal/wifi/batareya.
 * "9:41" tizim elementi, shuning uchun 24-soatlik format qoidasidan istisno (8.5-band).
 *
 * Haqiqiy qurilmada soxta bar chizilmaydi — telefonning oʻzinikisi bor. Uning
 * oʻrniga notch ostidagi xavfsiz zona uchun boʻshliq qoldiriladi.
 */
export function StatusBar() {
  const mode = useViewportMode();

  if (mode === 'device') {
    return <div className="shrink-0 pt-safe-top" aria-hidden />;
  }

  return (
    <div className="flex h-status-bar shrink-0 items-end justify-between px-20 pb-8 text-text-primary">
      <span className="text-title tabular">9:41</span>
      <div className="flex items-center gap-4">
        <Icon icon={Signal} size={16} />
        <Icon icon={Wifi} size={16} />
        <Icon icon={BatteryFull} size={24} />
      </div>
    </div>
  );
}
