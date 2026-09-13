import { describe, expect, it } from 'vitest';
import { findGroup } from './serviceGroups';
import { serviceIcon } from '@/lib/serviceIcons';

/**
 * Bosh sahifa santexnika guruhining birinchi BESH xizmatini koʻrsatadi —
 * tartib va nomlar egasining maketidan. Bu test roʻyxatning jimgina
 * oʻzgarib ketishidan himoya qiladi.
 */
describe('g-plumbing', () => {
  const group = findGroup('g-plumbing');

  it('yettita xizmat, birinchi beshtasi maketdagi tartibda', () => {
    expect(group?.categories).toHaveLength(7);
    expect(group?.categories.slice(0, 5).map((c) => c.name)).toEqual([
      'Santexnika taʼmiri',
      'Suv isitgich xizmatlari',
      'Unitaz va kanalizatsiya',
      'Rakovina va smesitel',
      'Quvurlarni oʻrnatish',
    ]);
  });

  it('eski idlar saqlangan — hamyon seedlari ularga bogʻlangan', () => {
    const ids = new Set(group?.categories.map((c) => c.id));
    for (const id of ['c-tap', 'c-toilet', 'c-drain', 'c-heating']) expect(ids.has(id)).toBe(true);
  });

  it('har bir iconKey jadvalda bor — zaxira gaykaga tushmaydi', () => {
    const fallback = serviceIcon('__yoq__');
    for (const category of group?.categories ?? []) {
      expect(serviceIcon(category.iconKey ?? '__yoq__')).not.toBe(fallback);
    }
  });

  it('narxlar bir-biridan farq qiladi', () => {
    const prices = group?.categories.map((c) => c.basePrice) ?? [];
    expect(new Set(prices).size).toBe(prices.length);
  });
});
