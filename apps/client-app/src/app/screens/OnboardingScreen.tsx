import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { ModeChoiceCards } from '@/components/ModeChoiceCards';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { HOME_ROUTE_FOR } from '@/lib/appMode';
import { cn } from '@/lib/cn';
import {
  NEXT_LABEL,
  ONBOARDING_SLIDES,
  ONBOARDING_STEPS,
  ROLE_STEP_HINT,
  ROLE_STEP_TITLE,
  SKIP_LABEL,
  type OnboardingSlide,
} from '@/lib/onboarding';
import { useSwipe } from '../useSwipe';
import { useApp } from '../store';
import type { UserRole } from '../types';
import workImage from '@/assets/services/santexnika-tamiri.webp';
import priceImage from '@/assets/services/suv-isitgich.webp';
import mastersImage from '@/assets/services/quvurlar.webp';
import aiImage from '@/assets/brand/ai-robot.webp';

/**
 * Tanishtiruv oqimi: toʻrtta vaʼda va yakunda rejim tanlash.
 *
 * Oqim BIR MARTA koʻrsatiladi — tugagach `hasOnboarded` saqlanadi.
 *
 * Ilgari slaydlar rangpar doira ichidagi ikonadan iborat edi va ekranning
 * pastki yarmi boʻsh qolardi — ilova tugallanmagandek koʻrinardi. Endi
 * yuqorida haqiqiy foto, pastda matn va amal: ekranning har qismi ish bajaradi.
 * Rasm — ilovadagi AYNAN oʻsha xizmat fotolari, maxsus illyustratsiya emas.
 */
const SLIDE_IMAGES: Record<OnboardingSlide['imageKey'], string> = {
  work: workImage,
  price: priceImage,
  masters: mastersImage,
  ai: aiImage,
};

/** AI maskoti kvadrat va kichik — u kesilmasligi, markazda turishi kerak. */
const CONTAIN_KEYS: readonly OnboardingSlide['imageKey'][] = ['ai'];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);
  const surfaceRef = useRef<HTMLDivElement>(null);

  const isRoleStep = step === ONBOARDING_SLIDES.length;
  const slide = ONBOARDING_SLIDES[step];

  const go = (next: number) => setStep(Math.min(Math.max(next, 0), ONBOARDING_SLIDES.length));

  // Surish — telefonda tanishtiruvning tabiiy jesti. Chekkada hech narsa
  // qilinmaydi: oxirgi slayddan keyingi qadam TANLOV, uni surib oʻtib
  // boʻlmaydi.
  useSwipe(surfaceRef, {
    onSwipe: (direction) => go(direction === 'left' ? step + 1 : step - 1),
  });

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
      className="flex flex-col"
      footer={
        isRoleStep ? undefined : (
          <StickyFooter>
            <Button variant="primary" onClick={() => go(step + 1)} trailingIcon={ArrowRight}>
              {NEXT_LABEL}
            </Button>
            <button
              type="button"
              onClick={() => go(ONBOARDING_SLIDES.length)}
              className="mt-12 min-h-touch w-full text-body-sm text-text-secondary"
            >
              {SKIP_LABEL}
            </button>
          </StickyFooter>
        )
      }
    >
      <div ref={surfaceRef} className="flex flex-1 flex-col touch-pan-y">
        {/*
          Rasm sahifa chetigacha chiqadi (`-mx-20`) va pastki burchaklari
          yumaloq: ekranning tepasi bitta yaxlit blok boʻlib koʻrinadi.
        */}
        {/*
          Rasm QOLGAN joyni oʻzi egallaydi (`flex-1`): qatʼiy balandlikda
          412×915 ekranda matn bilan tugma orasida boʻshliq qolardi. Rejim
          tanlashda esa chegara bor — kartalar pastga surilib ketmasin.
        */}
        <div
          className={cn(
            // `basis-0`: rasm faqat QOLGAN joyni oladi. `basis-auto` da u oʻz
            // tabiiy balandligini ham qoʻshib hisoblaydi va ekran bir necha
            // piksel surilib qolardi.
            'relative -mx-20 flex-1 basis-0 overflow-hidden rounded-b-lg bg-primary-surface',
            // Past ekranlarda rasm birinchi boʻlib qisqaradi — matn hech
            // qachon kesilmaydi va ekran surilmaydi.
            isRoleStep ? 'min-h-[160px] max-h-[300px]' : 'min-h-[140px]',
          )}
        >
          {isRoleStep ? (
            <div className="hero-field flex h-full flex-col items-center justify-center gap-12 px-20">
              <BrandMark className="h-[64px] w-[64px]" />
              <p className="text-title text-on-primary-deep">Hizmat24</p>
            </div>
          ) : (
            <img
              src={SLIDE_IMAGES[slide.imageKey]}
              alt=""
              draggable={false}
              className={cn(
                'h-full w-full',
                CONTAIN_KEYS.includes(slide.imageKey) ? 'object-contain p-32' : 'object-cover',
              )}
            />
          )}

          {/* Orqaga — birinchi slayddan keyin; sahifada boshqa chiqish yoʻli yoʻq. */}
          {step > 0 && !isRoleStep && (
            <button
              type="button"
              onClick={() => go(step - 1)}
              aria-label="Orqaga"
              className="absolute left-20 top-16 flex h-[40px] w-[40px] items-center justify-center rounded-full bg-surface-elevated/[0.92] shadow-e2"
            >
              <Icon icon={ArrowLeft} size={20} className="text-text-primary" />
            </button>
          )}
        </div>

        {/* Bosqich koʻrsatkichi: joriy bosqich choʻzilgan chiziq bilan. */}
        <div
          className="flex shrink-0 items-center justify-center gap-8 pt-20 [@media(max-height:700px)]:pt-12"
          aria-hidden
        >
          {Array.from({ length: ONBOARDING_STEPS }, (_, index) => (
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
          <div className="shrink-0 pt-20 [@media(max-height:700px)]:pt-12">
            <h1 className="text-center text-h1 text-text-primary [@media(max-height:700px)]:text-h2">
              {ROLE_STEP_TITLE}
            </h1>
            <p className="mt-8 text-center text-body text-text-secondary">{ROLE_STEP_HINT}</p>
            {/* Kartalar `/app/mode` bilan BITTA manbadan keladi. */}
            <ModeChoiceCards
              className="mt-24 [@media(max-height:700px)]:mt-16"
              value={null}
              onChoose={finish}
            />
          </div>
        ) : (
          <div className="shrink-0 pt-20 [@media(max-height:700px)]:pt-12">
            <h1 className="text-balance text-center text-h1 text-text-primary [@media(max-height:700px)]:text-h2">
              {slide.title}
            </h1>
            <p className="mt-12 text-center text-body-lg text-text-secondary [@media(max-height:700px)]:mt-8 [@media(max-height:700px)]:text-body">
              {slide.description}
            </p>
            {/*
              Chegara — vaʼdaning ostida va undan kichikroq: ilova nimani
              qila olmasligini birinchi ekrandayoq aytadi.
            */}
            {slide.caveat && (
              <p className="mt-16 text-center text-caption text-text-secondary [@media(max-height:700px)]:mt-8">
                {slide.caveat}
              </p>
            )}
          </div>
        )}

        <div className="h-20 shrink-0" aria-hidden />
      </div>
    </ScreenShell>
  );
}
