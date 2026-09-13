import { ArrowRight } from '@phosphor-icons/react';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import bannerLight from '@/assets/home-banner.webp';
import bannerDark from '@/assets/home-banner-dark.webp';

/**
 * Bosh sahifa banneri — tayyor brend rasmi va uning ustidagi amal tugmasi.
 *
 * Manbalar 2048x768 PNG (yorugʻ va tungi), har birida oʻz oq hoshiyasi va
 * yumaloq burchagi bor edi — karta ichida u ikki marta yumaloqlangan boʻlib
 * koʻrinardi. Hoshiya qirqildi (1600x546 WebP, ~44–52 KB); burchak radiusi
 * 320px enda ~7,5px, konteynerning `rounded-lg` (20px) uni toʻliq yopadi.
 * Rasm matnni
 * ("Yordam kerakmi? · Ishonchli mutaxassisni toping · Uyingiz bizning
 * gʻamxoʻrligimizda") OʻZ ICHIDA olib keladi. Matn rasmda boʻlgani uchun
 * u ekran oʻqiydigan dastur uchun `aria-label` da takrorlanadi — aks holda
 * tugma "rasm" deb oʻqilardi.
 *
 * Tugma rasmning matn ustunidagi boʻsh joyga — sarlavha ostiga — foiz
 * bilan joylashtiriladi, shunda banner qanday enda boʻlsa ham tugma matn
 * bilan bir ustunda qoladi.
 *
 * Rasm ilova ichiga joylanadi (`src/assets`), tashqi manzildan yuklanmaydi:
 * APK internetsiz ochilganda ham banner boʻsh qolmaydi.
 */
export interface HomeBannerProps {
  onSelect?: () => void;
  className?: string;
}

const BANNER_LABEL = 'Yordam kerakmi? Ishonchli mutaxassisni toping — buyurtma berish';

function BannerContent() {
  return (
    <>
      {/*
        Ikki rasm — yorugʻ va tungi. Qaysi biri koʻrinishi CSS orqali
        (`data-theme`) hal qilinadi: `useTheme()` bu yerda ishlatilmaydi,
        chunki komponent preview galereyasida ThemeProviderʼsiz ham chiziladi.
        Tungi rasm nisbati yorugʻ rasmnikiga aks ettirilgan hoshiya bilan
        tenglashtirilgan (1938x595 → 1938x662), shunda banner balandligi
        temaga qarab oʻzgarmaydi.
      */}
      <img
        src={bannerLight}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover [[data-theme='dark']_&]:hidden"
      />
      <img
        src={bannerDark}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 hidden h-full w-full object-cover [[data-theme='dark']_&]:block"
      />
      {/*
        Tugma rasm ustida: chap chekkasi sarlavhaning chap chekkasi bilan
        bir chiziqda (~34%), tepasi IZOHDAN PASTDA — izohning pastki
        chegarasi 57–58% da, shuning uchun 62%. Ilgari 57% edi va tugma
        haqiqiy telefonda "Ishonchli mutaxassisni toping" soʻzlarining
        ustiga chiqib turardi. `pointer-events-none` — bosish butun
        bannerga tegishli.
      */}
      <span className="pointer-events-none absolute left-[34%] top-[62%] inline-flex h-[30px] items-center gap-4 whitespace-nowrap rounded-full bg-primary px-12 text-caption font-semibold text-on-primary shadow-primary-lift">
        Buyurtma berish
        <Icon icon={ArrowRight} size={14} weight="bold" aria-hidden />
      </span>
    </>
  );
}

export function HomeBanner({ onSelect, className }: HomeBannerProps) {
  const classes = cn(
    // Nisbat RASMNIKI (1970x673): boshqa nisbatda `object-cover` oʻng
    // chetdagi "Uyingiz bizning gʻamxoʻrligimizda" yozuvini qirqardi.
    'relative block aspect-[1970/673] w-full overflow-hidden rounded-lg bg-surface-sunken text-left shadow-e1',
    className,
  );

  if (!onSelect) {
    return (
      <div className={classes} role="img" aria-label={BANNER_LABEL}>
        {BannerContent()}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={BANNER_LABEL}
      className={cn(classes, 'transition-transform duration-press ease-emphasized active:scale-[0.99]')}
    >
      <BannerContent />
    </button>
  );
}
