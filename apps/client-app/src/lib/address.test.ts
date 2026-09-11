import { describe, expect, it } from 'vitest';
import { addressDetailsLine } from './address';

describe('addressDetailsLine', () => {
  it('uchala maydonni tartib bilan birlashtiradi', () => {
    expect(
      addressDetailsLine({ label: 'Chilonzor', entrance: '2', floor: '5', apartment: '34' }),
    ).toBe('2-podez · 5-qavat · 34-xonadon');
  });

  it('tartib obyektdagi yozilish tartibiga bogʻliq emas', () => {
    expect(
      addressDetailsLine({ label: 'Chilonzor', apartment: '34', floor: '5', entrance: '2' }),
    ).toBe('2-podez · 5-qavat · 34-xonadon');
  });

  it('bitta maydon boʻlsa faqat oʻsha chiziladi', () => {
    expect(addressDetailsLine({ label: 'Chilonzor', floor: '5' })).toBe('5-qavat');
    expect(addressDetailsLine({ label: 'Chilonzor', entrance: '2' })).toBe('2-podez');
  });

  it('tafsilot yoʻq boʻlsa null', () => {
    expect(addressDetailsLine({ label: 'Chilonzor' })).toBeNull();
    expect(addressDetailsLine({ label: 'Chilonzor', entrance: '', floor: '', apartment: '' })).toBeNull();
  });

  it('izoh qatorga kirmaydi', () => {
    expect(
      addressDetailsLine({ label: 'Chilonzor', floor: '5', comment: 'Domofon ishlamaydi' }),
    ).toBe('5-qavat');
  });
});
