import { useEffect, useState, type ReactNode } from 'react';
import { Spinner } from '@/components/Spinner';

/**
 * 01 · Sessiyani tiklash.
 *
 * Haqiqiy ilova ochilganda darhol kontent chizmaydi: saqlangan sessiya
 * oʻqiladi, native splash yopiladi va shundan keyin ekran koʻrsatiladi.
 * Bu boʻlmasa ilova "web sahifa" kabi keskin paydo boʻladi.
 */
const MIN_SPLASH_MS = 550;

export function AppLaunch({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Minimal koʻrsatish vaqti: sessiya tez oʻqilsa ham ekran "sakramasin".
    // Native splashʼni App.tsx yopadi — u marshrutdan qatʼi nazar ishlaydi.
    // Bu yerda faqat ilova ichidagi ishga tushish ekrani boshqariladi.
    const timer = window.setTimeout(() => setIsReady(true), MIN_SPLASH_MS);

    return () => window.clearTimeout(timer);
  }, []);

  if (isReady) return <>{children}</>;

  return (
    <div className="flex h-full flex-col items-center justify-center bg-surface">
      <p className="text-h1 text-primary">Hizmat24</p>
      <p className="mt-8 text-body-sm text-text-secondary">Ishonchli usta yoningizda</p>
      <Spinner size={32} className="mt-24 text-primary" />
    </div>
  );
}
