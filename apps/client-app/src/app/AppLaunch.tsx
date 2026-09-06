import { useEffect, useState, type ReactNode } from 'react';
import { Spinner } from '@/components/Spinner';

/**
 * 01 · Sessiyani tiklash.
 *
 * Haqiqiy ilova ochilganda darhol kontent chizmaydi: saqlangan sessiya
 * o'qiladi, native splash yopiladi va shundan keyin ekran ko'rsatiladi.
 * Bu bo'lmasa ilova "web sahifa" kabi keskin paydo bo'ladi.
 */
const MIN_SPLASH_MS = 550;

export function AppLaunch({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Minimal ko'rsatish vaqti: sessiya tez o'qilsa ham ekran "sakramasin".
    // Native splash'ni App.tsx yopadi — u marshrutdan qat'i nazar ishlaydi.
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
