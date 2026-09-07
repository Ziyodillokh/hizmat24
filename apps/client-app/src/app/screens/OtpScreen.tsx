import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, DeviceMobile, Lightbulb } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { OtpInput } from '@/components/OtpInput';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { maskPhoneDigits } from '@/lib/phone';
import { useApp } from '../store';

/**
 * SMS tasdiqlash.
 *
 * Kod UZUNLIGI 6 ta raqam — backend `OTP_LENGTH = 6` bilan kod generatsiya
 * qiladi (libs/shared-kernel). Interfeysda 4 ta katak qoldirilsa, backend
 * ulangan kunning oʻzida kirish butunlay ishlamay qolardi.
 *
 * Qayta yuborish taymeri HAQIQIY: har soniyada kamayadi va nolga
 * yetgandagina tugma faollashadi. Qatʼiy "60 soniya" yozuvi kutish
 * tugaganini bildirmaydi va foydalanuvchi tugmani qachon bosishni bilmaydi.
 */
const OTP_LENGTH = 6;
const DEMO_OTP = '123456';
const RESEND_SECONDS = 60;

export function OtpScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useApp();

  const [code, setCode] = useState('');
  const [isWrong, setIsWrong] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  // Raqam kirish ekranidan keladi; toʻgʻridan-toʻgʻri ochilsa zaxira qiymat.
  const phone = (location.state as { phone?: string } | null)?.phone ?? '+998901234567';
  const digits = phone.replace('+998', '');

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const submit = useCallback(
    (value: string) => {
      if (value !== DEMO_OTP) {
        setIsWrong(true);
        return;
      }
      signIn(phone);
      navigate('/app/onboarding', { replace: true });
    },
    [navigate, phone, signIn],
  );

  const handleChange = (value: string) => {
    setCode(value);
    setIsWrong(false);
    // Kod toʻlgach avtomatik yuboriladi — tugmani bosish shart emas, lekin
    // tugma ham qoladi: avtomatik yuborish sodir boʻlganini hamma ham sezmaydi.
    if (value.length === OTP_LENGTH) submit(value);
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="SMS tasdiqlash" onBack={() => navigate(-1)} />}
    >
      <div className="flex flex-col items-center pt-24">
        <span
          className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primary-surface"
          aria-hidden
        >
          <Icon icon={DeviceMobile} size={40} weight="duotone" className="text-primary-pressed" />
        </span>

        <h1 className="mt-16 text-h2 text-text-primary">SMS kod yuborildi</h1>
        <p className="mt-4 text-body text-text-secondary">{maskPhoneDigits(digits)} ga</p>
      </div>

      <OtpInput
        value={code}
        onChange={handleChange}
        state={isWrong ? 'error' : 'default'}
        autoFocus
        className="mt-24"
      />

      {isWrong && (
        <p className="mt-12 text-center text-body-sm text-danger">
          Kod notoʻgʻri. Qaytadan kiriting.
        </p>
      )}

      <Button
        variant="primary"
        disabled={code.length !== OTP_LENGTH}
        onClick={() => submit(code)}
        leadingIcon={Check}
        className="mt-20"
      >
        Tasdiqlash
      </Button>

      <div className="mt-16 text-center">
        {secondsLeft > 0 ? (
          <p className="text-body-sm text-text-secondary">
            SMS <span className="tabular font-semibold text-text-primary">{secondsLeft}</span>{' '}
            soniyada keladi
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              setSecondsLeft(RESEND_SECONDS);
              setCode('');
              setIsWrong(false);
            }}
            className="text-body-sm font-semibold text-primary-pressed"
          >
            Kodni qayta yuborish
          </button>
        )}
      </div>

      {/*
        Demo eslatmasi ataylab alohida blokda: backend ulanmagunicha SMS
        kelmaydi, shuning uchun kodni qayerdan olishni aytish kerak.
      */}
      <div
        className={cn(
          'mt-24 flex items-start gap-8 rounded-md bg-warning-surface px-12 py-12',
        )}
      >
        <Icon icon={Lightbulb} size={16} weight="duotone" className="mt-2 shrink-0 text-warning" />
        <p className="text-body-sm text-warning">
          Demo rejimi — tasdiqlash kodi:{' '}
          <span className="tabular font-semibold">{DEMO_OTP}</span>
        </p>
      </div>

      <div className="h-24" aria-hidden />
    </ScreenShell>
  );
}
