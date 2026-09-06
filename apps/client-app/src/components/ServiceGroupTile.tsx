import type { Icon as IconGlyph } from '@phosphor-icons/react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon, type IconSize } from './Icon';

/**
 * Grid elementi — spetsifikatsiya 9.5-bandi.
 * 72px doira (`category-circle`, e2) + ichida 28px outline ikona, ostida 8px,
 * yorliq `caption`, markazlashgan, MAKSIMUM 2 SATR.
 *
 * Nega bir qator emas: yorliqqa guruhning serverdan kelgan toʻliq nomi beriladi
 * ("Elektrik xizmatlari"), 4 ustunli katakcha esa ~72px keng. Bir qatorga
 * majburlansa nom "Elektrik xi…" boʻlib kesiladi va foydalanuvchi xizmat turini
 * oʻqiy olmaydi. 9.5-band ikki satrga ruxsat beradi, shuning uchun `line-clamp-2`.
 * Qatʼiy balandlik qoʻyilmaydi — qisqa nom boʻsh ikkinchi satrni band qilmaydi.
 */

/**
 * Doira ichidagi ikona rangi ikki temada ikki xil: Dark — oq, Light — toʻq
 * turkuaz. `primary` (#10A3A0) och doira foni ustida atigi 2,68:1 berardi,
 * yaʼni grafik elementlar uchun 3:1 chegarasidan past edi.
 */
/**
 * `neutral` — "Barchasi" katakchasi uchun. U kategoriya EMAS, balki roʻyxatga
 * oʻtish yoʻli; xuddi kategoriya kabi chizilsa foydalanuvchi uni toʻqqizinchi
 * xizmat turi deb oʻylaydi.
 *
 * Klasslar toʻliq satr sifatida yozilgan — Tailwind manbani MATN sifatida
 * skanerlaydi, shuning uchun klass nomini boʻlaklardan yigʻib boʻlmaydi.
 */
type TileTone = 'default' | 'neutral';

const TILE_CIRCLE_CLASSES: Record<TileTone, string> = {
  default: 'disc-lit shadow-e2',
  neutral: 'bg-neutral-surface',
};

const TILE_ICON_CLASSES: Record<TileTone, string> = {
  default: "text-primary-pressed [[data-theme='dark']_&]:text-on-primary-deep",
  neutral: 'text-text-secondary',
};

export interface ServiceGroupTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  tone?: TileTone;
  /** Optik massani tenglashtirish uchun — `serviceIconSize()` dan keladi. */
  iconSize?: IconSize;
  /**
   * Katakcha yorligʻi — guruh nomi. Nom serverdan keladi, UI uni
   * oʻzgartirmaydi va qayta saralamaydi.
   */
  label: string;
  /** Server bergan `iconKey` boʻyicha tanlangan vektor ikona — rasm URL emas (1-boʻlim, 16-punkt). */
  icon: IconGlyph;
}

export function ServiceGroupTile({
  label,
  icon,
  tone = 'default',
  iconSize = 28,
  className,
  ...rest
}: ServiceGroupTileProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full flex-col items-center gap-4 text-center',
        'transition-transform duration-press ease-emphasized active:scale-[0.94]',
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          // 9.5-banddagi 72px. Tor ekranlarda (320–360px) doira ustun kengligiga
          // qarab siqiladi, shuning uchun `max-w` — qatʼiy `w` emas.
          'flex aspect-square w-full max-w-[52px] items-center justify-center rounded-full',
          // Grid doiralari e2 darajasida (6.3-band): Light — oq doira va soya,
          // Dark — toʻldirilgan teal va ingichka chegara. Ikkalasini ham
          // `category-circle` tokeni beradi.
          // Jismoniy disk tepasida koʻproq yorugʻlik ushlaydi — `disc-lit`
          // shuni beradi. Chegara olib tashlandi: Lightʼda `border` (L* 91,1)
          // doira foni (94,3) dan TOʻQROQ edi, yaʼni katakcha sakkizta obyekt
          // emas, sakkizta halqa boʻlib oʻqilardi.
          TILE_CIRCLE_CLASSES[tone],
        )}
      >
        <Icon icon={icon} size={iconSize} weight="duotone" className={TILE_ICON_CLASSES[tone]} aria-hidden />
      </span>

      {/* Nomni yorliq oʻzi aytadi, ikona dekorativ — shuning uchun u `aria-hidden`. */}
      {/* Ikki satrgacha oʻsadi: 72px katakchada "Elektrik xizmatlari" kabi
          nom bir satrga sigʻmaydi va kesilsa xizmat turi oʻqilmay qoladi. */}
      <span className="line-clamp-2 w-full text-balance text-body-sm text-text-primary">
        {label}
      </span>
    </button>
  );
}
