import { WorkerIllustration } from '@/components/WorkerIllustration';
import { cn } from '@/lib/cn';

/**
 * 06-ekran, 4-blok: banner.
 *
 * Referens proporsiyasi: balandlik kenglikning ~42% i, chap yarmida ishchi
 * illyustratsiyasi banner pastki chetiga tegib turadi, o'ng yarmida chaqiriq
 * matni va CTA.
 *
 * Fon `surface-hero-deep` — oq matn faqat TO'Q teal ustida ishlatiladi
 * (4-bo'lim, 2-punkt).
 */
export interface HomeBannerProps {
  onSelect?: () => void;
  className?: string;
}

function BannerContent() {
  return (
    <>
      {/*
        Illyustratsiya konteyneri: kengligi banner kengligining 40% i, balandligi
        to'liq. SVG `xMidYMax` bilan tekislanadi, ya'ni ortiqcha bo'shliq faqat
        tepadan olinadi va byust pastki chetga tegib turadi.
      */}
      <span className="relative h-full w-[40%] shrink-0 self-end">
        <WorkerIllustration className="absolute bottom-0 h-full w-full text-on-primary-deep" />
      </span>

      <span className="flex min-w-0 flex-1 flex-col items-start justify-center py-16 pr-16">
        {/* Bosh harflar bilan yozilgan sarlavha ("YORDAM KERAKMI?") reklama
            bannerga o'xshab qolardi — oddiy gap ko'rinishi tinchroq va
            ishonchliroq o'qiladi. */}
        <span className="text-h2 text-on-primary-deep">Yordam kerakmi?</span>
        <span className="mt-4 text-body text-on-primary-deep">Ishonchli ustani toping</span>
        {/* To'ldirilgan oq tugma: ilgari u 20% shaffof oq edi va o'chirilgan
            tugmaga o'xshab ko'rinardi. */}
        <span className="mt-12 inline-flex h-[36px] items-center rounded-full bg-on-primary-deep px-16 text-button-sm text-primary-deep">
          Ustani chaqirish
        </span>
      </span>
    </>
  );
}

export function HomeBanner({ onSelect, className }: HomeBannerProps) {
  const classes = cn(
    'flex w-full items-stretch overflow-hidden rounded-lg bg-surface-hero-deep text-left',
    'aspect-[100/42]',
    className,
  );

  if (!onSelect) {
    return <div className={classes}>{BannerContent()}</div>;
  }

  return (
    <button type="button" onClick={onSelect} className={cn(classes, 'active:scale-[0.99]')}>
      <BannerContent />
    </button>
  );
}
