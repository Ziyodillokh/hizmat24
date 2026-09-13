/**
 * Rang tokenlari — spetsifikatsiya 3-boʻlimi.
 *
 * Bu roʻyxatdan tashqari hech qanday rang ishlatilmaydi (3.4-band).
 * Komponentlarda hex yozish taqiqlanadi — faqat token nomi orqali murojaat.
 */
export const COLOR_TOKENS = [
  'surface',
  'surface-elevated',
  'surface-raised',
  'surface-modal',
  'surface-sunken',
  'surface-hero-top',
  'surface-hero',
  'surface-hero-deep',
  'category-circle',
  'category-circle-top',
  'primary',
  'primary-pressed',
  'on-primary',
  'primary-deep',
  'on-primary-deep',
  'border',
  'border-strong',
  'text-primary',
  'text-secondary',
  'text-disabled',
  'success',
  'warning',
  'danger',
  'danger-fill',
  'star',
  'star-empty',
  // Holat tusi uchun TANLANGAN yuzalar. Ilgari ular komponentlarda
  // `bg-success/[0.14]` kabi arifmetika bilan olinardi: bitta alfa qiymati
  // beshta har xil tusga qoʻllanib, natijada baʼzilari loyqa, baʼzilari
  // yorqin chiqardi. Tanlangan qiymat har bir tus uchun alohida sozlanadi.
  'primary-surface',
  'success-surface',
  'warning-surface',
  'danger-surface',
  'neutral-surface',
  // Illyustratsiya uchun — ikkala temada bir xil (`on-primary-deep` kabi).
  'illus-shade',
  'illus-hi-vis',
  // Santexnika aksenti — bosh sahifadagi xizmat kartalari ichidagi ikona
  // rangi (havorang). Ilgari yettita soha uchun oltita aksent bor edi;
  // bosh sahifa santexnikaga qaratilgach (2026-09-13) qolganlari ishlatilmay
  // qoldi va olib tashlandi — kerak boʻlganda qaytariladi.
  'accent-water',
  'shadow',
  'overlay',
  'canvas',
] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];

type Palette = Record<ColorToken, string>;

/**
 * 3.1-band.
 *
 * Toʻq tema — TUNGI KOʻK. Yuzalar zinapoyasi MONOTON: `sunken` < `surface`
 * < `elevated` < `raised` < `modal`.
 */
export const DARK: Palette = {
  surface: '#08192B',
  'surface-elevated': '#0F2740',
  'surface-raised': '#153452',
  'surface-modal': '#1B4066',
  'surface-sunken': '#05111F',
  'surface-hero-top': '#2A7FC8',
  'surface-hero': '#11507F',
  'surface-hero-deep': '#0B3A61',
  'category-circle': '#143A5E',
  'category-circle-top': '#1D4F7C',
  // Yorqin osmon koʻki, ustida TOʻQ matn: oq matn #4DA3F5 ustida 2,6:1
  // berardi. Toʻq matn 8,9:1.
  primary: '#4DA3F5',
  'primary-pressed': '#3A8FE0',
  'on-primary': '#06213A',
  'primary-deep': '#1B6FB8',
  'on-primary-deep': '#FFFFFF',
  border: '#1E3E5E',
  'border-strong': '#2B5680',
  'text-primary': '#F1F6FB',
  // #A9BFD6: modal (#1B4066) ustida 5,0:1 · elevated 7,2:1 · surface 8,6:1.
  'text-secondary': '#A9BFD6',
  'text-disabled': '#5F7A96',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#FCA5A5',
  'danger-fill': '#DC2626',
  star: '#F5C063',
  'star-empty': '#22405E',
  shadow: '#000A14',
  overlay: 'rgba(0, 0, 0, 0.60)',
  'primary-surface': '#10365A',
  'success-surface': '#12463A',
  'warning-surface': '#453818',
  'danger-surface': '#4A2B2D',
  'neutral-surface': '#1B3550',
  'illus-shade': '#0B3F6E',
  'illus-hi-vis': '#F5B942',
  'accent-water': '#4FB5F0',
  // 3.3-band — frameʼlardan tashqaridagi fon.
  canvas: '#6E8DAA',
};

/**
 * 3.2-band.
 *
 * Yorugʻ tema — KOʻK brend. Referens maket: tepa blok toʻyingan koʻk, tugma
 * va aktiv tab oʻsha koʻkning bir pogʻona toʻqrogʻi, sahifa foni koʻkka
 * chalingan oq, kartalar oq.
 *
 * Sahifa kartalardan PASTDA turishi kerak: `surface` oq emas, `elevated`
 * oq — aks holda butun chuqurlik tizimi faqat nomlarda boʻlardi.
 */
export const LIGHT: Palette = {
  surface: '#F3F7FB',
  'surface-elevated': '#FFFFFF',
  'surface-raised': '#FFFFFF',
  'surface-modal': '#FFFFFF',
  'surface-sunken': '#E8EFF7',
  // Tepa blok. Oq qalin sarlavha #2F80C8 ustida 4,2:1 — yorugʻ kunda ham
  // oʻqiladi. Yuqori chap burchakdagi yorugʻlik dogʻi `hero-top`.
  'surface-hero-top': '#5AAAF0',
  'surface-hero': '#2F80C8',
  'surface-hero-deep': '#1F5FA8',
  // Doiralar OQ va yumshoq soyali (referens). Sahifa foni #F3F7FB boʻlgani
  // uchun oq doira undan ajralib turadi.
  'category-circle': '#FFFFFF',
  'category-circle-top': '#FFFFFF',
  // Tugma va aktiv tab. Oq matn #2E74C4 ustida 4,6:1 — AA.
  primary: '#2E74C4',
  'primary-pressed': '#235FA6',
  'on-primary': '#FFFFFF',
  'primary-deep': '#1F5A9C',
  'on-primary-deep': '#FFFFFF',
  // Kartalardagi chegara olib tashlanadi (soya oʻz ishini qiladi), shuning
  // uchun `border` endi faqat ajratgich va maydon konturi.
  border: '#DCE5EF',
  'border-strong': '#C4D3E3',
  'text-primary': '#102A43',
  // #4B6685: sahifa 5,6:1 · karta 6,3:1 · sunken 4,8:1.
  'text-secondary': '#4B6685',
  'text-disabled': '#9AAEC3',
  success: '#1B7F4A',
  // Amber, shokolad emas — ogohlantirish bannerlari "iflos" chiqmasin.
  warning: '#9A5408',
  danger: '#C81E1E',
  'danger-fill': '#DC2626',
  // Yulduz — referensdagi oltin-toʻq sariq. Reyting RAQAMI `text-primary`
  // da yoziladi, yulduzning oʻzi bezak.
  star: '#E39B12',
  'star-empty': '#D9E3EE',
  shadow: '#0B2A4A',
  overlay: 'rgba(16, 42, 67, 0.45)',
  'primary-surface': '#E6F0FB',
  'success-surface': '#DDF3E7',
  'warning-surface': '#FBEBD8',
  'danger-surface': '#FCE6E5',
  'neutral-surface': '#EAF0F7',
  'illus-shade': '#0B3F6E',
  'illus-hi-vis': '#F5B942',
  // Och koʻk plitka ustida grafik uchun 3:1 dan yuqori.
  'accent-water': '#2A93D5',
  canvas: '#E3EEF9',
};

export const PALETTES = { dark: DARK, light: LIGHT } as const;
export type ThemeName = keyof typeof PALETTES;

/**
 * `overlay` — yagona token, u alfa kanali bilan birga keladi (temaga qarab
 * 60% yoki 45%). Shuning uchun u kanal koʻrinishiga oʻtkazilmaydi va Tailwindʼda
 * ham alfa modifikatori bilan ishlatilmaydi.
 */
export const RAW_COLOR_TOKENS: readonly ColorToken[] = ['overlay'];

const isRaw = (token: ColorToken): boolean => RAW_COLOR_TOKENS.includes(token);

/**
 * Hex → "R G B" kanallari.
 *
 * Nega kerak: Tailwindʼning `bg-primary/[0.14]` kabi shaffoflik utilitalari
 * rang qiymatini `rgb(... / <alpha-value>)` shaklida kutadi. Agar CSS
 * oʻzgaruvchisiga toʻgʻridan-toʻgʻri hex yozilsa, Tailwind uni tahlil qila
 * olmaydi va utilitani BUTUNLAY tashlab yuboradi — CSS umuman chiqmaydi.
 */
export function hexToChannels(hex: string): string {
  const value = hex.replace('#', '');
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value;

  const int = Number.parseInt(full, 16);
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
}

/** Tema qoʻllashda CSS oʻzgaruvchisiga yoziladigan qiymat. */
export function cssVarValue(token: ColorToken, value: string): string {
  return isRaw(token) ? value : hexToChannels(value);
}
