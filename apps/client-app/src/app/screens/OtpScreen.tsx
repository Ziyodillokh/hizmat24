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
import { ApiError } from '@/api/client';
import { requestOtp, verifyOtp, type OtpRequestResult } from '@/api/auth';
import { isApiEnabled } from '@/api/client';
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

/** Oxirgi soʻrovlar: raqam → natija va vaqt. Qisqa oyna ichida qayta ishlatiladi. */
const recentOtpRequests = new Map<string, { at: number; result: Promise<OtpRequestResult> }>();
const OTP_DEDUPE_MS = 5000;

function requestOtpOnce(phone: string): Promise<OtpRequestResult> {
  const recent = recentOtpRequests.get(phone);
  if (recent && Date.now() - recent.at < OTP_DEDUPE_MS) return recent.result;

  const result = requestOtp(phone);
  recentOtpRequests.set(phone, { at: Date.now(), result });
  // Xato boʻlsa keshda qolmasin — qayta urinish haqiqiy soʻrov yuborsin.
  result.catch(() => recentOtpRequests.delete(phone));
  return result;
}

export function OtpScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithSession } = useApp();

  const [code, setCode] = useState('');
  const [isWrong, setIsWrong] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  /**
   * Serverdan kelgan sinov kodi. U FAQAT ishlab chiqish sozlamasida
   * qaytadi; production serverida bu maydon hech qachon toʻlmaydi va
   * ekranda ham hech narsa koʻrinmaydi.
   */
  const [debugCode, setDebugCode] = useState<string | null>(null);

  // Raqam kirish ekranidan keladi; toʻgʻridan-toʻgʻri ochilsa zaxira qiymat.
  const phone = (location.state as { phone?: string } | null)?.phone ?? '+998901234567';
  const digits = phone.replace('+998', '');

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  /*
   * Kod ekran ochilganda soʻraladi: raqam kiritish ekrani faqat raqamni
   * yigʻadi va SMS yuborilgani haqida hech narsa vaʼda qilmaydi.
   *
   * `requestOtpOnce` — bir necha soniya ichida bitta raqamga IKKINCHI
   * soʻrov ketmaydi (natija qayta ishlatiladi). Jonli serverda ekran
   * ikki marta soʻrov yuborayotgani koʻrindi; server IP boʻyicha
   * chegaralagani uchun foydalanuvchi ikkinchi kirishdayoq 429 olardi.
   */
  const askForCode = useCallback(async () => {
    if (!isApiEnabled()) return;
    setIsSending(true);
    try {
      const result = await requestOtpOnce(phone);
      setSecondsLeft(result.retryAfterSeconds);
      setDebugCode(result.debugCode);
      setErrorText(null);
    } catch (error) {
      setErrorText(
        error instanceof ApiError && error.kind === 'server'
          ? error.message
          : 'SMS soʻrovi yuborilmadi — ulanishni tekshiring.',
      );
    } finally {
      setIsSending(false);
    }
  }, [phone]);

  useEffect(() => {
    void askForCode();
  }, [askForCode]);

  const submit = useCallback(
    async (value: string) => {
      // Mock rejim: server ulanmagan boʻlsa eski demo kod ishlaydi.
      if (!isApiEnabled()) {
        if (value !== DEMO_OTP) {
          setIsWrong(true);
          setErrorText('Kod notoʻgʻri. Qaytadan kiriting.');
          return;
        }
        signIn(phone);
        navigate('/app/onboarding', { replace: true });
        return;
      }

      setIsSending(true);
      try {
        const session = await verifyOtp(phone, value);
        signInWithSession(session);
        navigate('/app/onboarding', { replace: true });
      } catch (error) {
        setIsWrong(true);
        // Serverning oʻz matni koʻrsatiladi: «kod eskirgan», «urinishlar
        // tugadi» — bularning har biri boshqa harakat talab qiladi.
        setErrorText(
          error instanceof ApiError && error.kind === 'server'
            ? error.message
            : 'Ulanish yoʻq. Qaytadan urinib koʻring.',
        );
      } finally {
        setIsSending(false);
      }
    },
    [navigate, phone, signIn, signInWithSession],
  );

  const handleChange = (value: string) => {
    setCode(value);
    setIsWrong(false);
    setErrorText(null);
    // Kod toʻlgach avtomatik yuboriladi — tugmani bosish shart emas, lekin
    // tugma ham qoladi: avtomatik yuborish sodir boʻlganini hamma ham sezmaydi.
    if (value.length === OTP_LENGTH) void submit(value);
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

        {/* Sarlavha holatni aytadi: soʻrov ketayotganda «yuborildi» deyish
            — foydalanuvchi kutayotgan daqiqadagi kichik yolgʻon. */}
        <h1 className="mt-16 text-h2 text-text-primary">
          {isSending && code.length === 0 ? 'SMS kod yuborilmoqda' : 'SMS kod yuborildi'}
        </h1>
        <p className="mt-4 text-body text-text-secondary">{maskPhoneDigits(digits)} ga</p>
      </div>

      <OtpInput
        value={code}
        onChange={handleChange}
        state={isWrong ? 'error' : 'default'}
        autoFocus
        className="mt-24"
      />

      {errorText && <p className="mt-12 text-center text-body-sm text-danger">{errorText}</p>}

      <Button
        variant="primary"
        disabled={code.length !== OTP_LENGTH || isSending}
        loading={isSending}
        loadingLabel="Tekshirilmoqda"
        onClick={() => void submit(code)}
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
              setCode('');
              setIsWrong(false);
              setErrorText(null);
              setSecondsLeft(RESEND_SECONDS);
              void askForCode();
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
      {/*
        Kod qayerdan olinishi AYTILADI: mock rejimda doimiy demo kod, server
        ulangan ishlab chiqish rejimida esa serverning oʻzi qaytargan kod.
        Production serverida `debugCode` kelmaydi va bu blok chizilmaydi.
      */}
      {(!isApiEnabled() || debugCode) && (
        <div className={cn('mt-24 flex items-start gap-8 rounded-md bg-warning-surface px-12 py-12')}>
          <Icon icon={Lightbulb} size={16} weight="duotone" className="mt-2 shrink-0 text-warning" />
          <p className="text-body-sm text-warning">
            {isApiEnabled() ? 'Sinov rejimi — server qaytargan kod: ' : 'Demo rejimi — tasdiqlash kodi: '}
            <span className="tabular font-semibold">{debugCode ?? DEMO_OTP}</span>
          </p>
        </div>
      )}

      <div className="h-24" aria-hidden />
    </ScreenShell>
  );
}
