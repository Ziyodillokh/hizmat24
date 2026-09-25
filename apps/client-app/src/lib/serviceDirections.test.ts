import { describe, expect, it } from 'vitest';
import {
  directionHint,
  LOCKED_BADGE,
  lockedMessage,
  toDirectionCards,
} from './serviceDirections';
import type { ServiceGroup } from '@/mocks/types';

const group = (name: string, count: number): ServiceGroup =>
  ({
    id: `g-${name}`,
    name,
    iconKey: 'plumber',
    categories: Array.from({ length: count }, (_, index) => ({ id: `c-${index}` })),
  }) as ServiceGroup;

describe('toDirectionCards', () => {
  it('guruhdan karta yigʻadi va xizmatlarni sanaydi', () => {
    const [card] = toDirectionCards([group('Santexnika', 3)]);

    expect(card).toMatchObject({ name: 'Santexnika', serviceCount: 3, isLocked: false });
  });

  /*
   * Xizmati yoʻq yoʻnalishni ochsa mijoz boʻsh ekranga tushardi. Qulf —
   * yashirish emas: yoʻnalish rejada borligi ochiq aytiladi.
   */
  it('xizmati yoʻq guruh qulflanadi', () => {
    const [card] = toDirectionCards([group('Elektrik', 0)]);

    expect(card.isLocked).toBe(true);
    expect(directionHint(card)).toBe(LOCKED_BADGE);
  });

  it('boʻsh roʻyxat boʻsh natija beradi', () => {
    expect(toDirectionCards([])).toEqual([]);
  });
});

describe('directionHint', () => {
  it('ochiq yoʻnalishda xizmatlar soni yoziladi', () => {
    const [card] = toDirectionCards([group('Santexnika', 3)]);

    expect(directionHint(card)).toBe('3 ta xizmat');
  });
});

describe('lockedMessage', () => {
  it('yoʻnalish nomi bilan aytadi', () => {
    expect(lockedMessage('Elektrik xizmatlari')).toBe('Elektrik xizmatlari tez kunda ishga tushadi.');
  });
});
