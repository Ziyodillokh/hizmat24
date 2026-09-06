/**
 * Spacing, radius va elevatsiya — spetsifikatsiya 6-bo'limi.
 */

/** 6.1-band: 4px asos. Bu ro'yxatdan tashqari qiymat yo'q (13, 15, 18, 22px taqiqlanadi). */
export const SPACING = [2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64] as const;

/** 6.1-band: qat'iy belgilangan tuzilma o'lchamlari. */
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
export const RADIUS = {
  xs: '8px',
  sm: '12px',
  md: '14px',
  lg: '16px',
  xl: '24px',
  full: '999px',
} as const;

/**
 * 6.3-band — ikki tema, ikki mexanizm.
 * Light: soya. Dark: soya EMAS — fon zinapoyasi + ingichka oq chegara.
 * Dark'dagi opacity qiymatlari (6% / 8% / 10%) — token qoidasidan yagona istisno (3.4-band).
 */
export const ELEVATION = {
  light: {
    e0: 'none',
    e1: '0 1px 2px rgba(6, 44, 44, 0.06)',
    e2: '0 4px 12px rgba(6, 44, 44, 0.08)',
    e3: '0 12px 24px rgba(6, 44, 44, 0.10)',
  },
  dark: {
    e0: 'none',
    e1: 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
    e2: 'inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
    e3: 'inset 0 0 0 1px rgba(255, 255, 255, 0.10)',
  },
} as const;

export type ElevationLevel = keyof typeof ELEVATION.light;
