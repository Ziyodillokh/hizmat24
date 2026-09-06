import { COLOR_TOKENS, RAW_COLOR_TOKENS } from './src/tokens/colors';
import { TYPOGRAPHY } from './src/tokens/typography';
import { SPACING, RADIUS, LAYOUT } from './src/tokens/spacing';

/**
 * Tailwind konfiguratsiyasi tokenlardan quriladi. Standart palitra
 * (slate-500, teal-400 va h.k.) butunlay o'chirilgan — 3.4-band bo'yicha
 * token jadvalidan tashqari rang ishlatib bo'lmaydi.
 */
/**
 * Ranglar `rgb(var(--color-x) / <alpha-value>)` shaklida beriladi — shunda
 * `bg-primary/[0.14]` kabi shaffoflik utilitalari ishlaydi. To'g'ridan-to'g'ri
 * `var(--color-x)` yozilsa, Tailwind rangni tahlil qila olmay utilitani
 * butunlay tashlab yuboradi (CSS umuman chiqmaydi).
 */
const colors = Object.fromEntries(
  COLOR_TOKENS.map((token) => [
    token,
    RAW_COLOR_TOKENS.includes(token)
      ? `var(--color-${token})`
      : `rgb(var(--color-${token}) / <alpha-value>)`,
  ]),
);

const fontSize = Object.fromEntries(
  Object.entries(TYPOGRAPHY).map(([name, t]) => [
    name,
    [t.size, { lineHeight: t.line, fontWeight: String(t.weight), letterSpacing: t.tracking }],
  ]),
);

const spacing = Object.fromEntries(SPACING.map((v) => [String(v), `${v}px`]));

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // `colors` — kengaytma emas, to'liq almashtirish: standart palitra yo'qoladi.
    colors: { transparent: 'transparent', current: 'currentColor', ...colors },
    fontSize,
    borderRadius: RADIUS,
    extend: {
      spacing: {
        ...spacing,
        'status-bar': `${LAYOUT.statusBar}px`,
        header: `${LAYOUT.header}px`,
        'tab-bar': `${LAYOUT.tabBar}px`,
        'home-indicator': `${LAYOUT.homeIndicator}px`,
        'bottom-reserve': `${LAYOUT.contentBottomReserve}px`,
        touch: `${LAYOUT.minTouchTarget}px`,
        // Notch va home indicator zonalari — qiymati qurilmaga qarab o'zgaradi,
        // shuning uchun px emas, `env()` orqali beriladi.
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      width: { frame: `${LAYOUT.frameWidth}px` },
      height: { frame: `${LAYOUT.frameHeight}px` },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        e1: 'var(--elevation-e1)',
        e2: 'var(--elevation-e2)',
        e3: 'var(--elevation-e3)',
        // Asosiy amal o'z rangida soya tashlaydi — shunda tugma sahifadan
        // ko'tarilib turadi. Alfa `rgb(var(--x) / a)` shaklida, ya'ni
        // token shartnomasi buzilmaydi va ikkala tema avtomatik ergashadi.
        'primary-lift':
          '0 6px 16px -6px rgb(var(--color-primary) / 0.45), 0 2px 4px -1px rgb(var(--color-shadow) / 0.12)',
        'danger-lift':
          '0 6px 16px -6px rgb(var(--color-danger-fill) / 0.40), 0 2px 4px -1px rgb(var(--color-shadow) / 0.12)',
      },
      /*
       * Ilgari konfiguratsiyada davomiylik umuman yo'q edi va har bir
       * `transition-*` Tailwind'ning 150ms standartida ishlardi: 340px karta
       * ham, 24px yulduz ham bir xil tezlikda. Butun ilova bo'ylab bir xil
       * xronometraj — interfeysni hech kim qo'lida his qilmaganining belgisi.
       */
      transitionTimingFunction: {
        std: 'cubic-bezier(0.2, 0, 0, 1)',
        emphasized: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      transitionDuration: { press: '110ms', state: '180ms', enter: '260ms' },
      keyframes: {
        /*
         * Sigʻmagan matnni chapga surish. Ikkala chekkada toʻxtab turadi —
         * uzluksiz harakat oʻqishga xalaqit beradi. Masofa komponentdan
         * `--marquee-distance` orqali keladi, chunki u matn kengligiga
         * bogʻliq va CSS uni oʻzi hisoblay olmaydi.
         */
        marquee: {
          // Boshida uzoqroq turadi: ekran ochilganda foydalanuvchi avval
          // toʻliq ismni oʻqiydi, keyin matn suriladi.
          '0%, 24%': { transform: 'translateX(0)' },
          '54%, 70%': { transform: 'translateX(calc(-1 * var(--marquee-distance)))' },
          '96%, 100%': { transform: 'translateX(0)' },
        },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'radar-ping': {
          '0%': { transform: 'scale(0.6)', opacity: '0.24' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'step-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.24' },
          '50%': { transform: 'scale(1.35)', opacity: '0.05' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        indeterminate: {
          '0%': { left: '-30%' },
          '100%': { left: '100%' },
        },
      },
      animation: {
        marquee: 'marquee var(--marquee-duration, 6s) ease-in-out infinite',
        shimmer: 'shimmer 1.2s linear infinite',
        'radar-ping': 'radar-ping 2s ease-out infinite',
        'step-pulse': 'step-pulse 2s ease-in-out infinite',
        shake: 'shake 0.3s ease-in-out',
        indeterminate: 'indeterminate 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
