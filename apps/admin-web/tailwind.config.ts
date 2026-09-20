import { COLOR_TOKENS, RADIUS, SPACING, TYPOGRAPHY } from './src/tokens/theme';

/**
 * Standart palitra butunlay almashtiriladi: `slate-500` kabi ranglarni
 * yozib boʻlmaydi, faqat token nomi orqali. Shu sababli temani bitta
 * joydan — CSS oʻzgaruvchilaridan — boshqarish mumkin.
 */
const colors = Object.fromEntries(
  COLOR_TOKENS.map((token) => [token, `rgb(var(--color-${token}) / <alpha-value>)`]),
);

const fontSize = Object.fromEntries(
  Object.entries(TYPOGRAPHY).map(([name, t]) => [
    name,
    [t.size, { lineHeight: t.line, fontWeight: String(t.weight), letterSpacing: t.tracking }],
  ]),
);

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', "[data-theme='dark']"],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: { transparent: 'transparent', current: 'currentColor', ...colors },
    fontSize,
    borderRadius: RADIUS,
    extend: {
      spacing: Object.fromEntries(SPACING.map((v) => [String(v), `${v}px`])),
      width: { sidebar: '248px' },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        e1: '0 1px 1px rgb(11 42 74 / 0.04), 0 2px 6px -1px rgb(11 42 74 / 0.07)',
        e2: '0 1px 2px rgb(11 42 74 / 0.05), 0 8px 20px -6px rgb(11 42 74 / 0.12)',
      },
    },
  },
};
