import type { MasterService } from '@/api/masterServices';

/**
 * Ustaning xizmatlari — SOF mantiq.
 *
 * Tanlov ekranda oʻzgaradi va faqat «Saqlash» bosilganda serverga ketadi:
 * har bir belgilashda soʻrov yuborilsa, tarmoq sekin boʻlganda
 * belgilagichlar oʻz-oʻzidan sakrab turardi.
 */

/** Kamida shuncha xizmat yoqilgan boʻlishi kerak — server bilan bir xil. */
export const MIN_ENABLED = 1;

export const enabledIds = (services: readonly MasterService[]): string[] =>
  services.filter((service) => service.isEnabled).map((service) => service.categoryId);

export function toggle(selected: readonly string[], categoryId: string): string[] {
  return selected.includes(categoryId)
    ? selected.filter((id) => id !== categoryId)
    : [...selected, categoryId];
}

/** Saqlash tugmasi nega yopiq; `null` — saqlash mumkin. */
export function saveBlocker(selected: readonly string[]): string | null {
  return selected.length < MIN_ENABLED ? 'Kamida bitta xizmat yoqilgan boʻlsin.' : null;
}

/** Tanlov serverdagi holatdan farq qiladimi — «Saqlash» faqat shunda maʼnoli. */
export function hasChanges(
  services: readonly MasterService[],
  selected: readonly string[],
): boolean {
  const before = new Set(enabledIds(services));
  const after = new Set(selected);

  if (before.size !== after.size) return true;
  return [...after].some((id) => !before.has(id));
}

export interface ServiceGroupBlock {
  groupName: string;
  services: MasterService[];
}

/**
 * Guruhlar boʻyicha ajratadi — roʻyxat uzun boʻlganda skanerlash oson.
 * Guruhsiz xizmatlar oxirida, aniq sarlavha ostida turadi.
 */
export function groupServices(services: readonly MasterService[]): ServiceGroupBlock[] {
  const blocks = new Map<string, MasterService[]>();

  for (const service of services) {
    const key = service.groupName ?? '';
    const list = blocks.get(key);
    if (list) list.push(service);
    else blocks.set(key, [service]);
  }

  return [...blocks.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
    .map(([groupName, list]) => ({
      groupName: groupName || 'Boshqa ishlar',
      services: list,
    }));
}

/** Katalogga yangi qoʻshilgan va usta hali javob bermagan ishlar. */
export const newServices = (services: readonly MasterService[]): MasterService[] =>
  services.filter((service) => service.isNew);
