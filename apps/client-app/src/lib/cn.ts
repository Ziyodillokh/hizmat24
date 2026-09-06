import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';
import { COLOR_TOKENS } from '@/tokens/colors';
import { TYPOGRAPHY } from '@/tokens/typography';

/**
 * tailwind-merge standart konfiguratsiyasi bizning token nomlarimizni bilmaydi.
 *
 * Muammo: `text-h3` va `text-body-sm` kabi TIPOGRAFIKA klasslari standart
 * qoidalarga tushmagani uchun `text-color` guruhiga qo'shilib ketardi. Natijada
 * `cn('text-h3', 'text-text-primary')` faqat rangni qoldirib, shrift o'lchamini
 * O'CHIRIB yuborardi — ya'ni butun kutubxonada matn token o'lchamini emas,
 * brauzer standarti (16px) ni olardi.
 *
 * Yechim: ikkala guruhni ham o'z tokenlarimiz bilan aniq e'lon qilamiz.
 * Ro'yxatlar token fayllaridan olinadi, shuning uchun yangi token qo'shilganda
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
