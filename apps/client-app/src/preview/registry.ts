import type { ComponentType } from 'react';

/**
 * Ekranlar reyestri — preview navigatori shu ro'yxatdan quriladi.
 * Raqamlar spetsifikatsiyaning 11-bo'limidan olinadi va O'ZGARTIRILMAYDI (7-bo'lim).
 */
export interface ScreenEntry {
  /** Spec 11-bo'limidagi raqam: "06", "07a", "12" ... */
  id: string;
  /** Frame nomi uchun o'zbekcha nom. */
  name: string;
  /** Bosqich (13-bo'lim) — navigatorda guruhlash uchun. */
  stage: 1 | 2 | 3 | 4 | 5;
  /** Ekranning holat varianti (masalan "Operator") — ixtiyoriy. */
  variant?: string;
  component: ComponentType;
}

const registry: ScreenEntry[] = [];

export function registerScreens(entries: ScreenEntry[]): void {
  registry.push(...entries);
}

export const getScreens = (): readonly ScreenEntry[] => registry;

export const screenKey = (entry: ScreenEntry): string =>
  entry.variant ? `${entry.id}-${entry.variant.toLowerCase().replace(/\s+/g, '-')}` : entry.id;

export const screenTitle = (entry: ScreenEntry): string =>
  entry.variant ? `${entry.id} · ${entry.name} · ${entry.variant}` : `${entry.id} · ${entry.name}`;
