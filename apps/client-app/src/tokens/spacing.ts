/**
 * Spacing, radius va elevatsiya — spetsifikatsiya 6-boʻlimi.
 */

/** 6.1-band: 4px asos. Bu roʻyxatdan tashqari qiymat yoʻq (13, 15, 18, 22px taqiqlanadi). */
/**
 * DIQQAT: bu roʻyxatda YOʻQ raqam jimgina Tailwind standart shkalasiga
 * tushadi va butunlay boshqa qiymat beradi — `py-10` 10px emas, 40px
 * (10 x 0.25rem) chiziladi va hech qanday xato bermaydi. Shuning uchun
 * padding/margin/gap uchun faqat shu qiymatlar ishlatiladi.
 */
export const SPACING = [2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

/** 6.1-band: qatʼiy belgilangan tuzilma oʻlchamlari. */
export const LAYOUT = {
  screenPaddingX: 20,
  statusBar: 54,
  header: 56,
  headerGap: 20,
  sectionGap: 24,
  sectionTitleGap: 12,
  cardPadding: 16,
  listGap: 12,
  gridGutter: 12,
  gridRowGap: 20,
  iconTextGap: 8,
  tabBar: 56,
  homeIndicator: 34,
  contentBottomReserve: 90,
  minTouchTarget: 44,
  frameWidth: 393,
  frameHeight: 852,
} as const;

/** 6.2-band. */
/**
 * Radius element oʻlchamiga qarab OʻSISHI kerak, aks holda mahsulotning
 * silueti boʻlmaydi. Ilgari sm/md/lg 12/14/16 edi — 44px chip, 340px karta va
 * 56px qidiruv maydoni bitta shakl boʻlib koʻrinardi.
 */
export const RADIUS = {
  xs: '8px',
  sm: '10px',
  md: '14px',
  lg: '20px',
  xl: '28px',
  full: '999px',
} as const;

/**
 * Haqiqiy materialga IKKI qatlam kerak: tor kontakt soyasi ("u tegib turibdi")
 * va keng ambient soya ("yorugʻlik tepadan tushyapti").
 *
 * Ilgari Lightʼda `0 1px 2px rgba(6,44,44,0.06)` turardi — DPR 2 da bu ~0,3%
 * yorugʻlik farqi, yaʼni koʻrinish chegarasidan past. Darkʼda esa umuman soya
 * yoʻq edi: har tomondan bir xil 6% ichki halqa YOʻNALISH tashimaydi.
 * Uning oʻrniga faqat YUQORI qirrada yorugʻlik chizigʻi va haqiqiy soya —
 * aynan shu toʻq interfeysni "material" qilib koʻrsatadi.
 */
export const ELEVATION = {
  light: {
    e0: 'none',
    e1: '0 1px 1px rgba(6, 44, 44, 0.04), 0 2px 6px -1px rgba(6, 44, 44, 0.07)',
    e2: '0 1px 2px rgba(6, 44, 44, 0.05), 0 8px 20px -6px rgba(6, 44, 44, 0.12)',
    e3: '0 2px 4px rgba(6, 44, 44, 0.07), 0 20px 40px -12px rgba(6, 44, 44, 0.20)',
  },
  dark: {
    e0: 'none',
    e1: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.30)',
    e2: 'inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 6px 16px -4px rgba(0, 0, 0, 0.45)',
    e3: 'inset 0 1px 0 rgba(255, 255, 255, 0.09), 0 20px 40px -12px rgba(0, 0, 0, 0.60)',
  },
} as const;

export type ElevationLevel = keyof typeof ELEVATION.light;
