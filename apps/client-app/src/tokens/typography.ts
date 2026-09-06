/**
 * Tipografika shkalasi — spetsifikatsiya 5-boʻlimi.
 *
 * Qiymatlar `rem` da: ildiz shrift oʻlchami ekran kengligiga qarab suziladi
 * (styles/index.css), shuning uchun matn 360px telefonda ham, 430px telefonda
 * ham bir xil PROPORSIYADA koʻrinadi. 393px etalon kenglikda (7-boʻlim)
 * qiymatlar spetsifikatsiyadagi px lar bilan aynan mos tushadi.
 *
 * Shkaladan tashqari shrift qiymati ishlatilmaydi (14.7-band, 53-punkt).
 */
/**
 * Harf oraligʻi `em` da, `px` da EMAS: ildiz shrift oʻlchami suziluvchi
 * (`clamp`), shuning uchun qatʼiy px qiymat tor telefonda harflar kichrayganda
 * ham oʻzgarmay qolib, moslik borgan sari buzilardi. Ilgari barcha sarlavhada
 * bitta `-0.2px` turardi — bu 28px da `-0.007em`, yaʼni optik jihatdan NOL.
 *
 * Ogʻirliklar ham "yumaloq" 400/500/600/700 emas: `@fontsource-variable/inter`
 * 100-900 oʻqini beradi, undan faqat toʻrtta qiymat olish oʻzgaruvchan
 * shriftni toʻrtta statik fayl kabi ishlatish demakdir.
 */
export const TYPOGRAPHY = {
  display: { size: '1.75rem', line: '2.0625rem', weight: 660, tracking: '-0.024em' },
  h1: { size: '1.5rem', line: '1.8125rem', weight: 680, tracking: '-0.022em' },
  h2: { size: '1.3125rem', line: '1.625rem', weight: 690, tracking: '-0.018em' },
  h3: { size: '1.125rem', line: '1.5rem', weight: 650, tracking: '-0.014em' },
  /** Karta va roʻyxat sarlavhasi. Ilgari bu `text-body-lg font-semibold` edi —
   *  eʼlon qilinmagan uslub, `h3` dan atigi 2px va 0 ogʻirlik farqi bilan. */
  title: { size: '1rem', line: '1.375rem', weight: 640, tracking: '-0.008em' },
  'body-lg': { size: '1.0625rem', line: '1.625rem', weight: 400, tracking: '-0.004em' },
  body: { size: '0.9375rem', line: '1.4375rem', weight: 420, tracking: '0' },
  /** Kichik matnga PROPORSIONAL koʻproq interlinyaj kerak. Ilgari `body-sm`
   *  interlinyaji (1,385) `body` nikidan (1,467) tor edi — teskarisi. */
  'body-sm': { size: '0.8125rem', line: '1.1875rem', weight: 430, tracking: '0.002em' },
  caption: { size: '0.75rem', line: '1.0625rem', weight: 540, tracking: '0.008em' },
  /** Badge uchun alohida: ilgari u `text-overline tracking-normal` edi — yagona
   *  boshqa chaqiruv joyida trackingi bekor qilinadigan token token emas. */
  badge: { size: '0.75rem', line: '1rem', weight: 600, tracking: '0.002em' },
  'tab-label': { size: '0.6875rem', line: '0.875rem', weight: 560, tracking: '0.01em' },
  overline: { size: '0.6875rem', line: '0.875rem', weight: 620, tracking: '0.08em' },
  button: { size: '1rem', line: '1.25rem', weight: 620, tracking: '0.004em' },
  'button-sm': { size: '0.875rem', line: '1.125rem', weight: 620, tracking: '0.006em' },
  /** Inter raqamlari bosh harf balandligida, sarlavha esa asosan x-balandlikda:
   *  18px narx 18px xizmat nomidan OPTIK jihatdan baland turardi. */
  price: { size: '1.0625rem', line: '1.375rem', weight: 680, tracking: '-0.012em', tabular: true },
  currency: { size: '0.8125rem', line: '1.1875rem', weight: 520, tracking: '0' },
  'numeric-sm': { size: '0.875rem', line: '1.25rem', weight: 620, tracking: '-0.006em', tabular: true },
  /** Texnik identifikatorlar uchun — alohida monospace oila kiritilmaydi (5-boʻlim). */
  mono: { size: '0.875rem', line: '1.25rem', weight: 520, tracking: '0.03em', tabular: true },
  /** Ilova nomi — kirish ekranidagi logotip lokapi uchun. */
  wordmark: { size: '1.75rem', line: '2rem', weight: 800, tracking: '-0.024em' },
} as const;

export type TypographyToken = keyof typeof TYPOGRAPHY;
