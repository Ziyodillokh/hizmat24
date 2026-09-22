import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchServiceAreas } from '@/api/catalog';
import { isApiEnabled } from '@/api/client';
import { FALLBACK_CITY } from '@/lib/serviceArea';

/**
 * Platforma ishlaydigan shahar — ilovadagi YAGONA manba.
 *
 * Qiymat serverdan keladi. Server javob bermaguncha zaxira nom
 * koʻrsatiladi: bu toʻqilgan maʼlumot EMAS — platforma hozir haqiqatan
 * faqat Namangan shahrida ishlaydi va zaxira oʻsha shaharni aytadi.
 * Server boshqa shaharni aytsa, ekran darhol unga oʻtadi.
 */
const ServiceCityContext = createContext<string>(FALLBACK_CITY);

export const useServiceCity = (): string => useContext(ServiceCityContext);

export function ServiceAreaProvider({ children }: { children: ReactNode }) {
  const [city, setCity] = useState(FALLBACK_CITY);

  useEffect(() => {
    if (!isApiEnabled()) return;

    let alive = true;
    void fetchServiceAreas()
      .then((areas) => {
        // Boʻsh roʻyxat — hudud sozlanmagan. Zaxira nom ekranda qoladi:
        // shaharsiz manzil qadami umuman ishlamasdi.
        if (!alive || areas.length === 0) return;
        setCity(areas[0].cityName);
      })
      .catch(() => {
        // Zaxira nom qoladi — ekranda boʻsh joy paydo boʻlmaydi.
      });

    return () => {
      alive = false;
    };
  }, []);

  return <ServiceCityContext.Provider value={city}>{children}</ServiceCityContext.Provider>;
}
