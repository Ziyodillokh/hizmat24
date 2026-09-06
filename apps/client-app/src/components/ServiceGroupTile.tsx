import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Grid elementi — spetsifikatsiya 9.5-bandi.
 * 72px doira (`category-circle`, e2) + ichida 28px outline ikona, ostida 8px,
 * yorliq `caption`, markazlashgan, MAKSIMUM 2 SATR.
 *
 * Nega bir qator emas: yorliqqa guruhning serverdan kelgan to'liq nomi beriladi
 * ("Elektrik xizmatlari"), 4 ustunli katakcha esa ~72px keng. Bir qatorga
 * majburlansa nom "Elektrik xi…" bo'lib kesiladi va foydalanuvchi xizmat turini
 * o'qiy olmaydi. 9.5-band ikki satrga ruxsat beradi, shuning uchun `line-clamp-2`.
 * Qat'iy balandlik qo'yilmaydi — qisqa nom bo'sh ikkinchi satrni band qilmaydi.
 */

/**
 * Doira ichidagi ikona rangi 6.4-bandda ikki temada ikki xil: Dark — oq,
 * Light — `primary`. Bitta token bunga mos kelmaydi (`on-primary-deep` ikkala
 * temada oq, `on-primary` esa Light'da ham to'q), shuning uchun asos `primary`,
 * Dark'da esa `data-theme` selektori orqali `on-primary-deep` ga almashadi —
 * temani `applyTheme()` aynan shu atribut bilan qo'yadi (src/lib/theme.ts).
 * Shu tariqa yangi rang kiritilmaydi (3.4-band) va struktura o'zgarmaydi (56-punkt).
 */
const CIRCLE_ICON_CLASSES = "text-primary [[data-theme='dark']_&]:text-on-primary-deep";

export interface ServiceGroupTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /**
   * Katakcha yorlig'i — guruh nomi. Nom serverdan keladi, UI uni
   * o'zgartirmaydi va qayta saralamaydi.
   */
  label: string;
  /** Server bergan `iconKey` bo'yicha tanlangan vektor ikona — rasm URL emas (1-bo'lim, 16-punkt). */
  icon: LucideIcon;
}

export function ServiceGroupTile({ label, icon, className, ...rest }: ServiceGroupTileProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full flex-col items-center gap-8 text-center',
        'transition-transform active:scale-[0.98]',
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          // 9.5-banddagi 72px. Tor ekranlarda (320–360px) doira ustun kengligiga
          // qarab siqiladi, shuning uchun `max-w` — qat'iy `w` emas.
          'flex aspect-square w-full max-w-[72px] items-center justify-center rounded-full',
          // Grid doiralari e2 darajasida (6.3-band): Light — oq doira va soya,
          // Dark — to'ldirilgan teal va ingichka chegara. Ikkalasini ham
          // `category-circle` tokeni beradi.
          'bg-category-circle shadow-e2',
          // Light temada tus och bo'lgani uchun ingichka chegara shaklni
          // aniqlashtiradi; Dark'da doira allaqachon to'ldirilgan.
          "border border-border [[data-theme='dark']_&]:border-transparent",
        )}
      >
        <Icon icon={icon} size={28} className={CIRCLE_ICON_CLASSES} aria-hidden />
      </span>

      {/* Nomni yorliq o'zi aytadi, ikona dekorativ — shuning uchun u `aria-hidden`. */}
      {/* Juda uzun nom bir satrda "…" bilan kesiladi — katakcha balandligi bir xil qoladi. */}
      <span className="w-full truncate text-body-sm text-text-primary">{label}</span>
    </button>
  );
}
