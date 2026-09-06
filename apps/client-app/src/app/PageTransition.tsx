import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Ekranlar orasidagi oʻtish.
 *
 * Haqiqiy ilovada yangi ekran keskin almashmaydi. Bu yerda yengil fade +
 * pastdan siljish ishlatiladi: u tez (160ms) va navigatsiyani sekinlashtirmaydi,
 * lekin oʻtishni "ilova" qilib koʻrsatadi.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    setIsEntering(true);
    const frame = requestAnimationFrame(() => setIsEntering(false));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div
      className={
        isEntering
          ? 'h-full translate-y-[6px] opacity-0'
          : 'h-full translate-y-0 opacity-100 transition-[opacity,transform] duration-[160ms] ease-out'
      }
    >
      {children}
    </div>
  );
}
