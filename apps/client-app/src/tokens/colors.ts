/**
 * Rang tokenlari — spetsifikatsiya 3-bo'limi.
 *
 * Bu ro'yxatdan tashqari hech qanday rang ishlatilmaydi (3.4-band).
 * Komponentlarda hex yozish taqiqlanadi — faqat token nomi orqali murojaat.
 */
export const COLOR_TOKENS = [
  'surface',
  'surface-elevated',
  'surface-raised',
  'surface-modal',
  'surface-sunken',
  'surface-hero',
  'surface-hero-deep',
  'category-circle',
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
  'shadow',
  'overlay',
  'canvas',
] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];

type Palette = Record<ColorToken, string>;

/** 3.1-band. */
export const DARK: Palette = {
  surface: '#0E2B2C',
  'surface-elevated': '#123738',
  'surface-raised': '#16403F',
  'surface-modal': '#1A4A48',
  'surface-sunken': '#12403F',
  'surface-hero': '#1C6B6B',
  // Spetsifikatsiyada Dark uchun `surface-hero-deep` alohida berilmagan, chunki
  // bu temada tepadagi dekorativ blok yo'q (2.1-band, 3-punkt) va banner yagona
  // "hero" yuzasi. Shuning uchun `surface-hero` bilan bir xil qiymat beriladi —
  // yangi rang kiritmaslik uchun (3.4-band).
  'surface-hero-deep': '#1C6B6B',
  'category-circle': '#1B7070',
  primary: '#2DD4BF',
  'primary-pressed': '#22B8A6',
  'on-primary': '#04302F',
  'primary-deep': '#0B7C7B',
  'on-primary-deep': '#FFFFFF',
  border: '#1E4F4E',
  'border-strong': '#2A6A68',
  'text-primary': '#F2FAFA',
  'text-secondary': '#9BB8B8',
  'text-disabled': '#5F7C7C',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#FCA5A5',
  'danger-fill': '#DC2626',
  star: '#FFC24B',
  'star-empty': '#3A5A5A',
  shadow: '#062C2C',
  overlay: 'rgba(0, 0, 0, 0.60)',
  // 3.3-band — frame'lardan tashqaridagi fon.
  canvas: '#7FA5A5',
};

/** 3.2-band. */
export const LIGHT: Palette = {
  surface: '#FFFFFF',
  'surface-elevated': '#FFFFFF',
  'surface-raised': '#FFFFFF',
  'surface-modal': '#FFFFFF',
  'surface-sunken': '#F1F7F7',
  // Tepadagi dekorativ turkuaz blok. Qiymat 3.2-band jadvalidan — o'zgartirilmaydi.
  // Bu tus ustida oq matn ishlatilmaydi (4-bo'lim, 1-punkt); matn va ikona
  // `on-primary` (#04302F) rangida chiziladi va kontrast 6,9:1 bo'ladi.
  'surface-hero': '#1EC8C8',
  'surface-hero-deep': '#1C7A7A',
  // Light temada bu doira OQ edi — oq sahifa ustida u umuman ko'rinmasdi
  // (soya 4% bo'lgani uchun chegara ham sezilmasdi). Endi yengil turkuaz tus:
  // `primary` (#10A3A0) ikonasi bilan kontrast 3,4:1, doira esa yuzadan ajraladi.
  'category-circle': '#E1F2F1',
  primary: '#10A3A0',
  'primary-pressed': '#0B7C7B',
  'on-primary': '#04302F',
  'primary-deep': '#0B7C7B',
  'on-primary-deep': '#FFFFFF',
  border: '#E2ECEC',
  'border-strong': '#C7DADA',
  'text-primary': '#04302F',
  'text-secondary': '#5C7A7A',
  'text-disabled': '#9AB0B0',
  success: '#047857',
  warning: '#92400E',
  danger: '#DC2626',
  'danger-fill': '#DC2626',
  star: '#D97706',
  'star-empty': '#D6E3E3',
  shadow: '#062C2C',
  overlay: 'rgba(4, 48, 47, 0.45)',
  canvas: '#E6F7F7',
};

export const PALETTES = { dark: DARK, light: LIGHT } as const;
export type ThemeName = keyof typeof PALETTES;

/**
 * `overlay` — yagona token, u alfa kanali bilan birga keladi (temaga qarab
 * 60% yoki 45%). Shuning uchun u kanal ko'rinishiga o'tkazilmaydi va Tailwind'da
 * ham alfa modifikatori bilan ishlatilmaydi.
 */
export const RAW_COLOR_TOKENS: readonly ColorToken[] = ['overlay'];

const isRaw = (token: ColorToken): boolean => RAW_COLOR_TOKENS.includes(token);

/**
 * Hex → "R G B" kanallari.
 *
 * Nega kerak: Tailwind'ning `bg-primary/[0.14]` kabi shaffoflik utilitalari
 * rang qiymatini `rgb(... / <alpha-value>)` shaklida kutadi. Agar CSS
 * o'zgaruvchisiga to'g'ridan-to'g'ri hex yozilsa, Tailwind uni tahlil qila
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

/** Tema qo'llashda CSS o'zgaruvchisiga yoziladigan qiymat. */
export function cssVarValue(token: ColorToken, value: string): string {
  return isRaw(token) ? value : hexToChannels(value);
}
