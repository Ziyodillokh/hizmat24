import { useEffect, useRef, useState } from 'react';
import { idleState, type IdleState } from '@/lib/idle';

/** Faollik deb sanaladigan hodisalar — sichqoncha, klaviatura, aylantirish. */
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
const TICK_MS = 1000;

/**
 * Faolsizlikda avtomatik chiqish.
 *
 * Hisob SOATGA tayanadi, taymer tiklariga emas: noutbuk yopilib turganda
 * `setInterval` toʻxtaydi va tiklarni sanagan versiya uyqudan keyin ham
 * "hali vaqt bor" deb turaverardi.
 *
 * Server ham shu chegarani oʻzi tekshiradi — bu yerdagi hisob faqat
 * OLDINDAN ogohlantirish uchun.
 */
export function useIdleLogout(
  timeoutSeconds: number,
  onExpire: () => void,
): IdleState {
  const lastActivityRef = useRef(Date.now());
  const [state, setState] = useState<IdleState>(() => ({
    phase: 'active',
    secondsLeft: timeoutSeconds,
  }));
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const markActive = () => {
      lastActivityRef.current = Date.now();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, markActive, { passive: true });
    }

    const timer = window.setInterval(() => {
      const next = idleState(lastActivityRef.current, Date.now(), timeoutSeconds);
      setState(next);
      if (next.phase === 'expired') onExpireRef.current();
    }, TICK_MS);

    return () => {
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, markActive);
      window.clearInterval(timer);
    };
  }, [timeoutSeconds]);

  return state;
}
