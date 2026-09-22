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
import { cityBadge } from '@/lib/serviceArea';
import { useServiceCity } from '../service-area-store';

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

/*
 * Uchala vaʼda ham bugun ISHLAYDIGAN narsani aytadi.
 *
 * "Passport va ID tekshiruvidan oʻtgan" olib tashlandi: `Master` tipida
 * bunday maydon umuman yoʻq. "24/7 AI" ham — javoblar tayyor matnlardan
 * keladi (`aiAssistant.ts` izohi buni allaqachon tan oladi).
 */
const BENEFITS: Benefit[] = [
  {
    icon: ShieldCheck,
    title: 'Naqd toʻlov — pul sizda',
    description: 'Ishni koʻrmaguningizcha toʻlamaysiz, bekor qilish bepul',
  },
  {
    icon: SealCheck,
    title: 'Usta haqida maʼlumot ochiq',
    description: 'Reyting va bajarilgan ishlar soni ishdan oldin koʻrinadi',
  },
  {
    icon: Robot,
    title: 'AI yordamchi',
    description: 'Narx, jadval va kafolat boʻyicha tayyor javoblar',
  },
];

export function LoginScreen() {
  const navigate = useNavigate();
  const city = useServiceCity();
  const [digits, setDigits] = useState('');

  const isComplete = digits.length === PHONE_DIGITS;

  const submit = () => {
    if (!isComplete) return;
    navigate('/app/auth/otp', { state: { phone: `+998${digits}` } });
  };

  return (
    <ScreenShell>
      <div className="flex flex-col items-center pt-24">
        <BrandMark className="h-[96px] w-[96px]" />
        <p className="mt-12 text-wordmark text-text-primary">Hizmat24</p>
        {/*
          Ilovaning BIRINCHI jumlasi. «Oʻzbekistonning professional
          xizmatlar platformasi» degan edi — ikkalasi ham rost emas:
          platforma faqat santexnika bilan va faqat bitta shaharda
          ishlaydi. Shahar nomi serverdan keladi.
        */}
        <p className="mt-8 text-center text-body text-text-secondary">
          {cityBadge(city)} uchun santexnika ustalari
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

        {/*
          Kirish ekranida IKKITA tugma boʻlmaydi: bitta raqam, bitta OTP,
          bitta sessiya — rejim keyingi qadamda tanlanadi.
        */}
        <p className="mt-12 text-center text-body-sm text-text-secondary">
          Mijoz ham, usta ham shu raqam orqali kiradi — rejimni keyingi qadamda tanlaysiz.
        </p>

        <p className="mt-8 text-center text-body-sm text-text-secondary">
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
