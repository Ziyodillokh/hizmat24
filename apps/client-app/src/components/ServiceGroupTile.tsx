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
 * `neutral` — "Ustalar" va "Barchasi" katakchalari uchun. Ular kategoriya
 * EMAS, balki roʻyxatga oʻtish yoʻli; ikonasi kulrang, doirasi esa boshqalar
 * bilan BIR XIL oq (referens maket): sakkizta doira bitta qatorda bir xil
 * material boʻlishi kerak, farq faqat ikona rangida.
 *
 * Ikona rangi `iconTone` orqali keladi (sukut — `text-primary-pressed`).
 * Klasslar toʻliq satr sifatida uzatiladi — Tailwind manbani MATN sifatida
 * skanerlaydi. Komponent endi faqat preview galereyasida ishlatiladi: bosh
 * sahifa 2026-09-13 dan `ServiceTile` kartalarini chizadi.
 */
type TileTone = 'default' | 'neutral';

const NEUTRAL_ICON_CLASSES = 'text-text-secondary';

export interface ServiceGroupTileProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  tone?: TileTone;
  /** Ikona rangi klassi (masalan `text-primary-pressed`). `neutral` tusda eʼtiborsiz. */
  iconTone?: string;
  /** Optik massani tenglashtirish uchun — chaqiruvchi beradi, sukut 28. */
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
  iconTone = 'text-primary-pressed',
  iconSize = 28,
  className,
  ...rest
}: ServiceGroupTileProps) {
  const iconClasses = tone === 'neutral' ? NEUTRAL_ICON_CLASSES : iconTone;
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
          'flex aspect-square w-full max-w-[58px] items-center justify-center rounded-full',
          '[@media(max-height:800px)]:max-w-[48px]',
          // Grid doiralari e2 darajasida (6.3-band): Light — oq doira va soya,
          // Dark — toʻldirilgan teal va ingichka chegara. Ikkalasini ham
          // `category-circle` tokeni beradi.
          // Jismoniy disk tepasida koʻproq yorugʻlik ushlaydi — `disc-lit`
          // shuni beradi. Chegara yoʻq: Lightʼda `border` doira fonidan
          // toʻqroq edi va katakcha sakkizta halqa boʻlib oʻqilardi.
          'disc-lit shadow-e2',
        )}
      >
        <Icon icon={icon} size={iconSize} weight="duotone" className={iconClasses} aria-hidden />
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
