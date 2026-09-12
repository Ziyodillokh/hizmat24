import { describe, expect, it } from 'vitest';
import { reviveFavorites, serializeFavorites } from './favorites-persistence';
import type { FavoriteEntry } from '@/lib/favorites';

const NOW = new Date(2026, 8, 12, 14, 30);

const entry = (masterId: string, addedAt: Date = NOW): FavoriteEntry => ({ masterId, addedAt });

describe('serializeFavorites / reviveFavorites', () => {
  it('borish va qaytish maʼlumotni yoʻqotmaydi', () => {
    const result = reviveFavorites(JSON.parse(JSON.stringify(serializeFavorites([entry('m-a')]))));
    expect(result).toHaveLength(1);
    expect(result?.[0].masterId).toBe('m-a');
    expect(result?.[0].addedAt.getTime()).toBe(NOW.getTime());
  });

  it('`addedAt` `Date` boʻlib qaytadi — satr emas', () => {
    const result = reviveFavorites(serializeFavorites([entry('m-a')]));
    expect(result?.[0].addedAt).toBeInstanceOf(Date);
  });

  it('tartib saqlanadi — tartiblash `sortFavorites` ning ishi', () => {
    const older = new Date(2026, 8, 1);
    const result = reviveFavorites(serializeFavorites([entry('m-a', older), entry('m-b')]));
    expect(result?.map((item) => item.masterId)).toEqual(['m-a', 'm-b']);
  });
});

describe('reviveFavorites — buzuq maʼlumot', () => {
  it('massiv boʻlmasa null', () => {
    expect(reviveFavorites(null)).toBeNull();
    expect(reviveFavorites({ masterId: 'm-a' })).toBeNull();
  });

  it('boʻsh massivda null', () => {
    expect(reviveFavorites([])).toBeNull();
  });

  it('id boʻlmagan yozuv tushib qoladi, qolgani saqlanadi', () => {
    const result = reviveFavorites([
      { masterId: '', addedAt: NOW.toISOString() },
      { addedAt: NOW.toISOString() },
      ...serializeFavorites([entry('m-b')]),
    ]);
    expect(result).toHaveLength(1);
    expect(result?.[0].masterId).toBe('m-b');
  });

  it('buzuq sana yozuvni tashlaydi', () => {
    expect(reviveFavorites([{ masterId: 'm-a', addedAt: 'yoʻq' }])).toBeNull();
  });

  it('takroriy usta ikkinchi marta olinmaydi', () => {
    const result = reviveFavorites(serializeFavorites([entry('m-a'), entry('m-a')]));
    expect(result).toHaveLength(1);
  });
});
