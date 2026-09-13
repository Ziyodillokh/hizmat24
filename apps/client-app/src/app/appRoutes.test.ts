import { describe, expect, it } from 'vitest';
import { PROTECTED_ROUTES } from './appRoutes';
import { TAB_ROUTES } from './tabRoutes';

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

  it('har bir tab marshruti jadvalda bor', () => {
    const paths = new Set(PROTECTED_ROUTES.map((route) => `/app/${route.path}`));
    for (const target of Object.values(TAB_ROUTES)) expect(paths.has(target)).toBe(true);
  });

  it('statik segment dinamikdan OLDIN turadi', () => {
    // `addresses/new` `addresses/:addressId` dan oldin va h.k. Router buni
    // oʻzi hal qiladi, lekin jadval odam uchun hujjat va tartib saqlanadi.
    const paths = PROTECTED_ROUTES.map((route) => route.path);
    const pairs: [string, string][] = [
      ['chat/ai', 'chat/:threadId'],
      ['addresses/new', 'addresses/:addressId'],
      ['disputes', 'disputes/:disputeId'],
    ];
    for (const [fixed, dynamic] of pairs) {
      expect(paths.indexOf(fixed)).toBeLessThan(paths.indexOf(dynamic));
    }
  });
});
