import { ArrowRight } from '@phosphor-icons/react';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import workerPhoto from '@/assets/worker.webp';

/**
 * Bosh sahifa banneri — usta fotosurati brend maydoni ustida.
 *
 * Fotoning FONI olib tashlangan (alfa kanalli WebP, 480x529, 38 KB) va figura
 * bevosita `banner-field` gradientiga qoʻyiladi.
 *
 * Nega shunday: manba fotoning oʻz foni tekis emas edi — chap yuqori burchakda
 * toʻqroq egri dogʻ bor va u bannerda soya boʻlib koʻrinardi. Foto toʻliq
 * ishlatilganda uni yashirishning yagona yoʻli matn ostiga gradient parda
 * qoʻyish edi, parda esa ustaning oʻng yelkasini ham qoraytirardi. Fonni
 * butunlay olib tashlash ikkala muammoni ham yoʻq qiladi va banner brend
 * rangida qoladi.
 *
 * Rasm ilova ichiga joylanadi (`src/assets`), tashqi manzildan yuklanmaydi:
 * APK internetsiz ochilganda ham banner boʻsh qolmaydi.
 */
export interface HomeBannerProps {
  onSelect?: () => void;
  className?: string;
}

function BannerContent() {
  return (
    <>
      {/* Figura pastki chetga tayanadi — banner "yerga" oʻtirgandek koʻrinadi. */}
      <img
        src={workerPhoto}
        alt=""
        aria-hidden
        className="absolute bottom-0 left-8 h-[128px] w-auto"
      />

      {/* Chapdagi ~40% ustaga qoldiriladi. */}
      <span className="relative flex h-full flex-col items-start justify-center pl-[40%] pr-16">
        <span className="text-h3 uppercase text-on-primary-deep">Yordam kerakmi?</span>
        <span className="mt-2 text-caption text-on-primary-deep/[0.92]">
          Ishonchli mutaxassisni toping
        </span>
        <span className="mt-8 inline-flex h-[34px] shrink-0 items-center gap-4 whitespace-nowrap rounded-full bg-on-primary-deep px-12 text-button-sm text-primary-deep">
          Buyurtma berish
          <Icon icon={ArrowRight} size={16} aria-hidden />
        </span>
      </span>
    </>
  );
}

export function HomeBanner({ onSelect, className }: HomeBannerProps) {
  const classes = cn(
    'banner-field relative block h-[140px] w-full overflow-hidden rounded-lg text-left',
    className,
  );

  if (!onSelect) {
    return <div className={classes}>{BannerContent()}</div>;
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        classes,
        'transition-transform duration-press ease-emphasized active:scale-[0.99]',
      )}
    >
      <BannerContent />
    </button>
  );
}
