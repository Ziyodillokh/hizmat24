import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { applyTheme } from '@/lib/theme';
import { ViewportProvider } from './viewport';
import type { ThemeName } from '@/tokens/colors';
import { LAYOUT } from '@/tokens/spacing';

/**
 * Preview qobigʻi: ekranni 393×852 frame ichida koʻrsatadi (7-boʻlim).
 * Har bir frame oʻz temasini mustaqil qoʻllaydi — shuning uchun Dark va Light
 * variantlarni yonma-yon koʻrish mumkin.
 */
export interface PhoneFrameProps {
  theme: ThemeName;
  label?: string;
  children: ReactNode;
}

export function PhoneFrame({ theme, label, children }: PhoneFrameProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) applyTheme(theme, ref.current);
  }, [theme]);

  return (
    <figure className="m-0 flex flex-col items-center gap-12">
      <div
        ref={ref}
        style={{ width: LAYOUT.frameWidth, height: LAYOUT.frameHeight }}
        className="relative overflow-hidden rounded-[44px] bg-surface shadow-e3"
      >
        <ViewportProvider mode="frame">
          <div className="h-full overflow-y-auto">{children}</div>
        </ViewportProvider>
      </div>
      {label && (
        <figcaption className="text-caption text-text-secondary">{label}</figcaption>
      )}
    </figure>
  );
}
