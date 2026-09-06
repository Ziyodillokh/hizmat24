import { cn } from '@/lib/cn';

/**
 * Bosh sahifa banneridagi ishchi illyustratsiyasi.
 *
 * Nega SVG: loyihada rasm maydoni yoʻq va tashqi fayl yuklanmaydi (APK
 * internetsiz ochiladi), shuning uchun figura inline vektor sifatida chiziladi.
 *
 * NEGA BYUST: banner ichida rasm atigi ~117x147px joy oladi. Butun gavda —
 * koʻtarilgan qoʻl, kalit, kombinezon — shu oʻlchamda tanib boʻlmaydigan
 * oq massaga aylanardi. Kadr qanchalik tor boʻlsa, shakl shunchalik kam
 * boʻlishi kerak: dubulgʻa, bosh va yelkalar yetarli.
 *
 * SOYALASH QOIDASI: soya qatʼiy shakl USTIGA `illus-shade` ni maʼlum
 * shaffoflikda boʻyash orqali beriladi — hech qachon shaklning oʻz
 * shaffofligini foniga qarab pasaytirish bilan emas. Ilgari butun figura
 * bitta oq rangning yettita shaffoflik darajasidan iborat edi va teri,
 * paxta, jinsi hamda poʻlat material sifatida farqlanmasdi.
 *
 * ASIMMETRIYA: markaziy oʻq x=76 da, ramka markazi x=80 da emas; dubulgʻa
 * qovurgʻasi ham gumbaz markazidan siljigan. Qoʻlda chizilgan hech narsa
 * aynan simmetrik boʻlmaydi.
 *
 * YUZSIZ: bosh biroz burilgan va faqat siluet bilan beriladi — ikkita
 * nuqta-koʻz va yoy-tabassum figurani emoji qiyofasiga aylantirardi.
 */

/** Takrorlanuvchi toʻldirishlar — Tailwind skaneri uchun toʻliq klass matni. */
const LIT = 'fill-on-primary-deep';
const SHADE_HALF = 'fill-illus-shade/[0.55]';
const SHADE_SOFT = 'fill-illus-shade/[0.35]';
const SHADE_CONTACT = 'fill-illus-shade/[0.5]';
const SKIN = 'fill-on-primary-deep/[0.46]';
const DENIM = 'fill-primary-deep';
const HI_VIS = 'fill-illus-hi-vis';
const HI_VIS_SHADE = 'fill-illus-shade/[0.28]';

export function WorkerIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 200"
      preserveAspectRatio="xMidYMax meet"
      role="presentation"
      aria-hidden
      className={cn('block overflow-hidden', className)}
    >
      {/* ---- Yelkalar. Yassi tepa + qiya yelka chizigʻi + deyarli tik yon
             tomonlar. Yarim doira "igloo" boʻlib koʻrinardi: odam yelkasi
             hech qachon doira emas. ---- */}
      <path
        d="M78 122C64 122 52 126 44 134L27 152C21 159 18 172 17 200H141C140 172 137 159 131 152L114 134C106 126 92 122 78 122Z"
        className={LIT}
      />
      {/* Yorugʻlik chegarasi yumshoq egri boʻylab oʻtadi. */}
      <path
        d="M92 126C102 130 109 134 114 134L131 152C137 159 140 172 141 200H104C104 172 100 146 92 126Z"
        className={SHADE_HALF}
      />

      {/* ---- Yoqa ---- */}
      <path d="M66 124L78 150L90 124C86 122 70 122 66 124Z" className={SHADE_SOFT} />

      {/* ---- Kombinezon: tasmalar yelka ustidan oʻtib koʻkrakka ULANADI.
             Ilgari ular oq koʻylak ustida oq rangda edi va koʻrinmasdi. ---- */}
      <path d="M62 152L44 134L54 128L70 148Z" className={DENIM} />
      <path d="M94 150L110 130L100 125L86 146Z" className={DENIM} />
      <path d="M62 148H94A5 5 0 0 1 99 153V200H57V153A5 5 0 0 1 62 148Z" className={DENIM} />
      <path d="M80 148H94A5 5 0 0 1 99 153V200H80Z" className={SHADE_SOFT} />
      {/* Toʻqalar — tasma va koʻkrak tutashgan joyda. */}
      <rect x="59" y="150" width="12" height="7" rx="2" className={SHADE_SOFT} />
      <rect x="87" y="148" width="10" height="6" rx="2" className={SHADE_SOFT} />
      {/* Choʻntak ingichka chiziq bilan — toʻldirilgan toʻrtburchak ekranga oʻxshardi. */}
      <path d="M64 168H76V170H64Z" className={SHADE_SOFT} />

      {/* ---- Bosh: toʻq teal fon ustida qorayib ketmasligi uchun oʻrta ton ---- */}
      <path d="M54 82C54 66 64 56 78 56C92 56 102 66 102 82C102 104 92 120 78 120C64 120 54 104 54 82Z" className={SKIN} />
      <path d="M86 58C96 64 102 72 102 84C102 104 93 120 79 120C90 112 96 98 96 82C96 70 92 62 86 58Z" className={SHADE_SOFT} />

      {/* ---- Dubulgʻa: rasmning yagona iliq massasi va kirish nuqtasi ---- */}
      <path d="M46 84C46 58 60 42 78 42C96 42 110 58 110 84Z" className={HI_VIS} />
      <path d="M92 47C103 55 110 68 110 84H92Z" className={HI_VIS_SHADE} />
      <path d="M30 88C30 82 38 79 52 79H104C112 79 118 82 118 88C118 93 113 95 105 95H43C35 95 30 93 30 88Z" className={HI_VIS} />
      {/* Kozirek ostidagi kontakt soyasi — usiz dubulgʻa boshdan uzilib suzadi. */}
      <path d="M52 86H104V95H52Z" className={SHADE_CONTACT} />
      {/* Qovurgʻa gumbaz markazidan (78) siljigan — perspektiva belgisi. */}
      <rect x="71" y="44" width="5" height="36" rx="2.5" className={HI_VIS_SHADE} />
    </svg>
  );
}
