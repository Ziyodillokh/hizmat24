import { clsx } from 'clsx';
import markUrl from '@/assets/brand/hizmat24-mark.png';

/**
 * Hizmat24 brend belgisi — mijoz ilovasidagi belgining AYNAN oʻzi.
 *
 * Ilgari panelda `lucide-react` dagi qalqon+galochka ikonkasi turardi. U
 * "xavfsizlik" degan umumiy belgi edi va loyihaga aloqasi yoʻq edi:
 * panelga kirgan odam brendni tanimasdi.
 *
 * Belgi OʻZI plitka: rasmda allaqachon koʻk gradient fon bor. Shuning
 * uchun uni yana rangli kvadrat ichiga solish kerak emas — ikki qavat
 * koʻk bir-birining ustiga tushib, chekkada ifloslik hosil qilardi.
 *
 * Rasm bandlga kiritiladi (tashqi soʻrov yoʻq) — panel ichki tarmoqda
 * ham ochilishi kerak.
 *
 * HOSHIYA chaqiruvchi tomonidan beriladi va toʻq yuzalarda SHART.
 * Belgining gradienti past-chap burchakda chuqur tungi koʻkka (3 18 60)
 * tushadi; chap menyu foni esa (5 17 31) — ikkisining kontrasti 1.04:1,
 * yaʼni plitka burchagi fonga butunlay singib ketadi (manba rasmning
 * chekka piksellari boʻyicha oʻlchandi). Yorugʻ kartada (oq fon) hoshiya
 * shart emas — u yerda kontrast 18:1.
 */
export interface BrandMarkProps {
  /** Tomon oʻlchami, piksel. Kvadrat rasm — bitta son yetarli. */
  size?: number;
  className?: string;
  /**
   * Bezak rejimi: `alt=""`. Yonida "Hizmat24" yozuvi turganda shu rejim
   * kerak — aks holda ekran oʻquvchi nomni ikki marta oʻqiydi.
   */
  decorative?: boolean;
}

export function BrandMark({ size = 40, className, decorative = false }: BrandMarkProps) {
  return (
    <img
      src={markUrl}
      width={size}
      height={size}
      alt={decorative ? '' : 'Hizmat24'}
      aria-hidden={decorative || undefined}
      // Oʻlcham `style` da ham takrorlanadi: Tailwind preflight rasmlarga
      // `max-width:100%` beradi va tor konteynerda belgi kichrayib ketardi.
      style={{ width: size, height: size }}
      className={clsx('block shrink-0 rounded-md object-contain', className)}
    />
  );
}
