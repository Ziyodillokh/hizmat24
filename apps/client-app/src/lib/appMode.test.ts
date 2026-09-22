import { describe, expect, it } from 'vitest';
import {
  entryRouteFor,
  HOME_ROUTE_FOR,
  landingRoute,
  MASTER_ROUTES,
  MASTER_MODE_HINT,
  MODE_DESCRIPTIONS,
  MODE_LABELS,
  MODE_ROUTE,
  MODE_SHORT_LABELS,
  modeHome,
  modeRouteFor,
  NEXT_ROUTE_MAX,
  parseModeReason,
  parseNextRoute,
  switchToastFor,
} from './appMode';

/** Oʻzbek tipografiyasi: ASCII apostrof (U+0027) taqiqlanadi. */
const ASCII_APOSTROPHE = /'/;

describe('landingRoute', () => {
  it('kirmagan foydalanuvchi uchun yoʻnaltirish yoʻq — kirish ekrani chiziladi', () => {
    expect(landingRoute({ isAuthenticated: false, hasOnboarded: true, role: 'client' })).toBeNull();
  });

  it('tanishtiruvni koʻrmagan foydalanuvchi tanishtiruvga tushadi', () => {
    expect(landingRoute({ isAuthenticated: true, hasOnboarded: false, role: null })).toBe(
      '/app/onboarding',
    );
  });

  it('rolsiz sessiya rejim tanlashga tushadi — "mijoz" deb taxmin qilinmaydi', () => {
    expect(landingRoute({ isAuthenticated: true, hasOnboarded: true, role: null })).toBe(MODE_ROUTE);
  });

  it('rol bor boʻlsa oʻsha rejimning uyi ochiladi', () => {
    expect(landingRoute({ isAuthenticated: true, hasOnboarded: true, role: 'client' })).toBe(
      '/app/home',
    );
    expect(landingRoute({ isAuthenticated: true, hasOnboarded: true, role: 'master' })).toBe(
      '/app/master/jobs',
    );
  });
});

describe('modeHome', () => {
  it('rolsiz holat rejim ekraniga tushadi', () => {
    expect(modeHome(null)).toBe(MODE_ROUTE);
  });

  it('har bir rol uchun uy marshruti bor', () => {
    expect(modeHome('client')).toBe(HOME_ROUTE_FOR.client);
    expect(modeHome('master')).toBe(HOME_ROUTE_FOR.master);
  });

  it('usta uyi usta marshrutlari roʻyxatida, mijoz uyi esa yoʻq', () => {
    expect(MASTER_ROUTES).toContain(HOME_ROUTE_FOR.master);
    expect(MASTER_ROUTES).not.toContain(HOME_ROUTE_FOR.client);
  });
});

describe('entryRouteFor', () => {
  it('har ikki rejim ham oʻz uyiga tushadi', () => {
    expect(entryRouteFor('master')).toBe('/app/master/jobs');
    expect(entryRouteFor('client')).toBe('/app/home');
  });
});

describe('parseNextRoute', () => {
  it('usta marshrutini usta rejimi uchun qabul qiladi', () => {
    expect(parseNextRoute('/app/master/earnings', 'master')).toBe('/app/master/earnings');
    expect(parseNextRoute('/app/master/setup?step=area', 'master')).toBe(
      '/app/master/setup?step=area',
    );
  });

  it('tashqi manzilni rad etadi', () => {
    expect(parseNextRoute('https://evil.example/app/master/jobs', 'master')).toBeNull();
    expect(parseNextRoute('//evil.example', 'master')).toBeNull();
  });

  it('usta rejimi uchun mijoz marshrutini rad etadi', () => {
    expect(parseNextRoute('/app/home', 'master')).toBeNull();
    expect(parseNextRoute('/app/orders', 'master')).toBeNull();
  });

  it('mijoz rejimi uchun usta marshrutini rad etadi', () => {
    expect(parseNextRoute('/app/master/jobs', 'client')).toBeNull();
  });

  it('roʻyxatda boʻlmagan usta yoʻlini rad etadi', () => {
    expect(parseNextRoute('/app/master/admin', 'master')).toBeNull();
  });

  it('100 belgidan uzun qidiruvni rad etadi', () => {
    const long = `/app/master/setup?step=${'a'.repeat(NEXT_ROUTE_MAX)}`;
    expect(long.length).toBeGreaterThan(NEXT_ROUTE_MAX);
    expect(parseNextRoute(long, 'master')).toBeNull();
  });

  it('boʻsh qiymatni rad etadi', () => {
    expect(parseNextRoute(null, 'master')).toBeNull();
    expect(parseNextRoute('', 'master')).toBeNull();
  });
});

describe('parseModeReason va modeRouteFor', () => {
  it('sabab qiymatlari ikkala rejim uchun oʻqiladi', () => {
    expect(parseModeReason('usta')).toBe('master');
    expect(parseModeReason('mijoz')).toBe('client');
  });

  it('notoʻgʻri sabab `null` beradi', () => {
    expect(parseModeReason(null)).toBeNull();
    expect(parseModeReason('usta1')).toBeNull();
  });

  it('gvardiya manzili oʻqib boʻladigan sabab va qaytish yoʻlini yozadi', () => {
    const target = modeRouteFor('master', '/app/master/jobs');
    const params = new URLSearchParams(target.split('?')[1]);
    expect(target.startsWith(MODE_ROUTE)).toBe(true);
    expect(parseModeReason(params.get('kerak'))).toBe('master');
    expect(parseNextRoute(params.get('keyin'), 'master')).toBe('/app/master/jobs');
  });
});

describe('MASTER_MODE_HINT', () => {
  it('ishora ustaga nima qilishini aytadi', () => {
    expect(MASTER_MODE_HINT).toBe('Buyurtmalarni qabul qilish');
  });
});

describe('matnlar', () => {
  it('ASCII apostrof yoʻq', () => {
    const strings = [
      ...Object.values(MODE_LABELS),
      ...Object.values(MODE_SHORT_LABELS),
      ...Object.values(MODE_DESCRIPTIONS),
      switchToastFor('master'),
      switchToastFor('client'),
      MASTER_MODE_HINT,
    ];
    for (const item of strings) expect(ASCII_APOSTROPHE.test(item)).toBe(false);
  });

  it('almashtirish toasti aynan tanlangan rejimni aytadi', () => {
    expect(switchToastFor('master')).toBe('Usta rejimiga oʻtdingiz');
    expect(switchToastFor('client')).toBe('Mijoz rejimiga oʻtdingiz');
  });
});
