import { ArrowRight } from 'lucide-react';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import bannerWorker from '@/assets/banner-worker.jpg';

/**
 * Bosh sahifa banneri — fotosurat va uning ustidagi chaqiriq.
 *
 * Rasm ilova ichiga joylanadi (`src/assets`), tashqi manzildan yuklanmaydi:
 * APK internetsiz ochilganda ham banner boʻsh qolmasligi kerak. Fayl 1050x420
 * — banner ~350x140 CSS px, ya'ni DPR 3 gacha yetadi — va 27 KB.
 *
 * Matn oʻng tomonda: fotoda usta chapda turadi va oʻng yarmi boʻsh. Ustiga
 * `banner-scrim` gradienti tushadi — chapda shaffof (usta ochiq qoladi), oʻngda
 * esa brend rangiga aylanadi. Usiz oq matn fotodagi ochiq turkuaz ustida
 * 2,4:1 berardi, yaʼni telefonda oʻqilmasdi.
 */
export interface HomeBannerProps {
  onSelect?: () => void;
  className?: string;
}

function BannerContent() {
  return (
    <>
      <img
        src={bannerWorker}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover object-left-top"
      />
      {/* Tungi rejimda foto sahifadan yorqinroq turib qolmasin. */}
      <span
        aria-hidden
        className="banner-scrim absolute inset-0 [[data-theme='dark']_&]:bg-surface/[0.3]"
      />

      {/* Chapdagi ~46% ustaga qoldiriladi. */}
      <span className="relative flex h-full flex-col items-start justify-center pl-[44%] pr-16">
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
    'relative block h-[140px] w-full overflow-hidden rounded-lg bg-surface-hero-deep text-left',
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
