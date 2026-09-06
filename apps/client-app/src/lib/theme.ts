import { ELEVATION } from '@/tokens/spacing';
import { PALETTES, cssVarValue, type ColorToken, type ThemeName } from '@/tokens/colors';

/**
 * Tema almashtirish: barcha rang tokenlari CSS custom property sifatida
 * `<html>` ga yoziladi. Komponentlar faqat `var(--color-*)` orqali murojaat
 * qiladi, shuning uchun tema oʻzgarganda struktura umuman oʻzgarmaydi
 * (14.7-band, 56-punkt).
 */
export function applyTheme(theme: ThemeName, root: HTMLElement = document.documentElement): void {
  const palette = PALETTES[theme];

  // Ranglar RGB kanallari sifatida yoziladi ("45 212 191"), hex sifatida emas —
  // aks holda Tailwindʼning shaffoflik utilitalari (`bg-primary/[0.14]`)
  // umuman CSS chiqarmaydi.
  for (const [token, value] of Object.entries(palette)) {
    root.style.setProperty(`--color-${token}`, cssVarValue(token as ColorToken, value));
  }

  const elevation = ELEVATION[theme];
  for (const [level, value] of Object.entries(elevation)) {
    root.style.setProperty(`--elevation-${level}`, value);
  }

  root.dataset.theme = theme;
}

export const THEMES: readonly ThemeName[] = ['light', 'dark'];
