import { useEffect, useRef } from 'react';
import { simulationStep, simulationTimerKey, waitMsFor } from '@/lib/orderSimulation';
import type { LiveOrder } from './types';

/**
 * Server oʻtishlarini taqlid qiladigan taymerlar.
 *
 * `store.tsx` dan ajratildi: fayl 500 qator chegarasiga tiralgan edi va
 * taymer mashinasi «qaysi buyurtma qachon oʻzi siljiydi» degan mustaqil
 * savol. Qaror qabul qilish shu yerda EMAS — u sof `simulationStep` da.
 *
 * Effekt faqat qoʻshmaydi, balki keraksiz boʻlib qolgan taymerlarni BEKOR
 * qiladi: smena ochilgan zahoti 3,5 soniyalik eski taymer ustaning
 * taklifini roʻyxatdan uchirib yuborardi.
 */
export function useOrderTimers(
  orders: readonly LiveOrder[],
  masterTakeover: boolean,
  applyServerStep: (orderId: string, status: LiveOrder['status']) => void,
): void {
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    const wanted = new Map<string, { order: LiveOrder; delayMs: number }>();
    for (const order of orders) {
      const step = simulationStep(order, masterTakeover);
      if (step) wanted.set(simulationTimerKey(order), { order, delayMs: step.delayMs });
    }

    const pending = timers.current;
    for (const [key, handle] of [...pending]) {
      if (wanted.has(key)) continue;
      window.clearTimeout(handle);
      pending.delete(key);
    }

    const now = new Date();
    for (const [key, { order, delayMs }] of wanted) {
      if (pending.has(key)) continue;

      const handle = window.setTimeout(() => {
        pending.delete(key);
        applyServerStep(order.id, order.status);
      }, waitMsFor(order, delayMs, now));

      pending.set(key, handle);
    }
  }, [orders, masterTakeover, applyServerStep]);

  // Komponent yoʻq qilinganda barcha taymerlar tozalanadi.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((handle) => window.clearTimeout(handle));
      pending.clear();
    };
  }, []);
}
