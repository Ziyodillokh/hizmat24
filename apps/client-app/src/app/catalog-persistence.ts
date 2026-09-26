import type { ServiceGroup } from '@/mocks/types';

/**
 * Katalog keshi — ilova ochilishi bilan xizmatlar koʻrinsin.
 *
 * Katalog kamdan-kam oʻzgaradi va u maxfiy emas, shuning uchun uni
 * qurilmada saqlash xavfsiz. Buzuq yozuv jimgina tashlanadi: keshdagi
 * yarim maʼlumot bilan ishlashdan koʻra mock katalog yaxshiroq.
 */
const KEY = 'hizmat24:catalog:v1';

/** SOF: saqlangan qiymatni tekshiradi; shakli mos kelmasa `null`. */
export function reviveCatalog(raw: unknown): ServiceGroup[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const groups: ServiceGroup[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) return null;
    const group = item as Partial<ServiceGroup>;
    if (typeof group.id !== 'string' || typeof group.name !== 'string') return null;
    if (typeof group.iconKey !== 'string' || !Array.isArray(group.categories)) return null;

    const categories = group.categories.filter(
      (category) =>
        typeof category === 'object' &&
        category !== null &&
        typeof (category as { id?: unknown }).id === 'string' &&
        typeof (category as { name?: unknown }).name === 'string' &&
        typeof (category as { basePrice?: unknown }).basePrice === 'number',
    );
    /*
     * Boʻsh guruh — HAQIQAT, buzilgan yozuv emas: xizmati hali yoʻq
     * yoʻnalish («Elektrik xizmatlari») ataylab shunday keladi va ilova
     * uni «Tez kunda» deb qulflab koʻrsatadi.
     *
     * Ilgari bunday guruh butun keshni rad etardi (`return null`) va
     * ilova har ochilishda serverdagi katalog oʻrniga ichidagi MOCK
     * roʻyxatni koʻrsatardi — narxlari ham, nomlari ham boshqa.
     *
     * Buzuq yozuv baribir rad etiladi: yuqoridagi tekshiruvlar
     * (id, name, iconKey, categories massiv) oʻz kuchida.
     */

    groups.push({ ...(group as ServiceGroup), categories });
  }

  return groups;
}

export function loadCatalog(): ServiceGroup[] | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? reviveCatalog(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveCatalog(groups: readonly ServiceGroup[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(groups));
  } catch {
    // Kvota toʻlgan boʻlsa katalog har safar serverdan olinadi — ishlaydi.
  }
}
