import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { COLOR_TOKENS, QR_COLORS, SPACING } from './theme';
import { contrastRatio, parseChannels, type Rgb } from './contrast';

const css = readFileSync(fileURLToPath(new URL('../styles/index.css', import.meta.url)), 'utf8');

/** `:root` yoki `:root[data-theme='dark']` blokidagi rang oʻzgaruvchilari. */
function paletteOf(theme: 'light' | 'dark'): Record<string, Rgb> {
  const selector = theme === 'light' ? ':root {' : ":root[data-theme='dark'] {";
  const start = css.indexOf(selector);
  const block = css.slice(start, css.indexOf('}', start));

  const palette: Record<string, Rgb> = {};
  for (const [, name, value] of block.matchAll(/--color-([a-z-]+):\s*([^;]+);/g)) {
    const channels = parseChannels(value);
    if (channels) palette[name] = channels;
  }
  return palette;
}

const LIGHT = paletteOf('light');
const DARK = paletteOf('dark');

/**
 * Oddiy matn uchun WCAG AA chegarasi. Panel bilan har kuni soatlab
 * ishlanadi — bu yerda «chiroyli, lekin oʻqilmaydi» degan murosa yoʻq.
 */
const AA_NORMAL_TEXT = 4.5;
const AA_LARGE_TEXT = 3;

describe('tema palitrasi', () => {
  it.each(['light', 'dark'] as const)('%s temada barcha tokenlar aniqlangan', (theme) => {
    const palette = theme === 'light' ? LIGHT : DARK;
    const missing = COLOR_TOKENS.filter((token) => !(token in palette));

    expect(missing).toEqual([]);
  });

  const PAIRS: ReadonlyArray<readonly [string, string, number]> = [
    ['text-primary', 'surface', AA_NORMAL_TEXT],
    ['text-primary', 'surface-elevated', AA_NORMAL_TEXT],
    ['text-secondary', 'surface-elevated', AA_NORMAL_TEXT],
    // Chap menyu ikkala temada ham toʻq koʻk — matni ikkalasida ham ochiq
    // boʻlishi SHART. Ilgari bu yerda `on-primary` turardi va u Dark
    // temada qoramtir boʻlib, menyu yozuvlari butunlay koʻrinmay qolgandi.
    ['sidebar-text', 'sidebar', AA_NORMAL_TEXT],
    ['sidebar-text', 'sidebar-active', AA_LARGE_TEXT],
    ['on-primary', 'primary', AA_LARGE_TEXT],
    ['success', 'success-surface', AA_NORMAL_TEXT],
    ['warning', 'warning-surface', AA_NORMAL_TEXT],
    ['danger', 'danger-surface', AA_NORMAL_TEXT],
    ['text-secondary', 'neutral-surface', AA_NORMAL_TEXT],
    // QR naqshi fonidan yetarlicha ajralmasa telefon kamerasi kodni
    // umuman topa olmaydi — bu yerda AA matn chegarasi eng past chegara.
    ['qr-ink', 'qr-surface', AA_NORMAL_TEXT],
  ];

  describe.each(['light', 'dark'] as const)('%s tema kontrasti', (theme) => {
    const palette = theme === 'light' ? LIGHT : DARK;

    it.each(PAIRS)('%s ustida %s — kamida %f', (fg, bg, minimum) => {
      expect(contrastRatio(palette[fg], palette[bg])).toBeGreaterThanOrEqual(minimum);
    });
  });

  it('ikkala temada bir xil tokenlar bor', () => {
    expect(Object.keys(LIGHT).sort()).toEqual(Object.keys(DARK).sort());
  });

  it.each(['light', 'dark'] as const)('%s temada QR ranglari QR_COLORS bilan bir xil', (theme) => {
    const palette = theme === 'light' ? LIGHT : DARK;
    const toHex = (channels: Rgb) =>
      `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();

    expect(toHex(palette['qr-surface'])).toBe(QR_COLORS.surface.toUpperCase());
    expect(toHex(palette['qr-ink'])).toBe(QR_COLORS.ink.toUpperCase());
  });

  it('boʻshliq shkalasi mijoz ilovasiniki bilan bir xil', () => {
    expect([...SPACING]).toEqual([2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64]);
  });
});

describe('kontrast hisobi', () => {
  it('oq va qora — 21:1', () => {
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 1);
  });

  it('bir xil rang — 1:1', () => {
    expect(contrastRatio([47, 128, 200], [47, 128, 200])).toBeCloseTo(1, 5);
  });

  it('tartibga bogʻliq emas', () => {
    const a: Rgb = [16, 42, 67];
    const b: Rgb = [243, 247, 251];
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });

  it.each([
    ['kam qiymat', '47 128'],
    ['ortiqcha qiymat', '47 128 200 255'],
    ['son emas', 'juda koʻk'],
    ['chegaradan tashqari', '47 128 300'],
  ])('%s — parseChannels null qaytaradi', (_name, raw) => {
    expect(parseChannels(raw)).toBeNull();
  });
});
