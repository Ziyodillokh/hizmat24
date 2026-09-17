import { describe, expect, it } from 'vitest';
import { toFlatCategories, toServiceGroup } from './catalog';

const raw = {
  id: 'g-uuid',
  name: 'Santexnika',
  iconKey: 'plumber',
  categories: [
    {
      id: 'c-uuid-1',
      name: 'Rakovina va smesitel',
      description: 'Kran, sifon, oqish',
      basePrice: 100_000,
      currency: 'UZS',
      iconKey: 'tap',
    },
    {
      id: 'c-uuid-2',
      name: 'Boshqa xizmat',
      description: null,
      basePrice: 200_000,
      currency: 'UZS',
      iconKey: null,
    },
  ],
};

describe('toServiceGroup', () => {
  it('server guruhi ilova shakliga oʻgiriladi', () => {
    const group = toServiceGroup(raw);
    expect(group.id).toBe('g-uuid');
    expect(group.categories).toHaveLength(2);
    expect(group.categories[0]).toMatchObject({
      id: 'c-uuid-1',
      iconKey: 'tap',
      name: 'Rakovina va smesitel',
      basePrice: 100_000,
      groupId: 'g-uuid',
    });
  });

  it('kategoriyaning kaliti boʻlmasa guruhnikiga tushadi', () => {
    expect(toServiceGroup(raw).categories[1].iconKey).toBe('plumber');
  });

  it('tavsif yoʻq boʻlsa `null` qoladi — boʻsh satr chizilmaydi', () => {
    expect(toServiceGroup(raw).categories[1].description).toBeNull();
  });
});

describe('toFlatCategories', () => {
  it('guruh nomi har bir xizmatga qoʻshiladi', () => {
    const flat = toFlatCategories([toServiceGroup(raw)]);
    expect(flat).toHaveLength(2);
    expect(flat[0].groupName).toBe('Santexnika');
    expect(flat[1].iconKey).toBe('plumber');
  });

  it('boʻsh roʻyxatda boʻsh massiv', () => {
    expect(toFlatCategories([])).toEqual([]);
  });
});
