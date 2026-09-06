/**
 * Tipografika shkalasi — spetsifikatsiya 5-bo'limi.
 *
 * Qiymatlar `rem` da: ildiz shrift o'lchami ekran kengligiga qarab suziladi
 * (styles/index.css), shuning uchun matn 360px telefonda ham, 430px telefonda
 * ham bir xil PROPORSIYADA ko'rinadi. 393px etalon kenglikda (7-bo'lim)
 * qiymatlar spetsifikatsiyadagi px lar bilan aynan mos tushadi.
 *
 * Shkaladan tashqari shrift qiymati ishlatilmaydi (14.7-band, 53-punkt).
 */
export const TYPOGRAPHY = {
  display: { size: '2rem', line: '2.375rem', weight: 700, tracking: '-0.2px' },
  h1: { size: '1.75rem', line: '2.125rem', weight: 700, tracking: '-0.2px' },
  h2: { size: '1.375rem', line: '1.75rem', weight: 700, tracking: '-0.2px' },
  h3: { size: '1.125rem', line: '1.5rem', weight: 600, tracking: '-0.2px' },
  'body-lg': { size: '1rem', line: '1.5rem', weight: 400, tracking: '0' },
  body: { size: '0.9375rem', line: '1.375rem', weight: 400, tracking: '0' },
  'body-sm': { size: '0.8125rem', line: '1.125rem', weight: 400, tracking: '0' },
  caption: { size: '0.75rem', line: '1rem', weight: 500, tracking: '0' },
  'tab-label': { size: '0.6875rem', line: '0.875rem', weight: 500, tracking: '0' },
  overline: { size: '0.6875rem', line: '0.875rem', weight: 600, tracking: '0.6px' },
  button: { size: '1rem', line: '1.25rem', weight: 600, tracking: '0' },
  'button-sm': { size: '0.875rem', line: '1.125rem', weight: 600, tracking: '0' },
  price: { size: '1.125rem', line: '1.5rem', weight: 700, tracking: '0', tabular: true },
  currency: { size: '0.875rem', line: '1.25rem', weight: 500, tracking: '0' },
  'numeric-sm': { size: '0.875rem', line: '1.25rem', weight: 600, tracking: '0', tabular: true },
  /** Texnik identifikatorlar uchun — alohida monospace oila kiritilmaydi (5-bo'lim). */
  mono: { size: '0.875rem', line: '1.25rem', weight: 500, tracking: '0.4px', tabular: true },
} as const;

export type TypographyToken = keyof typeof TYPOGRAPHY;
