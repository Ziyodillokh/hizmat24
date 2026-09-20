/**
 * Faolsizlik hisobi — SOF mantiq, taymersiz va DOMsiz.
 *
 * Server sessiyani `lastSeenAt` + TTL boʻyicha oʻldiradi. Panel shu
 * hisobni TAKRORLAYDI, lekin oʻzi hukm chiqarmaydi: uning vazifasi —
 * oldindan ogohlantirish. Yagona haqiqat serverda qoladi, aks holda
 * ikki soat oldin ochilgan ikkita oyna bir-biriga zid javob berardi.
 */

/** Shuncha soniya qolganda ogohlantirish koʻrsatiladi. */
export const WARNING_THRESHOLD_SECONDS = 120;

export type IdlePhase = 'active' | 'warning' | 'expired';

export interface IdleState {
  phase: IdlePhase;
  secondsLeft: number;
}

export function idleState(
  lastActivityAt: number,
  now: number,
  timeoutSeconds: number,
): IdleState {
  const elapsed = Math.floor((now - lastActivityAt) / 1000);
  const secondsLeft = Math.max(0, timeoutSeconds - elapsed);

  if (secondsLeft === 0) return { phase: 'expired', secondsLeft: 0 };
  if (secondsLeft <= WARNING_THRESHOLD_SECONDS) return { phase: 'warning', secondsLeft };

  return { phase: 'active', secondsLeft };
}

/** "1:59" — ogohlantirishdagi hisob. */
export function formatCountdown(secondsLeft: number): string {
  const safe = Math.max(0, Math.floor(secondsLeft));
  const minutes = Math.floor(safe / 60);
  return `${minutes}:${String(safe % 60).padStart(2, '0')}`;
}
