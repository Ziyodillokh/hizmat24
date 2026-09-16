import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, HandWaving, Robot, SealCheck, ShieldCheck } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { ModeChoiceCards } from '@/components/ModeChoiceCards';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { HOME_ROUTE_FOR } from '@/lib/appMode';
import { cn } from '@/lib/cn';
import { useApp } from '../store';
import type { UserRole } from '../types';

/**
 * Tanishtiruv oqimi: uchta afzallik ekrani va yakunda rol tanlash.
 *
 * Oqim BIR MARTA koʻrsatiladi — tugagach `hasOnboarded` saqlanadi. Har
 * kirishda takrorlansa, u foydalanuvchini ilovaga kirishdan toʻsuvchi
 * toʻsiqqa aylanadi.
 *
 * Har bosqichda "Oʻtkazib yuborish" bor: tanishtiruv majburiy emas va uni
 * yopib boʻlmaydigan qilish — ilovaga kirishni sekinlashtiradi.
 */
interface Slide {
  icon: IconGlyph;
  title: string;
  description: string;
}

/*
 * Ilovaning birinchi uchta jumlasi — eng qimmat vaʼdalar. Har biri bugun
 * ISHLAYDIGAN narsani aytadi va chegarasini oʻzi bilan olib yuradi.
 */
const SLIDES: Slide[] = [
  {
    icon: ShieldCheck,
    title: 'Pul ish bajarilgach beriladi',
    description:
      'Hozir buyurtma naqd toʻlanadi — pul ilova orqali oʻtmaydi va ishni koʻrmaguningizcha sizda qoladi. Ixtiyoriy kafolatli toʻlov Click va Payme ulangach qoʻshiladi.',
  },
  {
    icon: SealCheck,
    title: 'Ustani oʻzingiz tekshirasiz',
    description:
      'Sertifikat belgisi, reyting va bajarilgan buyurtmalar soni har bir usta kartasida koʻrsatiladi. Usta eshik oldida kelganda suratini solishtirasiz — mos kelmasa buyurtma toʻxtatiladi.',
  },
  {
    icon: Robot,
    title: 'AI yordamchi doim yoningizda',
    description:
      'Narx, jadval va kafolat boʻyicha savol bering. Javoblar hozircha tayyor matnlardan keladi — bu haqiqiy AI emas.',
  },
];

/** Uchta afzallik + rejim tanlash = toʻrtta bosqich. */
const TOTAL_STEPS = SLIDES.length + 1;

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);

  const isRoleStep = step === SLIDES.length;

  const finish = (role: UserRole) => {
    completeOnboarding(role);

    /*
     * Har bir rejimning oʻz uyi bor va u `HOME_ROUTE_FOR` da yozilgan —
     * kirish ayrilishi ham, gvardiya ham AYNAN shu jadvaldan oʻqiydi.
     */
    navigate(HOME_ROUTE_FOR[role], { replace: true });
  };

  return (
    <ScreenShell
      footer={
        isRoleStep ? undefined : (
          <StickyFooter>
            <Button
              variant="primary"
              onClick={() => setStep((value) => value + 1)}
              trailingIcon={ArrowRight}
            >
              Davom etish
            </Button>

            <div className="mt-12 flex items-center justify-between gap-12">
              <button
                type="button"
                onClick={() => setStep(SLIDES.length)}
                className="text-body-sm text-text-secondary"
              >
                Oʻtkazib yuborish
              </button>
              <button
                type="button"
                onClick={() => finish('master')}
                className="text-body-sm font-semibold text-primary-pressed"
              >
                Usta boʻlish →
              </button>
            </div>
          </StickyFooter>
        )
      }
    >
      {/* Bosqich koʻrsatkichi: joriy bosqich choʻzilgan chiziq bilan belgilanadi. */}
      <div className="flex items-center justify-center gap-8 pt-16" aria-hidden>
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-8 rounded-full transition-all duration-state ease-std',
              index === step ? 'w-24 bg-primary' : 'w-8 bg-border-strong',
            )}
          />
        ))}
      </div>

      {isRoleStep ? (
        <>
          <div className="flex flex-col items-center pt-32">
            <span
              className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-primary-surface"
              aria-hidden
            >
              <Icon icon={HandWaving} size={48} weight="duotone" className="text-primary-pressed" />
            </span>
            <h1 className="mt-20 text-center text-h1 text-text-primary">Bugun kimsiz?</h1>
            <p className="mt-8 text-center text-body text-text-secondary">
              Xavotir olmang — keyinchalik profil orqali istalgan vaqt almashtira olasiz
            </p>
          </div>

          {/* Kartalar `/app/mode` bilan BITTA manbadan keladi. */}
          <ModeChoiceCards className="mt-24" value={null} onChoose={finish} />
        </>
      ) : (
        <div className="flex flex-col items-center pt-32">
          <span
            className="flex h-[112px] w-[112px] items-center justify-center rounded-full bg-primary-surface"
            aria-hidden
          >
            <Icon
              icon={SLIDES[step].icon}
              size={64}
              weight="duotone"
              className="text-primary-pressed"
            />
          </span>

          <h1 className="mt-24 text-balance text-center text-h1 text-text-primary">
            {SLIDES[step].title}
          </h1>
          <p className="mt-12 text-center text-body-lg text-text-secondary">
            {SLIDES[step].description}
          </p>
        </div>
      )}

      <div className="h-24" aria-hidden />
    </ScreenShell>
  );
}
