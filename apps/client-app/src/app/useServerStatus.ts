import { useEffect, useState } from 'react';
import { checkHealth, type HealthState } from '@/api/health';

/**
 * Serverning holati — Profil ekranidagi bitta qator uchun.
 *
 * Tekshiruv ekran ochilganda BIR MARTA boʻladi: davomiy soʻrov yuborish
 * batareyani yeydi va hech qanday savolga javob bermaydi. Foydalanuvchi
 * qayta tekshirmoqchi boʻlsa, ekranni qayta ochadi.
 */
export function useServerStatus(): HealthState | null {
  const [state, setState] = useState<HealthState | null>(null);

  useEffect(() => {
    let alive = true;
    void checkHealth().then((result) => {
      if (alive) setState(result);
    });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
