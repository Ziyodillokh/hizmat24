import { describe, expect, it } from 'vitest';
import { PROTECTED_ROUTES } from './appRoutes';
import { MASTER_TAB_ROUTES } from './masterTabRoutes';
import { TAB_ROUTES } from './tabRoutes';
import { MASTER_ROUTES, MODE_ROUTE } from '@/lib/appMode';

/**
 * Marshrut jadvalining invariantlari.
 *
 * Takroriy yoʻl jimgina birinchisini yutadi; oldida `/` turgan yoʻl `Routes`
 * ichida umuman mos kelmaydi va foydalanuvchi `*` → `/app` ga tushib
 * ketadi — ikkalasi ham xato bermaydi.
 */
describe('PROTECTED_ROUTES', () => {
  it('yoʻllar takrorlanmaydi', () => {
    const paths = PROTECTED_ROUTES.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('yoʻllar nisbiy — oldida `/` yoʻq', () => {
    for (const route of PROTECTED_ROUTES) expect(route.path.startsWith('/')).toBe(false);
  });

  it('har bir mijoz tab marshruti jadvalda bor', () => {
    const paths = new Set(PROTECTED_ROUTES.map((route) => `/app/${route.path}`));
    for (const target of Object.values(TAB_ROUTES)) expect(paths.has(target)).toBe(true);
  });

  it('har bir usta tab marshruti jadvalda bor', () => {
    const paths = new Set(PROTECTED_ROUTES.map((route) => `/app/${route.path}`));
    for (const target of Object.values(MASTER_TAB_ROUTES)) expect(paths.has(target)).toBe(true);
  });

  it('statik segment dinamikdan OLDIN turadi', () => {
    // `addresses/new` `addresses/:addressId` dan oldin va h.k. Router buni
    // oʻzi hal qiladi, lekin jadval odam uchun hujjat va tartib saqlanadi.
    const paths = PROTECTED_ROUTES.map((route) => route.path);
    const pairs: [string, string][] = [
      ['addresses/new', 'addresses/:addressId'],
      ['disputes', 'disputes/:disputeId'],
    ];
    for (const [fixed, dynamic] of pairs) {
      expect(paths.indexOf(fixed)).toBeLessThan(paths.indexOf(dynamic));
    }
  });
});

/** `masters/:masterId` mijoz ekrani — nomi oʻxshasa ham usta rejimiga tegishli emas. */
const isMasterModeRoute = (path: string): boolean =>
  path === 'master' || path.startsWith('master/');

describe('rejim gvardiyasi', () => {
  /*
   * Eng qimmat regressiya: gvardiya foydalanuvchini `/app/mode` ga tushiradi.
   * Agar `/app/mode` ning oʻzi ham gvardiya olsa, u foydalanuvchini yana
   * `/app/mode` ga yuboradi va ilova cheksiz yoʻnaltirishda qotib qoladi.
   */
  it('`/app/mode` da `role` bayrogʻi YOʻQ', () => {
    const mode = PROTECTED_ROUTES.find((route) => `/app/${route.path}` === MODE_ROUTE);
    expect(mode).toBeDefined();
    expect(mode?.role).toBeUndefined();
  });

  it('barcha `master/*` marshrutlari usta gvardiyasi ostida', () => {
    const guarded = PROTECTED_ROUTES.filter((route) => isMasterModeRoute(route.path));
    expect(guarded.length).toBeGreaterThan(0);
    for (const route of guarded) expect(route.role).toBe('master');
  });

  it('mijozga koʻrinadigan usta profili `masters/:masterId` — gvardiyasiz', () => {
    const publicProfile = PROTECTED_ROUTES.find((route) => route.path === 'masters/:masterId');
    expect(publicProfile).toBeDefined();
    expect(publicProfile?.role).toBeUndefined();
    // Eski nom butunlay yoʻqoldi: `master/*` endi faqat usta rejiminiki.
    expect(PROTECTED_ROUTES.some((route) => route.path === 'master/:masterId')).toBe(false);
  });

  it('`MASTER_ROUTES` jadvalidagi har bir yoʻl haqiqatan marshrut jadvalida bor', () => {
    const paths = new Set(PROTECTED_ROUTES.map((route) => `/app/${route.path}`));
    for (const target of MASTER_ROUTES) expect(paths.has(target)).toBe(true);
  });

  it('mijoz marshrutlari rol bayrogʻini olmaydi', () => {
    const client = PROTECTED_ROUTES.filter((route) => !isMasterModeRoute(route.path));
    for (const route of client) expect(route.role).toBeUndefined();
  });
});
