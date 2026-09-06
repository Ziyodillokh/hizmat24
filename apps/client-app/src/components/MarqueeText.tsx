import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Bitta qatorga sigʻmaydigan matnni sekin chapga surib koʻrsatadi.
 *
 * Nega kerak: usta ismi va familiyasi BITTA qatorda turishi shart. Tor
 * kartada "Jahongir Qodirov" sigʻmaydi va uch nuqta bilan kesilsa,
 * foydalanuvchi kim ekanini bilmaydi — familiya esa aynan ajratib turadigan
 * qism. Surilish matnni toʻliq koʻrsatadi va qator balandligini oshirmaydi.
 *
 * Surilish FAQAT haqiqatan sigʻmagan holatda yoqiladi: sigʻadigan matn
 * qimirlab tursa, u diqqatni oʻgʻirlaydi va nosozlikdek koʻrinadi.
 * `motion-safe` — tizimda harakat kamaytirilgan boʻlsa animatsiya ishlamaydi.
 */
export interface MarqueeTextProps {
  text: string;
  className?: string;
}

/** Sekundiga ~26px — oʻqishga ulguriladigan, lekin zerikarli boʻlmagan tezlik. */
const PIXELS_PER_SECOND = 26;
/** Ikki chekkada toʻxtab turish (animatsiyaning ~55% i) hisobga olingan zaxira. */
const MIN_DURATION_SECONDS = 5;

export function MarqueeText({ text, className }: MarqueeTextProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return undefined;

    const measure = () => {
      // 1px zaxira: subpiksel yaxlitlash tufayli sigʻadigan matn ham
      // "1px oshib ketgan" boʻlib chiqishi mumkin.
      const overflow = inner.scrollWidth - wrap.clientWidth;
      setDistance(overflow > 1 ? overflow : 0);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [text]);

  // Shrift kech yuklansa matn kengligi oʻzgaradi — qayta oʻlchaymiz.
  useEffect(() => {
    if (!('fonts' in document)) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      const wrap = wrapRef.current;
      const inner = innerRef.current;
      if (!wrap || !inner) return;
      const overflow = inner.scrollWidth - wrap.clientWidth;
      setDistance(overflow > 1 ? overflow : 0);
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const isScrolling = distance > 0;
  const duration = Math.max(MIN_DURATION_SECONDS, distance / PIXELS_PER_SECOND + 4);

  return (
    <span
      ref={wrapRef}
      // `title` — matn kesilgan holatda ham toʻliq nom qurilma
      // yordamchi texnologiyalariga yetib borsin.
      title={text}
      className={cn(
        'block overflow-hidden whitespace-nowrap',
        /*
         * Surilish paytida matn chekkada KESKIN kesilardi va bu buzuq
         * renderdek koʻrinardi ("Sardor" -> "ardor"). Maska chekkalarni
         * yumshoq soʻndiradi, shunda harakat ataylab qilinganini bildiradi.
         */
        isScrolling &&
          '[mask-image:linear-gradient(to_right,transparent,black_10px,black_calc(100%-10px),transparent)]',
        className,
      )}
    >
      <span
        ref={innerRef}
        className={cn('inline-block', isScrolling && 'motion-safe:animate-marquee')}
        style={
          isScrolling
            ? ({
                '--marquee-distance': `${distance}px`,
                animationDuration: `${duration}s`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </span>
  );
}
