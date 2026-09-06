import { useEffect, useRef, type ReactNode } from 'react';
import { applyTheme } from '@/lib/theme';
import type { ThemeName } from '@/tokens/colors';
import { ViewportProvider } from './viewport';

/**
 * Haqiqiy qurilmada ekranni toʻliq viewport boʻylab chizadi.
 *
 * `100dvh` ataylab: mobil brauzerlarda manzil paneli yigʻilib-ochilganda `100vh`
 * sakraydi va sticky pastki tugma ekran ostidan chiqib ketadi.
 */
export interface DeviceViewProps {
  theme: ThemeName;
  children: ReactNode;
}

export function DeviceView({ theme, children }: DeviceViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) applyTheme(theme, ref.current);
  }, [theme]);

  return (
    <ViewportProvider mode="device">
      {/*
        Ildiz SCROLL QILMAYDI — scroll faqat ekranning kontent qismida boʻladi
        (ScreenShell ichidagi `main`). Shunda header va pastki navigatsiya
        qimirlamay turadi, haqiqiy ilovadagidek.
      */}
      <div ref={ref} className="h-[100dvh] w-full overflow-hidden bg-surface">
        {children}
      </div>
    </ViewportProvider>
  );
}
