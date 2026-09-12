import { describe, expect, it } from 'vitest';
import {
  isFavorite,
  resolveFavorites,
  sortFavorites,
  toggleFavorite,
  type FavoriteEntry,
} from './favorites';
import type { Master } from '@/mocks/types';

const NOW = new Date(2026, 8, 12, 14, 30);
const daysAgo = (days: number): Date => new Date(NOW.getTime() - days * 86_400_000);

const master = (id: string): Master => ({
  id,
  fullName: `Usta ${id}`,
  profession: 'Santexnik',
  experienceLevel: 'EXPERIENCED',
  hasGovCertificate: true,
  ratingAvg: 4.8,
  completedOrdersCount: 120,
  phoneNumber: null,
});

const CATALOG = new Map([['m-a', master('m-a')], ['m-b', master('m-b')]]);
const lookup = (id: string): Master | undefined => CATALOG.get(id);

describe('isFavorite', () => {
  it('roʻyxatdagi ustani topadi', () => {
    expect(isFavorite([{ masterId: 'm-a', addedAt: NOW }], 'm-a')).toBe(true);
  });

  it('roʻyxatda yoʻq ustada false', () => {
    expect(isFavorite([{ masterId: 'm-a', addedAt: NOW }], 'm-b')).toBe(false);
  });

  it('boʻsh roʻyxatda false', () => {
    expect(isFavorite([], 'm-a')).toBe(false);
  });
});

describe('toggleFavorite', () => {
  it('yoʻq ustani qoʻshadi', () => {
    const result = toggleFavorite([], 'm-a', NOW);
    expect(result).toEqual([{ masterId: 'm-a', addedAt: NOW }]);
  });

  it('bor ustani olib tashlaydi', () => {
    const result = toggleFavorite([{ masterId: 'm-a', addedAt: NOW }], 'm-a', NOW);
    expect(result).toEqual([]);
  });

  it('boshqa yozuvlarga tegmaydi', () => {
    const list: FavoriteEntry[] = [
      { masterId: 'm-a', addedAt: daysAgo(2) },
      { masterId: 'm-b', addedAt: daysAgo(1) },
    ];
    expect(toggleFavorite(list, 'm-a', NOW)).toEqual([{ masterId: 'm-b', addedAt: daysAgo(1) }]);
  });

  it('kirish massivini OʻZGARTIRMAYDI', () => {
    const list: FavoriteEntry[] = [{ masterId: 'm-a', addedAt: NOW }];
    toggleFavorite(list, 'm-b', NOW);
    expect(list).toHaveLength(1);
  });

  it('ikki marta bosish boshlangʻich holatga qaytaradi', () => {
    const once = toggleFavorite([], 'm-a', NOW);
    expect(toggleFavorite(once, 'm-a', NOW)).toEqual([]);
  });
});

describe('sortFavorites', () => {
  it('eng oxirida qoʻshilgani birinchi', () => {
    const result = sortFavorites([
      { masterId: 'old', addedAt: daysAgo(5) },
      { masterId: 'new', addedAt: daysAgo(1) },
    ]);
    expect(result.map((item) => item.masterId)).toEqual(['new', 'old']);
  });

  it('kirish massivini OʻZGARTIRMAYDI', () => {
    const list: FavoriteEntry[] = [
      { masterId: 'a', addedAt: daysAgo(1) },
      { masterId: 'b', addedAt: daysAgo(5) },
    ];
    sortFavorites(list);
    expect(list.map((item) => item.masterId)).toEqual(['a', 'b']);
  });
});

describe('resolveFavorites', () => {
  it('usta maʼlumotini ulaydi va tartibni saqlaydi', () => {
    const result = resolveFavorites(
      [
        { masterId: 'm-a', addedAt: daysAgo(5) },
        { masterId: 'm-b', addedAt: daysAgo(1) },
      ],
      lookup,
    );
    expect(result.map((item) => item.master.id)).toEqual(['m-b', 'm-a']);
    expect(result[0].master.fullName).toBe('Usta m-b');
  });

  it('topilmagan usta JIMGINA tushib qoladi — buzilgan karta chizilmaydi', () => {
    const result = resolveFavorites(
      [
        { masterId: 'm-a', addedAt: daysAgo(2) },
        { masterId: 'm-yoq', addedAt: daysAgo(1) },
      ],
      lookup,
    );
    expect(result).toHaveLength(1);
    expect(result[0].master.id).toBe('m-a');
  });

  it('hamma yozuv eskirgan boʻlsa boʻsh massiv', () => {
    expect(resolveFavorites([{ masterId: 'm-yoq', addedAt: NOW }], lookup)).toEqual([]);
  });
});
