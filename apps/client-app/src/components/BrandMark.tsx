import { cn } from '@/lib/cn';

/**
 * Hizmat24 belgisi.
 *
 * Kutubxona ikonasini identifikatsiya sifatida ishlatish — mahsulotni hech kim
 * loyihalamaganining eng baland signali, ayniqsa foydalanuvchi koʻradigan
 * BIRINCHI kadrda. Ilgari kirish ekranida shunchaki lucide `Wrench` turardi.
 *
 * Belgi = oʻrovchi SHAKL + undagi figura MAʼLUM munosabatda. Bu yerda oʻrovchi
 * shakl — gayka (olti burchak): mexanik, hunarga tegishli va lucide glifiga
 * hech qanday oʻxshamaydi. Figura esa ochiq jagʻli kalit, ataylab -34°
 * burilgan: oʻqqa tekislangan shakl ikona boʻlib, burilgani belgi boʻlib
 * oʻqiladi.
 */
export interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      role="img"
      aria-label="Hizmat24"
      className={cn('block', className)}
    >
      {/* Gayka — yassi tepali olti burchak, burchaklari yumaloqlangan. */}
      <path
        d="M28 8H68A8 8 0 0 1 74.9 12L92.9 44A8 8 0 0 1 92.9 52L74.9 84A8 8 0 0 1 68 88H28A8 8 0 0 1 21.1 84L3.1 52A8 8 0 0 1 3.1 44L21.1 12A8 8 0 0 1 28 8Z"
        className="fill-primary"
      />

      {/* Faqat YUQORI ikki yoqda yorugʻlik qirrasi: plastinkada yorugʻlik
          yoʻnalishining borligi belgini oddiy shakldan ajratadi. */}
      <path
        d="M31 11.5H66 M25.5 14.5L9 43.5"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        className="stroke-on-primary-deep/[0.22]"
      />

      {/* Kalit: 300° yoy (butt uchlari yassi jag' beradi) + dasta. */}
      <g transform="rotate(-34 48 48)">
        <path
          d="M 53.75 30.04 A 11.5 11.5 0 1 1 42.25 30.04"
          strokeWidth={9}
          strokeLinecap="butt"
          fill="none"
          className="stroke-on-primary"
        />
        <rect x="42" y="48" width="12" height="32" rx="6" className="fill-on-primary" />
      </g>
    </svg>
  );
}
