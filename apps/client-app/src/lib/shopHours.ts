/**
 * Doʻkon ish vaqti mantigʻi.
 *
 * Mock fayldan alohida: bu biznes qoidasi, maʼlumot emas. Backend ulanganda
 * fixturalar yoʻqoladi, bu funksiya esa qoladi.
 */
export interface OpenHours {
  /** Ochilish soati, mahalliy vaqt. */
  openFrom: number;
  /** Yopilish soati. `openFrom` dan kichik boʻlsa — yarim tundan oshadi. */
  openTo: number;
}

/**
 * Doʻkon shu daqiqada ochiqmi.
 *
 * Yarim tundan oshadigan ish vaqti (masalan 22:00-06:00) alohida qaraladi:
 * oddiy `hour >= from && hour < to` sharti bunday doʻkonni HAR DOIM yopiq
 * deb koʻrsatardi.
 */
export function isOpenNow(hours: OpenHours, now: Date): boolean {
  const hour = now.getHours();
  return hours.openTo > hours.openFrom
    ? hour >= hours.openFrom && hour < hours.openTo
    : hour >= hours.openFrom || hour < hours.openTo;
}

/** "08:00 – 20:00" koʻrinishidagi ish vaqti. */
export function formatOpenHours(hours: OpenHours): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(hours.openFrom)}:00 – ${pad(hours.openTo)}:00`;
}
