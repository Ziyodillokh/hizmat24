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
  'shadow',
  'overlay',
  'canvas',
] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];

type Palette = Record<ColorToken, string>;

/** 3.1-band. */
export const DARK: Palette = {
  // Yuzalar zinapoyasi MONOTON boʻlishi shart. Ilgari `surface-sunken`
  // (L* 24,2) `surface-elevated` dan (L* 20,6) yorugʻroq edi — yaʼni
  // "choʻkkan" yuza "koʻtarilgan"idan tepada turardi va karta ichidagi
  // ikona uyasi kartaning oʻzidan yorqin chiqardi.
  surface: '#0E2B2C',
  'surface-elevated': '#133A3B',
  'surface-raised': '#194647',
  'surface-modal': '#1F5354',
  'surface-sunken': '#0A2324',
  'surface-hero-top': '#12615F',
  'surface-hero': '#0D4A49',
  // Ilgari bu token `surface-hero` bilan AYNAN bir xil edi — ikkita nom,
  // bitta rang. Endi hero chuqurlik gradientining pastki uchi.
  'surface-hero-deep': '#0A3736',
  'category-circle': '#1F7775',
  'category-circle-top': '#2A8C89',
  primary: '#2DD4BF',
  'primary-pressed': '#22B8A6',
  'on-primary': '#04302F',
  'primary-deep': '#0B7C7B',
  'on-primary-deep': '#FFFFFF',
  border: '#1E4F4E',
  'border-strong': '#2A6A68',
  'text-primary': '#F2FAFA',
  // #9BB8B8 yangi `surface-modal` (#1F5354) ustida 4,10:1 — AA dan oʻtmaydi.
  // #A6C1C1: modal 4,55:1 · raised 5,49:1 · elevated 6,50:1 · surface 7,87:1.
  'text-secondary': '#A6C1C1',
  'text-disabled': '#5F7C7C',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#FCA5A5',
  'danger-fill': '#DC2626',
  star: '#F5C063',
  // Ilgari boʻsh yulduz `surface-raised` dan YORUGʻROQ edi — boʻsh yulduzlar
  // toʻldirilgandek koʻrinardi.
  'star-empty': '#2A4344',
  // Toʻq teal soya toʻq teal fon ustida koʻrinmaydi — shuning uchun bu token
  // elevatsiyaga ulanmagan edi va faqat Toggleʼda ishlatilardi.
  shadow: '#00100F',
  overlay: 'rgba(0, 0, 0, 0.60)',
  'primary-surface': '#10413F',
  'success-surface': '#13463C',
  'warning-surface': '#453818',
  'danger-surface': '#4A2B2D',
  'neutral-surface': '#21403F',
  'illus-shade': '#093F3E',
  'illus-hi-vis': '#F5B942',
  // 3.3-band — frameʼlardan tashqaridagi fon.
  canvas: '#7FA5A5',
};

/** 3.2-band. */
export const LIGHT: Palette = {
  // Sahifa kartalardan PASTDA turishi kerak. Ilgari `surface`, `-elevated`,
  // `-raised` va `-modal` — toʻrttasi ham #FFFFFF edi, yaʼni butun chuqurlik
  // tizimi faqat nomlarda mavjud edi va har bir karta oq fonda oq toʻrtburchak
  // boʻlib, atigi 1px kulrang chiziq bilan ajralib turardi.
  surface: '#F2F7F7',
  'surface-elevated': '#FFFFFF',
  'surface-raised': '#FFFFFF',
  'surface-modal': '#FFFFFF',
  'surface-sunken': '#E5EFEF',
  // Tepadagi hero maydoni. Ilgari bu yorqin tsian (#1EC8C8) edi: brend rangi
  // 250px lik YUZA sifatida ishlatilardi va aynan shuning uchun Dark temada
  // blok butunlay oʻchirib tashlangan edi — ikki tema ikki xil mahsulot
  // boʻlib qolgandi. Chuqur va past xromali maydon ikkala temada bir xil
  // ishlaydi, ustiga oq matn qoʻyishga imkon beradi va yorqin turkuazni
  // yana AKSENT (ikona, narx, aktiv tab, CTA) holiga qaytaradi.
  // Referens dizayn bo'yicha tepa blok YORQIN turkuaz. Faqat bitta yon
  // berish bor: eng yorqin nuqta biroz to'qlashtirildi, chunki oq matn
  // #1EC8C8 ustida 1,9:1 beradi — telefonda quyoshda o'qib bo'lmaydi.
  // #14AEAB da qalin oq sarlavha 3,0:1 ga chiqadi va tus baribir yorqin
  // turkuaz bo'lib qoladi.
  'surface-hero-top': '#22CFCC',
  'surface-hero': '#14AEAB',
  // Banner tepa blokdan to'qroq — referensdagi kabi.
  'surface-hero-deep': '#0B7E7C',
  // Light temada bu doira OQ edi — oq sahifa ustida u umuman koʻrinmasdi
  // (soya 4% boʻlgani uchun chegara ham sezilmasdi). Endi yengil turkuaz tus:
  // `primary` (#10A3A0) ikonasi bilan kontrast 3,4:1, doira esa yuzadan ajraladi.
  // Referensda doiralar OQ va yumshoq soyali. Sahifa foni #F2F7F7 bo'lgani
  // uchun oq doira undan ajralib turadi.
  'category-circle': '#FFFFFF',
  'category-circle-top': '#FFFFFF',
  primary: '#10A3A0',
  'primary-pressed': '#0B7C7B',
  'on-primary': '#04302F',
  'primary-deep': '#0B7C7B',
  'on-primary-deep': '#FFFFFF',
  // Kartalardagi chegara olib tashlanadi (soya oʻz ishini qiladi), shuning
  // uchun `border` endi faqat ajratgich va maydon konturi — u koʻproq
  // koʻrinishi kerak, kamroq emas.
  border: '#DCE8E8',
  'border-strong': '#C7DADA',
  'text-primary': '#04302F',
  // #5C7A7A yangi sahifa foni (#F2F7F7) ustida 4,30:1 — AA dan oʻtmaydi.
  // #4E6C6C: sahifa 5,27:1 · karta 5,70:1 · sunken 4,86:1.
  'text-secondary': '#4E6C6C',
  'text-disabled': '#9AB0B0',
  success: '#047857',
  // #92400E shokolad rangi edi, amber emas — ogohlantirish bannerlari va
  // bildirishnoma doiralari "iflos" boʻlib chiqardi.
  warning: '#9A5408',
  // #DC2626 yangi sahifa foni ustida 4,47:1 — oʻtmaydi.
  danger: '#C81E1E',
  'danger-fill': '#DC2626',
  // Yulduzlarni sozlangan `warning` bilan bitta amber oilasiga tortadi:
  // ilgari ilovada turkuaz va ikkita bogʻlanmagan toʻq sariq bor edi.
  star: '#B8720F',
  'star-empty': '#D6E3E3',
  shadow: '#062C2C',
  overlay: 'rgba(4, 48, 47, 0.45)',
  'primary-surface': '#E9F6F5',
  'success-surface': '#DEF0E8',
  'warning-surface': '#FBEBD8',
  'danger-surface': '#FCE6E5',
  'neutral-surface': '#E9F0F0',
  'illus-shade': '#093F3E',
  'illus-hi-vis': '#F5B942',
  canvas: '#E6F7F7',
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
