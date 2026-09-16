import { describe, expect, it } from 'vitest';
import { MASTER_TAB_ROUTES } from './masterTabRoutes';
import { TAB_ROUTES } from './tabRoutes';
import { ROOT_ROUTES } from './useBackButton';

/**
 * Navigatsiya regressiyasini boshqa hech narsa ushlamaydi: tab bar
 * oʻzgarganda marshrut yoki "orqaga" qoidasi eskirib qolishi mumkin.
 *
 * Jadval MIJOZ toʻplami: usta paneli oʻz faylida va oʻz testida
 * (`masterTabRoutes.test.ts`). Mijozning `TabKey` i kengaytirilmaydi.
 */
describe('mijoz tab marshrutlari', () => {
  it('toʻrtta tabning har biri uchun yoʻl bor', () => {
    expect(Object.keys(TAB_ROUTES)).toHaveLength(4);
    expect(Object.keys(TAB_ROUTES).sort()).toEqual(['home', 'orders', 'profile', 'wallet']);
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

  it('mijoz jadvalida usta marshruti yoʻq', () => {
    for (const path of Object.values(TAB_ROUTES)) {
      expect(path.startsWith('/app/master')).toBe(false);
    }
  });

  it('Chat, Market va Mutaxassislar olib tashlangan — ildizlar orasida yoʻq', () => {
    expect(ROOT_ROUTES.has('/app/chat')).toBe(false);
    expect(ROOT_ROUTES.has('/app/market')).toBe(false);
    expect(ROOT_ROUTES.has('/app/masters')).toBe(false);
  });

  it('hamyonning ichki sahifalari ildiz emas', () => {
    expect(ROOT_ROUTES.has('/app/wallet/bonus')).toBe(false);
    expect(ROOT_ROUTES.has('/app/wallet/history')).toBe(false);
  });

  it('rejim tanlash ekrani ildiz EMAS — u alohida qoida bilan ishlanadi', () => {
    expect(ROOT_ROUTES.has('/app/mode')).toBe(false);
  });

  it('ildizlar roʻyxati mijoz va usta tablarining birlashmasini qamraydi', () => {
    const tabs = [...Object.values(TAB_ROUTES), ...Object.values(MASTER_TAB_ROUTES)];
    for (const path of tabs) expect(ROOT_ROUTES.has(path)).toBe(true);
  });
});
