import { describe, expect, it } from 'vitest';
import { reviveCatalog } from './catalog-persistence';

const group = {
  id: 'g1',
  name: 'Santexnika',
  iconKey: 'plumber',
  categories: [{ id: 'c1', iconKey: 'tap', name: 'Rakovina', description: null, groupId: 'g1', basePrice: 100_000 }],
};

describe('reviveCatalog', () => {
  it('toʻgʻri katalog tiklanadi', () => {
    expect(reviveCatalog([group])).toHaveLength(1);
  });

  it('boʻsh yoki massiv boʻlmagan qiymat rad etiladi', () => {
    expect(reviveCatalog([])).toBeNull();
    expect(reviveCatalog(null)).toBeNull();
    expect(reviveCatalog({ groups: [group] })).toBeNull();
  });

  it('maydonsiz guruh butun keshni rad etadi', () => {
    expect(reviveCatalog([{ ...group, iconKey: undefined }])).toBeNull();
    expect(reviveCatalog([{ ...group, name: 42 }])).toBeNull();
  });

  it('xizmatsiz guruh rad etiladi — boʻsh katalog koʻrsatilmaydi', () => {
    expect(reviveCatalog([{ ...group, categories: [] }])).toBeNull();
  });

  it('buzuq xizmat tashlanadi, butuni qoladi', () => {
    const result = reviveCatalog([
      { ...group, categories: [group.categories[0], { id: 'c2' }, null] },
    ]);
    expect(result?.[0].categories).toHaveLength(1);
  });
});
