import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Robot, SealCheck, ShieldCheck } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PhoneField } from '@/components/PhoneField';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { PHONE_DIGITS } from '@/lib/phone';
import { cn } from '@/lib/cn';

/**
 * Kirish ekrani.
 *
 * Ilgari kirish ikki bosqichda edi: taklif ekrani, keyin alohida telefon
 * ekrani. Endi ular bitta sahifada — foydalanuvchi ilovani ochishi bilan
 * raqamini kirita oladi va ortiqcha "Davom etish" bosishi kerak emas.
 *
 * Pastdagi ishonch bloki shu yerda turadi, tanishtiruvda emas: qaror aynan
 * shu ekranda qabul qilinadi va afzalliklar raqam kiritishdan OLDIN
 * koʻrinishi kerak.
 */
interface Benefit {
  icon: IconGlyph;
  title: string;
  description: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: ShieldCheck,
    title: 'Ixtiyoriy kafolat',
    description: 'Xohlasangiz, pulingiz ish tugaguncha xavfsiz saqlanadi',
  },
  {
    icon: SealCheck,
    title: 'Tasdiqlangan ustalar',
    description: 'Passport va ID tekshiruvidan oʻtgan',
  },
  {
    icon: Robot,
    title: 'AI yordamchi',
    description: '24/7 savol-javob va usta tavsiyasi',
  },
];

export function LoginScreen() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState('');

  const isComplete = digits.length === PHONE_DIGITS;

  const submit = () => {
    if (!isComplete) return;
    navigate('/app/auth/otp', { state: { phone: `+998${digits}` } });
  };

  return (
    <ScreenShell>
      <div className="flex flex-col items-center pt-24">
        <BrandMark className="h-[76px] w-[76px]" />
        <p className="mt-12 text-wordmark text-text-primary">Hizmat24</p>
        <p className="mt-8 text-center text-body text-text-secondary">
          Oʻzbekistonning professional xizmatlar platformasi
        </p>
      </div>

      <div className="mt-32">
        <PhoneField
          value={digits}
          onChange={setDigits}
          onSubmit={submit}
          label="Telefon raqam"
        />

        <Button
          variant="primary"
          disabled={!isComplete}
          onClick={submit}
          trailingIcon={ArrowRight}
          className="mt-16"
        >
          Davom etish
        </Button>

        <p className="mt-12 text-center text-body-sm text-text-secondary">
          Kirish orqali siz{' '}
          <span className="text-primary-pressed underline">foydalanish shartlariga</span> rozilik
          bildirasiz
        </p>
      </div>

      <section
        className={cn(
          'mt-24 rounded-lg border border-transparent bg-surface-elevated p-12 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <h2 className="text-title text-text-primary">Nega Hizmat24?</h2>

        <ul className="mt-12 flex flex-col gap-12">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className="flex items-start gap-12">
              <span
                className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md bg-primary-surface"
                aria-hidden
              >
                <Icon icon={benefit.icon} size={20} weight="duotone" className="text-primary-pressed" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body-lg font-semibold text-text-primary">
                  {benefit.title}
                </span>
                <span className="mt-2 block text-body-sm text-text-secondary">
                  {benefit.description}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="h-24" aria-hidden />
    </ScreenShell>
  );
}
