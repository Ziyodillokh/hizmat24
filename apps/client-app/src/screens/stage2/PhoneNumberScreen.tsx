import { useState } from 'react';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';

/**
 * 03 · Telefon raqami.
 *
 * Kirish oqimining birinchi kiritish ekrani: foydalanuvchi raqamini yozadi va
 * shu raqamga SMS kod yuboriladi. Server xatosi bo'lsa ham bu ekranda qotib
 * qolmaydi — oqim 04-ekranga o'tadi va u yerda `warning` banner ko'rsatiladi
 * (11-bo'lim, 03-ekran).
 */
export type PhoneNumberVariant = 'empty' | 'filled' | 'error' | 'submitting';

export interface PhoneNumberScreenProps {
  variant?: PhoneNumberVariant;
}

/** 11-bo'lim: `+998` dan keyin 9 xona to'lmaguncha tugma disabled. */
const PHONE_DIGITS = 9;

/** 8.2-band: bu matn "O'z xato matnlarimiz" ro'yxatidan, o'zgartirilmaydi. */
const PHONE_ERROR = "Telefon raqamini +998 XX XXX XX XX formatida kiriting";

const INITIAL_DIGITS: Record<PhoneNumberVariant, string> = {
  empty: '',
  filled: '901234567',
  error: '901234567',
  submitting: '901234567',
};

/** `90 123 45 67` maskasi — bo'sh guruhlar chizilmaydi, kursor sakramaydi. */
function applyMask(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)]
    .filter((group) => group.length > 0)
    .join(' ');
}

/** Paste qilingan matn ham shu yerda tozalanadi — faqat raqam qoladi. */
const toDigits = (raw: string): string => raw.replace(/\D/g, '').slice(0, PHONE_DIGITS);

export function PhoneNumberScreen({ variant = 'filled' }: PhoneNumberScreenProps) {
  const [digits, setDigits] = useState(INITIAL_DIGITS[variant]);

  const isSubmitting = variant === 'submitting';
  const isComplete = digits.length === PHONE_DIGITS;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Telefon raqami" />}
      footer={
        <StickyFooter>
          <Button variant="primary" loading={isSubmitting} disabled={!isComplete}>
            Davom etish
          </Button>
        </StickyFooter>
      }
    >
      <h1 className="mt-20 text-h1 text-text-primary">Telefon raqamingizni kiriting</h1>

      {/*
        Bu matn disabled tugmaning tushuntiruvchi yozuvi vazifasini ham bajaradi
        (4-bo'lim, 5-qoida): nima uchun raqam kerakligi ekranda doim ko'rinadi.
      */}
      <p className="mt-8 text-body text-text-secondary">
        Tasdiqlash kodi SMS orqali yuboriladi
      </p>

      {/*
        `+998` prefiksi QOTIRILGAN: u inputning qiymati emas, shuning uchun
        o'chirib bo'lmaydi va maskaga aralashmaydi (11-bo'lim, 03-ekran).
      */}
      <div className="relative mt-24">
        <span
          aria-hidden
          className="pointer-events-none absolute left-16 top-0 flex h-[52px] items-center text-body-lg text-text-secondary"
        >
          +998
        </span>
        <Input
          type="text"
          inputMode="numeric"
          autoComplete="tel"
          aria-label="Telefon raqami"
          placeholder="90 123 45 67"
          value={applyMask(digits)}
          onChange={(event) => setDigits(toDigits(event.target.value))}
          disabled={isSubmitting}
          error={variant === 'error' ? PHONE_ERROR : undefined}
          className="tabular pl-64"
        />
      </div>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
