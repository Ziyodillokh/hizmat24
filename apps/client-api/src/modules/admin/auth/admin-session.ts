/**
 * Admin sessiyasining umri — SOF mantiq.
 *
 * Mijoz tokeni MUDDAT boʻyicha oʻladi, admin sessiyasi esa FAOLSIZLIK
 * boʻyicha: ochiq qoldirilgan panel yarim soatdan keyin oʻzi yopiladi.
 * Ofisdagi qulflanmagan kompyuter — panelga kirishning eng oson yoʻli.
 */
export interface SessionState {
  lastSeenAt: Date;
  revokedAt: Date | null;
}

/**
 * Har soʻrovda `lastSeenAt` yozilsa, baza sekundiga oʻnlab UPDATE oladi va
 * har biri WAL ga tushadi. Bir daqiqalik aniqlik yetarli: 30 daqiqalik
 * chegara uchun bu 3% xato.
 */
export const TOUCH_INTERVAL_MS = 60 * 1000;

export const isSessionAlive = (session: SessionState, now: Date, ttlMs: number): boolean =>
  session.revokedAt === null && now.getTime() - session.lastSeenAt.getTime() < ttlMs;

export const shouldTouch = (lastSeenAt: Date, now: Date): boolean =>
  now.getTime() - lastSeenAt.getTime() >= TOUCH_INTERVAL_MS;

/** Frontendga qaytadigan qiymat: ogohlantirish taymeri shu sondan quriladi. */
export const secondsUntilIdleLogout = (
  session: SessionState,
  now: Date,
  ttlMs: number,
): number => Math.max(0, Math.ceil((session.lastSeenAt.getTime() + ttlMs - now.getTime()) / 1000));
