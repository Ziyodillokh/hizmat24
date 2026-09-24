import { describe, expect, it } from 'vitest';
import { ALL_SECTIONS, landingPath, menuFor, sectionByPath } from './sections';

describe('panel boʻlimlari', () => {
  it('server bergan tartibni saqlaydi', () => {
    expect(menuFor(['catalog', 'dashboard']).map((s) => s.key)).toEqual(['catalog', 'dashboard']);
  });

  it('notanish kalitni tashlab yuboradi — nomsiz element chizilmaydi', () => {
    expect(menuFor(['dashboard', 'kelajakdagi-bolim']).map((s) => s.key)).toEqual(['dashboard']);
  });

  it('boʻsh roʻyxatdan boʻsh menyu chiqadi', () => {
    expect(menuFor([])).toEqual([]);
  });

  it('kirgandan keyin birinchi mavjud boʻlimga tushadi', () => {
    expect(landingPath(['applications', 'dashboard'])).toBe('/applications');
  });

  it('boʻlim umuman boʻlmasa ham manzil qaytaradi', () => {
    expect(landingPath([])).toBe('/dashboard');
  });

  it('manzil boʻyicha boʻlimni topadi', () => {
    expect(sectionByPath('/catalog')?.key).toBe('catalog');
  });

  it('har bir boʻlimning manzili yagona', () => {
    const paths = ALL_SECTIONS.map((s) => s.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('har bir boʻlimda nom va izoh bor — boʻsh yozuv qolmaydi', () => {
    for (const section of ALL_SECTIONS) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.summary.length).toBeGreaterThan(0);
    }
  });

  it('tayyor boʻlimlar bosqich belgisisiz', () => {
    const ready = ALL_SECTIONS.filter((s) => s.stage === null).map((s) => s.key);
    expect(ready).toEqual([
      'dashboard',
      'applications',
      'orders',
      'safety',
      'catalog',
      'settings',
    ]);
  });
});
