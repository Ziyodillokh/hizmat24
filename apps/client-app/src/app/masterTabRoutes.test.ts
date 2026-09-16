import { describe, expect, it } from 'vitest';
import { PROTECTED_ROUTES } from './appRoutes';
import { MASTER_TABS, MASTER_TAB_ROUTES, type MasterTabKey } from './masterTabRoutes';
import { TAB_ROUTES } from './tabRoutes';
import { ROOT_ROUTES } from './useBackButton';

/** Oʻzbek tipografiyasi: ASCII apostrof (U+0027) taqiqlanadi. */
const ASCII_APOSTROPHE = /'/;

const EXPECTED_KEYS: MasterTabKey[] = ['jobs', 'history', 'earnings', 'profile'];

describe('MASTER_TAB_ROUTES', () => {
  it('aynan toʻrtta kalit', () => {
    expect(Object.keys(MASTER_TAB_ROUTES)).toHaveLength(4);
    expect(Object.keys(MASTER_TAB_ROUTES).sort()).toEqual([...EXPECTED_KEYS].sort());
  });

  it('har bir qiymat `/app/master/` bilan boshlanadi', () => {
    for (const path of Object.values(MASTER_TAB_ROUTES)) {
      expect(path.startsWith('/app/master/')).toBe(true);
    }
  });

  it('har bir tab marshruti PROTECTED_ROUTES da bor va usta gvardiyasi ostida', () => {
    const byPath = new Map(PROTECTED_ROUTES.map((route) => [`/app/${route.path}`, route]));
    for (const path of Object.values(MASTER_TAB_ROUTES)) {
      const route = byPath.get(path);
      expect(route).toBeDefined();
      expect(route?.role).toBe('master');
    }
  });

  it('har bir tab marshruti "orqaga" ildizlari roʻyxatida bor', () => {
    for (const path of Object.values(MASTER_TAB_ROUTES)) {
      expect(ROOT_ROUTES.has(path)).toBe(true);
    }
  });

  it('mijoz tab marshrutlari bilan kesishmaydi', () => {
    const client = new Set(Object.values(TAB_ROUTES));
    for (const path of Object.values(MASTER_TAB_ROUTES)) expect(client.has(path)).toBe(false);
  });
});

describe('MASTER_TABS', () => {
  it('jadval tartibi marshrutlar bilan bir xil toʻplamda', () => {
    expect(MASTER_TABS.map((tab) => tab.key)).toEqual(EXPECTED_KEYS);
  });

  it('har bir yorliq 360px ekran uchun qisqa — 7 belgidan oshmaydi', () => {
    for (const tab of MASTER_TABS) {
      expect(tab.label.length).toBeGreaterThan(0);
      expect(tab.label.length).toBeLessThanOrEqual(7);
    }
  });

  it('yorliqlarda "Buyurtma" soʻzi yoʻq — u mijoz panelining soʻzi', () => {
    for (const tab of MASTER_TABS) expect(tab.label).not.toContain('Buyurtma');
  });

  it('ASCII apostrof yoʻq', () => {
    for (const tab of MASTER_TABS) expect(ASCII_APOSTROPHE.test(tab.label)).toBe(false);
  });
});
