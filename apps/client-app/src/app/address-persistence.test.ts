import { describe, expect, it } from 'vitest';
import { reviveAddresses, serializeAddresses } from './address-persistence';
import { ADDRESS_LIMIT, type SavedAddress } from '@/lib/savedAddress';

const NOW = new Date(2026, 8, 12, 14, 30);

function saved(extra: Partial<SavedAddress> = {}): SavedAddress {
  return {
    id: 'a-1',
    kind: 'home',
    name: 'Uyim',
    address: { label: 'Toshkent, Chilonzor 9-kvartal, 42-uy', entrance: '2', floor: '5', apartment: '34' },
    createdAt: NOW,
    lastUsedAt: null,
    ...extra,
  };
}

const roundTrip = (records: SavedAddress[]): SavedAddress[] | null =>
  reviveAddresses(JSON.parse(JSON.stringify(serializeAddresses(records))));

describe('serializeAddresses / reviveAddresses', () => {
  it('borish va qaytish maʼlumotni yoʻqotmaydi', () => {
    const result = roundTrip([saved({ lastUsedAt: new Date(2026, 8, 11, 9, 0) })]);
    expect(result).toHaveLength(1);
    const [item] = result ?? [];
    expect(item.id).toBe('a-1');
    expect(item.kind).toBe('home');
    expect(item.name).toBe('Uyim');
    expect(item.address).toEqual(saved().address);
    expect(item.createdAt.getTime()).toBe(NOW.getTime());
    expect(item.lastUsedAt?.getTime()).toBe(new Date(2026, 8, 11, 9, 0).getTime());
  });

  it('`Date` qiymatlari `Date` boʻlib qaytadi — satr emas', () => {
    const [item] = roundTrip([saved({ lastUsedAt: NOW })]) ?? [];
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(item.lastUsedAt).toBeInstanceOf(Date);
  });

  it('berilmagan maydon undefined boʻlib qaytadi — null emas', () => {
    const [item] = roundTrip([saved({ address: { label: 'Chilonzor 9-kvartal' } })]) ?? [];
    expect(item.address.entrance).toBeUndefined();
    expect(item.address.floor).toBeUndefined();
    expect(item.address.apartment).toBeUndefined();
  });
});

describe('reviveAddresses — buzuq maʼlumot', () => {
  it('massiv boʻlmasa null', () => {
    expect(reviveAddresses(null)).toBeNull();
    expect(reviveAddresses({})).toBeNull();
    expect(reviveAddresses('[]')).toBeNull();
  });

  it('boʻsh massivda null — "saqlangan narsa yoʻq" bilan bir xil', () => {
    expect(reviveAddresses([])).toBeNull();
  });

  it('manzil matni boʻlmagan yozuv tushib qoladi, qolgani saqlanadi', () => {
    const result = reviveAddresses([
      { id: 'a-1', kind: 'home', name: '', label: '   ', createdAt: NOW.toISOString() },
      ...serializeAddresses([saved({ id: 'a-2' })]),
    ]);
    expect(result).toHaveLength(1);
    expect(result?.[0].id).toBe('a-2');
  });

  it('buzuq sana yozuvni tashlaydi', () => {
    expect(
      reviveAddresses([{ id: 'a-1', kind: 'home', name: '', label: 'Chilonzor 9', createdAt: 'yoʻq' }]),
    ).toBeNull();
  });

  it('notoʻgʻri tur yozuvni TASHLAMAYDI — "other" boʻladi', () => {
    const result = reviveAddresses([
      { ...serializeAddresses([saved()])[0], kind: 'garaj' },
    ]);
    expect(result?.[0].kind).toBe('other');
    expect(result?.[0].address.label).toBe(saved().address.label);
  });

  it('buzuq lastUsedAt yozuvni tashlamaydi — null boʻladi', () => {
    const result = reviveAddresses([{ ...serializeAddresses([saved()])[0], lastUsedAt: 'yoʻq' }]);
    expect(result?.[0].lastUsedAt).toBeNull();
  });

  it('takroriy id ikkinchi marta olinmaydi', () => {
    const result = reviveAddresses(serializeAddresses([saved({ id: 'a-1' }), saved({ id: 'a-1' })]));
    expect(result).toHaveLength(1);
  });

  it('chegaradan ortiq yozuv kesiladi', () => {
    const many = Array.from({ length: ADDRESS_LIMIT + 5 }, (_, index) =>
      saved({ id: `a-${index}` }),
    );
    expect(reviveAddresses(serializeAddresses(many))).toHaveLength(ADDRESS_LIMIT);
  });
});
