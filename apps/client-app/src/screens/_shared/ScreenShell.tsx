import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { StatusBar } from '@/preview/StatusBar';
import { useViewportMode } from '@/preview/viewport';

/**
 * Ekran karkasi: status bar → kontent → (ixtiyoriy) sticky pastki blok.
 *
 * Gorizontal padding barcha ekranda bir xil — 20px (6.1-band), shuning uchun
 * u shu yerda bir marta beriladi va ekranlarda takrorlanmaydi.
 */
export interface ScreenShellProps {
  /** Header, tab bar kabi to'liq kenglikdagi elementlar — padding'siz. */
  header?: ReactNode;
  /** Ekran ostidagi sticky blok (tugma yoki tab bar). */
  footer?: ReactNode;
  /** Kontent gorizontal padding olmasin (masalan to'liq ekran xarita). */
  bleed?: boolean;
  /**
   * Kontentni vertikal markazga qo'yadi (kirish taklifi kabi qisqa ekranlar).
   *
   * Busiz `main` oddiy blok konteyner bo'lib qoladi va ichkaridagi `flex-1`
   * hech qanday ta'sir qilmaydi — kontent tepaga yopishib, ostida katta
   * bo'sh maydon qolardi.
   */
  center?: boolean;
  children: ReactNode;
  className?: string;
}

export function ScreenShell({
  header,
  footer,
  bleed = false,
  center = false,
  children,
  className,
}: ScreenShellProps) {
  return (
    <div className="flex h-full min-h-full flex-col bg-surface">
      <StatusBar />
      {header}

      {/*
        Scroll shu yerda — ekran karkasida emas. Natijada header (yuqorida) va
        footer/tab bar (pastda) qadalgan holda qoladi.
      */}
      <main
        data-app-scroll
        className={cn(
          'min-h-0 flex-1 overflow-y-auto overscroll-contain',
          !bleed && 'px-20',
          center && 'flex flex-col justify-center',
          className,
        )}
      >
        {children}
      </main>

      {footer}
      <BottomInset />
    </div>
  );
}

/**
 * Ekran ostidagi bo'shliq.
 *
 * Maketa ramkasida u qat'iy 34px (6.1-banddagi home indicator zonasi).
 * Haqiqiy qurilmada esa balandlik modelga qarab har xil — iPhone'da 34px,
 * ko'p Android'da 0px — shuning uchun `env(safe-area-inset-bottom)` ishlatiladi.
 */
export function BottomInset() {
  const mode = useViewportMode();

  return (
    <div
      className={cn('shrink-0', mode === 'device' ? 'pb-safe-bottom' : 'h-home-indicator')}
      aria-hidden
    />
  );
}

/**
 * Ekran ostidagi tugma bloki.
 *
 * `sticky` kerak emas: u scroll konteyneridan (ScreenShell ichidagi `main`)
 * TASHQARIDA turadi, ya'ni allaqachon qadalgan. Xavfsiz zona uchun ham
 * qo'shimcha padding kerak emas — `BottomInset` DOM'da undan keyin keladi.
 */
export function StickyFooter({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 border-t border-border bg-surface px-20 pb-12 pt-16">
      {children}
    </div>
  );
}
