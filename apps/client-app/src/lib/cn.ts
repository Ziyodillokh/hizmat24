import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { COLOR_TOKENS } from '@/tokens/colors';
import { TYPOGRAPHY } from '@/tokens/typography';

/**
 * tailwind-merge standart konfiguratsiyasi bizning token nomlarimizni bilmaydi.
 *
 * Muammo: `text-h3` va `text-body-sm` kabi TIPOGRAFIKA klasslari standart
 * qoidalarga tushmagani uchun `text-color` guruhiga qoʻshilib ketardi. Natijada
 * `cn('text-h3', 'text-text-primary')` faqat rangni qoldirib, shrift oʻlchamini
 * OʻCHIRIB yuborardi — yaʼni butun kutubxonada matn token oʻlchamini emas,
 * brauzer standarti (16px) ni olardi.
 *
 * Yechim: ikkala guruhni ham oʻz tokenlarimiz bilan aniq eʼlon qilamiz.
 * Roʻyxatlar token fayllaridan olinadi, shuning uchun yangi token qoʻshilganda
 * bu yer avtomatik yangilanadi.
 */
const FONT_SIZE_TOKENS = Object.keys(TYPOGRAPHY);

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: FONT_SIZE_TOKENS }],
      'text-color': [{ text: [...COLOR_TOKENS] }],
    },
  },
});

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
