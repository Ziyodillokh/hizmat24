import { Crown, Medal } from '@phosphor-icons/react';
import { BrandMark } from '@/components/BrandMark';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import { formatPercent, splitFormattedPrice } from '@/lib/formatters';
import type { Level } from '@/lib/wallet';
import { cardAriaLabel, type CardHolder } from '@/lib/walletCard';

/**
 * "Hizmat24 karta" — aʼzolik kartasi.
 *
 * Bu BANK KARTASI EMAS va BALANS EMAS: unda karta raqami, muddati, CVV,
 * bank belgisi yoʻq va propʼlarida ham bunday maydon yoʻq — kelajakda
 * "shunchaki qoʻshib qoʻyish" mumkin boʻlmasin. Kartada faqat haqiqiy
 * narsalar: egasining ismi va maskalangan raqami, REAL daraja chegirmasi
 * (har buyurtmada checkoutʼda qoʻllanadi) va shu oyda ALLAQACHON toʻlangan pul.
 *
 * Bosilmaydi — u maʼlumot obyekti, tugma emas; navigatsiya pastdagi
 * plitkalarda. Balandlik kontentdan: qatʼiy nisbat past ekranlarda matnni
 * kesib qoʻyardi.
 */
export interface MemberCardProps {
  holder: CardHolder;
  level: Level;
  /** Shu oyda toʻlangan pul — hech qachon "balans" deb yozilmaydi. */
  spentThisMonth: number;
  /** "Sentabrda sarflangan" (`spentOverline`). */
  overline: string;
  /** "5 ta buyurtma" · "oxirgi toʻlov 26-avgust" · "buyurtma yoʻq" (`monthCaption`). */
  caption: string;
  className?: string;
}

/**
 * Nishon matni har darajada OQ: Lightʼda sariq matn toʻq shisha ustida
 * 2.8:1 dan oshmaydi. Oltin daraja toj ikonasi va sariq halqa bilan ajraladi.
 */
const BADGE_TONES: Record<Level['key'], string> = {
  bronze: 'ring-on-primary-deep/[0.28]',
  silver: 'ring-on-primary-deep/[0.28]',
  gold: 'ring-illus-hi-vis/[0.45]',
};

const BADGE_ICON_TONES: Record<Level['key'], string> = {
  bronze: 'text-on-primary-deep',
  silver: 'text-on-primary-deep',
  gold: 'text-illus-hi-vis',
};

export function MemberCard({ holder, level, spentThisMonth, overline, caption, className }: MemberCardProps) {
  const spent = splitFormattedPrice(spentThisMonth);

  return (
    <section
      role="group"
      aria-label={cardAriaLabel(level, holder)}
      className={cn(
        'member-card relative flex w-full flex-col gap-24 overflow-hidden rounded-lg p-20 text-on-primary-deep',
        className,
      )}
    >
      {/*
        Bezak: ikkita xira doira — plastik ustidagi yorugʻlik aksi. Shaffoflik
        past (0.04/0.03): ular matn ostidan oʻtadi va kontrastni yemasligi kerak.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-48 -top-64 h-[220px] w-[220px] rounded-full bg-on-primary-deep/[0.04]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-64 right-40 h-[180px] w-[180px] rounded-full bg-on-primary-deep/[0.03]"
      />

      {/* Tepa qator: brend + daraja nishoni. */}
      <div className="relative flex items-center justify-between gap-12">
        <div className="flex min-w-0 items-center gap-8">
          <BrandMark
            decorative
            className="h-[32px] w-[32px] shrink-0 rounded-xs ring-1 ring-on-primary-deep/[0.28]"
          />
          <p className="truncate text-title text-on-primary-deep">Hizmat24 karta</p>
        </div>

        {/*
          Nishon oʻng yuqoridagi yorugʻlik dogʻi ustida turadi — shuning uchun
          fon shaffof oq emas, TOʻQ shisha (`surface-hero-deep/0.45`): oq matn
          dogʻ ustida ham 4.5:1 dan yuqori qoladi.
        */}
        <span
          className={cn(
            'inline-flex h-[28px] shrink-0 items-center gap-4 rounded-full bg-surface-hero-deep/[0.45] px-12 text-badge text-on-primary-deep ring-1 ring-inset',
            BADGE_TONES[level.key],
          )}
        >
          <Icon
            icon={level.key === 'gold' ? Crown : Medal}
            size={16}
            weight="fill"
            className={BADGE_ICON_TONES[level.key]}
            aria-hidden
          />
          {level.label} · {formatPercent(level.discountPercent)}
        </span>
      </div>

      {/* Oʻrta: egasi. Ism yoʻq boʻlsa maskalangan raqam shu yerda turadi. */}
      <div className="relative min-w-0">
        <p className="truncate text-title uppercase text-on-primary-deep">{holder.primary}</p>
        {/* Toʻliq oq: 0.84 shaffoflik Lightʼda 4.3:1 berardi. Ierarxiya oʻlcham bilan. */}
        {holder.secondary && (
          <p className="tabular mt-2 truncate text-caption text-on-primary-deep">
            {holder.secondary}
          </p>
        )}
      </div>

      {/* Past: shu oyda sarflangan. "Balans" soʻzi bu yerda hech qachon yozilmaydi. */}
      <div className="relative">
        <p className="truncate text-overline uppercase text-on-primary-deep">{overline}</p>
        <div className="mt-2 flex items-baseline justify-between gap-12">
          <p className="tabular min-w-0 truncate text-h1 text-on-primary-deep">
            {spent.value}{' '}
            <span className="text-currency text-on-primary-deep">{spent.currency}</span>
          </p>
          <p className="shrink-0 text-caption text-on-primary-deep">{caption}</p>
        </div>
      </div>
    </section>
  );
}
