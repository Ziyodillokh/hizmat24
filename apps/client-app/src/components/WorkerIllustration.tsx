import { cn } from '@/lib/cn';

/**
 * Bosh sahifa banneridagi ishchi illyustratsiyasi (spetsifikatsiya 06-ekran, 4-punkt).
 *
 * Nega SVG: loyihada rasm maydoni yo'q va tashqi fayl yuklanmaydi, shuning uchun
 * banner chap yarmidagi "ishchi fotosi" inline vektor sifatida chiziladi.
 *
 * Nega faqat `on-primary-deep` (oq) va uning shaffoflik darajalari: illyustratsiya
 * FAQAT `surface-hero-deep` ustida turadi — Dark temada `#1C6B6B`, Light temada
 * `#1C7A7A`, ikkalasi ham to'q teal. Shuning uchun yagona oq asos ikkala temada
 * ham bir xil kontrast beradi va yangi rang kiritilmaydi (3.4-band). Chuqurlik
 * uchun mayda detallar `primary-deep` bilan beriladi — u oq yuzalar ustida
 * to'qroq ko'rinadi.
 *
 * DIQQAT: illyustratsiyani `surface-hero` ustiga qo'yib BO'LMAYDI — Light temada
 * bu token yorqin teal (`#1EC8C8`), yorqin teal ustida esa oq ishlatish
 * taqiqlangan (4-bo'lim 1-punkt, 14.7-band 48-punkt).
 */

/** Takrorlanuvchi to'ldirishlar — Tailwind skaneri uchun to'liq klass matni. */
const FILL_SOLID = 'fill-on-primary-deep';
const FILL_SKIN = 'fill-on-primary-deep/[0.78]';
const FILL_CLOTH = 'fill-on-primary-deep/[0.92]';
const FILL_SHIRT = 'fill-on-primary-deep/[0.35]';
const FILL_EAR = 'fill-on-primary-deep/[0.68]';
const FILL_BUCKLE = 'fill-primary-deep/[0.3]';
const FILL_EYE = 'fill-primary-deep/[0.65]';

export interface WorkerIllustrationProps {
  className?: string;
  /** Dekorativ element: yonidagi banner sarlavhasi mazmunni to'liq beradi. */
  'aria-hidden'?: boolean;
}

export function WorkerIllustration({
  className,
  'aria-hidden': ariaHidden = true,
}: WorkerIllustrationProps) {
  return (
    <svg
      viewBox="0 0 160 200"
      // `xMidYMax` — byust banner PASTKI chetiga tegib turishi shart, shuning
      // uchun masshtablashda ortiqcha bo'shliq faqat tepadan olinadi.
      preserveAspectRatio="xMidYMax meet"
      aria-hidden={ariaHidden}
      focusable="false"
      className={cn('block overflow-hidden', className)}
    >
      {/* Bo'yin — tanadan oldin chiziladi, pastki qismi ko'krak ostida qoladi. */}
      <rect x="69" y="86" width="22" height="30" rx="9" className="fill-on-primary-deep/[0.6]" />

      {/* Ko'ylak va yelkalar. Pastki qirra y=200 da TEKIS tugaydi. */}
      <path
        d="M80 108C60 108 43 114 31 124C19 134 12 149 10 168L6 200H154L150 168C148 149 141 134 129 124C117 114 100 108 80 108Z"
        className={FILL_SHIRT}
      />
      <path d="M64 112L80 130L96 112C90 109 70 109 64 112Z" className="fill-on-primary-deep/[0.5]" />

      {/* Kombinezon lyamkalari. */}
      <path d="M42 116L54 112L66 138L57 141Z" className={FILL_CLOTH} />
      <path d="M118 116L106 112L94 138L103 141Z" className={FILL_CLOTH} />

      {/* Kombinezon ko'krak qismi — pastki qirrasi ham tekis. */}
      <path d="M63 134H97A5 5 0 0 1 102 139V200H58V139A5 5 0 0 1 63 134Z" className={FILL_CLOTH} />
      <rect x="59" y="133" width="10" height="8" rx="2" className={FILL_BUCKLE} />
      <rect x="91" y="133" width="10" height="8" rx="2" className={FILL_BUCKLE} />

      {/* Ko'krak cho'ntagi: qopqog'i to'qroq, shunda oq kombinezon ustida ajraladi. */}
      <rect x="68" y="158" width="24" height="22" rx="3" className="fill-primary-deep/[0.2]" />
      <rect x="68" y="158" width="24" height="5" rx="2" className="fill-primary-deep/[0.34]" />

      {/* Ko'tarilgan bilak. Chiziq viewBox pastidan chiqadi va u yerda kesiladi —
          shunda dumaloq uch tekis qirraga aylanadi. */}
      <path
        d="M138 205L116 158"
        strokeWidth={26}
        strokeLinecap="round"
        fill="none"
        className="stroke-on-primary-deep/[0.4]"
      />

      {/* Qo'ldagi kalit: dastasi va halqali boshi. */}
      <g transform="rotate(16 114 152)">
        <rect x="108" y="100" width="12" height="56" rx="6" className="fill-on-primary-deep/[0.85]" />
        {/* Halqali bosh: to'ldirish o'rniga qalin chiziq — ichki teshik shu bilan
            aniq chiqadi (tashqi radius 15, ichki 7). */}
        <circle
          cx="114"
          cy="92"
          r="11"
          strokeWidth={8}
          fill="none"
          className="stroke-on-primary-deep/[0.85]"
        />
      </g>
      {/* Kaft — dasta uchini yopadi, shunda kalit ushlab turilgandek ko'rinadi. */}
      <circle cx="114" cy="152" r="15" className={FILL_SKIN} />

      {/* Quloqlar yuzdan oldin — chetlari yuz konturi ostida qoladi. */}
      <circle cx="55" cy="68" r="5.5" className={FILL_EAR} />
      <circle cx="105" cy="68" r="5.5" className={FILL_EAR} />

      {/* Yuz konturi: iyagi yumaloq, tepasi kaska soyaboni ostida. */}
      <path d="M57 44H103V74A23 23 0 0 1 57 74Z" className={FILL_SKIN} />
      <circle cx="70" cy="70" r="3.2" className={FILL_EYE} />
      <circle cx="90" cy="70" r="3.2" className={FILL_EYE} />
      <path
        d="M71 82C75 87 85 87 89 82"
        strokeWidth={3}
        strokeLinecap="round"
        fill="none"
        className="stroke-primary-deep/[0.55]"
      />

      {/* Qurilish kaskasi: gumbaz → qovurg'a → soyabon → old qirra. */}
      <path d="M50 50A30 30 0 0 1 110 50Z" className={FILL_SOLID} />
      <rect x="76" y="24" width="8" height="26" rx="4" className="fill-primary-deep/[0.22]" />
      <rect x="36" y="47" width="88" height="10" rx="5" className={FILL_SOLID} />
      <path d="M62 55H98C96 62 90 66 80 66C70 66 64 62 62 55Z" className={FILL_SOLID} />
    </svg>
  );
}
