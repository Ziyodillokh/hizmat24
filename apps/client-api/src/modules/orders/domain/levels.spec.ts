import { levelDiscountPercent, levelForClosedOrders } from './levels';

describe('Mijoz darajasi (chegirma serverda hisoblanadi)', () => {
  it('buyurtmasi yoʻq mijoz ham darajasiz qolmaydi', () => {
    expect(levelForClosedOrders(0).key).toBe('bronze');
    expect(levelDiscountPercent(0)).toBe(2);
  });

  it.each([
    [9, 'bronze', 2],
    [10, 'silver', 4],
    [29, 'silver', 4],
    [30, 'gold', 6],
    [500, 'gold', 6],
  ])('%i ta yakunlangan buyurtma → %s (%i%%)', (count, key, percent) => {
    expect(levelForClosedOrders(count).key).toBe(key);
    expect(levelDiscountPercent(count)).toBe(percent);
  });

  it('manfiy va kasr son xavfsiz qayta ishlanadi', () => {
    expect(levelDiscountPercent(-3)).toBe(2);
    expect(levelForClosedOrders(10.9).key).toBe('silver');
  });
});
