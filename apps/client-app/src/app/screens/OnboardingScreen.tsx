import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, HandWaving, Robot, SealCheck, ShieldCheck, UserCircle, Wrench } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
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

interface RoleOption {
  role: UserRole;
  icon: IconGlyph;
  title: string;
  description: string;
}

const ROLES: RoleOption[] = [
  {
    role: 'client',
    icon: UserCircle,
    title: 'Mijozman',
    description: 'Usta qidirib, xizmat buyurtma qilmoqchiman',
  },
  {
    role: 'master',
    icon: Wrench,
    title: 'Ustaman',
    description: 'Ish qidirib, xizmat koʻrsatmoqchiman',
  },
];

/** Uchta afzallik + rol tanlash = toʻrtta bosqich. */
const TOTAL_STEPS = SLIDES.length + 1;

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0);

  const isRoleStep = step === SLIDES.length;

  const finish = (role: UserRole) => {
    completeOnboarding(role);

    /*
     * Usta rejimining endi oʻz uyi bor: kabinet profil sozlashga olib boradi.
     * Ilgari bu yerda "Usta ilovasi tayyorlanmoqda" toasti turardi va tanlov
     * hech narsa qilmasdi.
     */
    navigate(role === 'master' ? '/app/master' : '/app/home', { replace: true });
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

          <ul className="mt-24 flex flex-col gap-12">
            {ROLES.map((option) => (
              <li key={option.role}>
                <button
                  type="button"
                  onClick={() => finish(option.role)}
                  className={cn(
                    'flex w-full items-center gap-12 rounded-lg border border-transparent bg-surface-elevated p-16 text-left shadow-e1',
                    "[[data-theme='dark']_&]:border-border",
                    'transition-transform duration-press ease-emphasized active:scale-[0.99]',
                  )}
                >
                  <span
                    className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-md bg-primary-surface"
                    aria-hidden
                  >
                    <Icon
                      icon={option.icon}
                      size={24}
                      weight="duotone"
                      className="text-primary-pressed"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-title text-text-primary">{option.title}</span>
                    <span className="mt-2 block text-body-sm text-text-secondary">
                      {option.description}
                    </span>
                  </span>
                  <Icon icon={ArrowRight} size={16} className="shrink-0 text-text-secondary" />
                </button>
              </li>
            ))}
          </ul>
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
