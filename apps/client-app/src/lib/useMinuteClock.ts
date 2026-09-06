import { useEffect, useState } from 'react';

/**
 * Har daqiqaning boshida yangilanadigan soat.
 *
 * Nega kerak: "Ochiq/Yopiq" holati render paytidagi vaqtdan hisoblanadi.
 * Agar vaqt bir marta olinsa, ekran ochiq turganda doʻkon yopilgan boʻlsa ham
 * "Ochiq" deb turaverardi — foydalanuvchi yopiq doʻkonga borib qolishi mumkin.
 *
 * `setInterval(60_000)` emas, keyingi daqiqa boshigacha `setTimeout`:
 * intervalda yangilanish daqiqa oʻrtasiga siljib ketadi va soat koʻrsatkichi
 * bir necha soniyaga kechikadi.
 */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer: number;

    const scheduleNextTick = () => {
      const current = new Date();
      const msToNextMinute =
        60_000 - (current.getSeconds() * 1000 + current.getMilliseconds());

      timer = window.setTimeout(() => {
        setNow(new Date());
        scheduleNextTick();
      }, msToNextMinute);
    };

    scheduleNextTick();
    return () => window.clearTimeout(timer);
  }, []);

  return now;
}
