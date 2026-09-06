import { Warning } from '@phosphor-icons/react';
import { useState } from 'react';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { OtpInput, type OtpState } from '@/components/OtpInput';
import { SkeletonText } from '@/components/Skeleton';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatPhone } from '@/lib/formatters';
import { USER } from '@/mocks/user';

/**
 * 04 · Tasdiqlash kodi.
 *
 * Bu ekranda raqam TOʻLIQ koʻrsatiladi (8.3-band istisnosi): foydalanuvchi
 * kod qaysi raqamga ketganini tekshira olishi kerak, shuning uchun
 * `formatPhone()` ishlatiladi, `maskPhone()` emas.
 */
export type OtpVariant =
  | 'default'
  | 'submitting'
  | 'invalid'
  | 'expired'
  | 'attempts-exhausted'
  | 'too-many-attempts'
  | 'sms-failed'
  | 'timer-done';

export interface OtpScreenProps {
  variant?: OtpVariant;
}

/** 8.2-band: "Oʻz xato matnlarimiz" roʻyxatidan, oʻzgartirilmaydi. */
const SMS_FAILED_TEXT =
  "SMS yuborishda xatolik. Kod kelmasa, taymer tugagach qayta soʻrang.";
const TOO_MANY_ATTEMPTS_TEXT = "Juda koʻp urinish. 5 daqiqadan keyin qayta urinib koʻring.";

/** 11-boʻlim, 04-ekran: taymer 00:59 dan sanaydi. */
const RESEND_SECONDS = 59;

const INITIAL_CODE: Record<OtpVariant, string> = {
  default: '',
  submitting: '123456',
  invalid: '123456',
  expired: '123456',
  'attempts-exhausted': '123456',
  'too-many-attempts': '123456',
  'sms-failed': '',
  'timer-done': '',
};

const OTP_STATE: Record<OtpVariant, OtpState> = {
  default: 'default',
  submitting: 'default',
  // `error` + shake FAQAT notoʻgʻri kod uchun (11-boʻlim, 04-ekran).
  invalid: 'error',
  // Muddati tugagan kod — kiritish xatosi emas, shuning uchun kataklar silkinmaydi.
  expired: 'default',
  // Urinishlar tugagach kataklar tahrirlanmaydi (11-boʻlim, 04-ekran).
  'attempts-exhausted': 'disabled',
  'too-many-attempts': 'disabled',
  // SMS yuborilmadi: kod baribir kelishi mumkin, shuning uchun kataklar FAOL.
  'sms-failed': 'default',
  'timer-done': 'default',
};

/** Taymeri hali yurayotgan holatlarda "Kodni qayta yuborish" bloklangan turadi. */
const RUNNING_TIMER: Record<OtpVariant, boolean> = {
  default: true,
  submitting: true,
  invalid: true,
  expired: true,
  'attempts-exhausted': true,
  'too-many-attempts': true,
  'sms-failed': true,
  'timer-done': false,
};

/**
 * Taymer matni maketda AYNAN 8.2-banddagi "Kodni qayta yuborish (00:59)"
 * koʻrinishida turishi kerak, shuning uchun sanoq jonli emas — qiymat
 * variantdan olinadi va oʻzgarmaydi.
 */
const pad = (value: number): string => value.toString().padStart(2, '0');
const countdownLabel = (seconds: number): string =>
  `Kodni qayta yuborish (${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)})`;

/**
 * 12.3-A band: OTP xatolarida server matni koʻrsatiladi va oʻzgartirilmaydi.
 * Maketda uning oʻrni 2 satrgacha blok sifatida chiziladi — oʻzimizdan matn
 * toʻqib yozilmaydi (8.2-band qoidasi).
 */
function ServerMessagePlaceholder() {
  return (
    <div className="mt-12">
      <SkeletonText lines={2} lineHeight={13} lastLineWidth="70%" />
    </div>
  );
}

export function OtpScreen({ variant = 'default' }: OtpScreenProps) {
  const [code, setCode] = useState(INITIAL_CODE[variant]);

  const otpState = OTP_STATE[variant];
  const isTimerRunning = RUNNING_TIMER[variant];
  const isSubmitting = variant === 'submitting';
  const showsServerMessage =
    variant === 'invalid' || variant === 'expired' || variant === 'attempts-exhausted';
  // Urinishlar tugagach faqat "Yangi kod soʻrash" qoladi (11-boʻlim, 04-ekran).
  const showsResend = variant !== 'attempts-exhausted';
  const showsNewCodeRequest = variant === 'expired' || variant === 'attempts-exhausted';

  return (
    <ScreenShell
      header={<Header variant="inner" title="Tasdiqlash kodi" />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            {showsNewCodeRequest && <Button variant="secondary">Yangi kod soʻrash</Button>}
            {showsResend && (
              // Kod 6-raqamda avtomatik yuboriladi — alohida "yuborish" tugmasi
              // yoʻq, shuning uchun yuklanish holatini shu yagona tugma
              // koʻrsatadi (11-boʻlim, 04-ekran; spinner 12.1-band boʻyicha
              // faqat tugma ichida ruxsat etilgan).
              <Button variant="ghost" loading={isSubmitting} disabled={isTimerRunning}>
                {isTimerRunning ? countdownLabel(RESEND_SECONDS) : 'Kodni qayta yuborish'}
              </Button>
            )}
          </div>
        </StickyFooter>
      }
    >
      {/*
        SMS yuborilmaganda tepada `warning` banner turadi. "Qayta urinish"
        tugmasi CHIZILMAYDI: cooldown allaqachon boshlangan, darhol urinish
        yangi xato beradi (12.3-B band).
      */}
      {variant === 'sms-failed' && (
        <Banner variant="warning" icon={Warning} className="mt-16">
          {SMS_FAILED_TEXT}
        </Banner>
      )}

      <h1 className="mt-20 text-h1 text-text-primary">Tasdiqlash kodi</h1>

      <div className="mt-8 flex flex-wrap items-center gap-8">
        <p className="text-body text-text-secondary">
          {formatPhone(USER.phoneNumber)} raqamiga yuborildi
        </p>
        <Button variant="ghost" size="small" fullWidth={false}>
          Oʻzgartirish
        </Button>
      </div>

      <OtpInput
        value={code}
        onChange={setCode}
        state={otpState}
        className="mt-24 justify-center"
      />

      {showsServerMessage && <ServerMessagePlaceholder />}

      {variant === 'too-many-attempts' && (
        <p className="mt-12 text-body-sm text-danger">{TOO_MANY_ATTEMPTS_TEXT}</p>
      )}

      <p className="mt-16 text-center text-caption text-text-secondary">
        Kod 5 daqiqa amal qiladi
      </p>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
