import { describe, expect, it } from 'vitest';
import { TAB_ROUTES } from './tabRoutes';
import { ROOT_ROUTES } from './useBackButton';

/**
 * Navigatsiya regressiyasini boshqa hech narsa ushlamaydi: tab bar
 * oʻzgarganda marshrut yoki "orqaga" qoidasi eskirib qolishi mumkin.
 */
describe('tab marshrutlari', () => {
  it('beshta tabning har biri uchun yoʻl bor', () => {
    expect(Object.keys(TAB_ROUTES)).toHaveLength(5);
    expect(Object.keys(TAB_ROUTES).sort()).toEqual([
      'chat',
      'home',
      'orders',
      'profile',
      'wallet',
    ]);
  });

  it('har bir yoʻl bitta segmentli ildiz marshrut', () => {
    for (const path of Object.values(TAB_ROUTES)) {
      expect(path.startsWith('/app/')).toBe(true);
      expect(path.split('/')).toHaveLength(3);
    }
  });

  it('barcha tab yoʻllari "orqaga" ildizlari roʻyxatida bor', () => {
    for (const path of Object.values(TAB_ROUTES)) {
      expect(ROOT_ROUTES.has(path)).toBe(true);
    }
  });

  it('Market va Mutaxassislar endi ildiz emas — orqaga bir qadam qaytadi', () => {
    expect(ROOT_ROUTES.has('/app/market')).toBe(false);
    expect(ROOT_ROUTES.has('/app/masters')).toBe(false);
  });

  it('hamyonning ichki sahifalari ildiz emas', () => {
    expect(ROOT_ROUTES.has('/app/wallet/bonus')).toBe(false);
    expect(ROOT_ROUTES.has('/app/wallet/history')).toBe(false);
  });
});
