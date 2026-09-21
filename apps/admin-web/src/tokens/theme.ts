/**
 * Panel tokenlari — mijoz ilovasidan ALOHIDA, lekin bir xil brend rangida.
 *
 * Mobil ilovaning token jadvali oʻzi bilan telefon oʻlchamlarini olib
 * keladi (status bar, tab bar, safe-area) — ular bu yerda maʼnosiz.
 * Shuning uchun panel oʻz, qisqaroq jadvalini tutadi; primary rangi esa
 * bitta: brend koʻk (47 128 200).
 */
export const COLOR_TOKENS = [
  'surface',
  'surface-elevated',
  'surface-sunken',
  'sidebar',
  'sidebar-active',
  'sidebar-text',
  'primary',
  'primary-pressed',
  'on-primary',
  'border',
  'border-strong',
  'text-primary',
  'text-secondary',
  'text-disabled',
  'success',
  'success-surface',
  'warning',
  'warning-surface',
  'danger',
  'danger-surface',
  'neutral-surface',
  'qr-surface',
  'qr-ink',
] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];

/**
 * QR kod ranglari — ikkala temada BIR XIL, va bu ataylab.
 *
 * QR skaneri oq fonda toʻq naqsh kutadi; qorongʻi temaga «moslashgan» QR
 * (toʻq fon, ochiq naqsh) koʻp telefonda umuman oʻqilmaydi. Shuning uchun
 * bu ikki token temadan qatʼi nazar oʻzgarmaydi.
 *
 * Hex shakli SVG atributlariga kerak (`qrcode.react` CSS oʻzgaruvchisini
 * qabul qilmaydi), kanallar shakli esa `index.css` da — `theme.test.ts`
 * ikkovining bir xilligini tekshiradi.
 */
export const QR_COLORS = {
  surface: '#FFFFFF',
  ink: '#102A43',
} as const;

/** Boʻshliq shkalasi — mijoz ilovasi bilan bir xil (spetsifikatsiya 3.5). */
export const SPACING = [2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

export const RADIUS = {
  none: '0px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  full: '9999px',
} as const;

export const TYPOGRAPHY = {
  h1: { size: '24px', line: '32px', weight: 600, tracking: '-0.02em' },
  h2: { size: '19px', line: '26px', weight: 600, tracking: '-0.01em' },
  h3: { size: '16px', line: '22px', weight: 600, tracking: '0em' },
  body: { size: '14px', line: '21px', weight: 400, tracking: '0em' },
  'body-strong': { size: '14px', line: '21px', weight: 600, tracking: '0em' },
  caption: { size: '12px', line: '17px', weight: 400, tracking: '0.01em' },
  'caption-strong': { size: '12px', line: '17px', weight: 600, tracking: '0.01em' },
  mono: { size: '13px', line: '20px', weight: 400, tracking: '0em' },
} as const;
