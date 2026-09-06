import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Input } from '@/components/Input';
import { OtpInput } from '@/components/OtpInput';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatPhone } from '@/lib/formatters';
import { useApp } from '../store';

const PHONE_DIGITS = 9;
const DEMO_OTP = '123456';

const toDigits = (value: string): string => value.replace(/\D/g, '').slice(0, PHONE_DIGITS);

/** 90 123 45 67 — 2-3-2-2 guruhlash. */
function maskPhoneInput(digits: string): string {
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)];
  return groups.filter(Boolean).join(' ');
}

/** 02 · Kirish taklifi. */
export function WelcomeScreen() {
  const navigate = useNavigate();

  return (
    <ScreenShell
      center
      footer={
        <StickyFooter>
          <Button variant="primary" onClick={() => navigate('/app/auth/phone')}>
            Davom etish
          </Button>
        </StickyFooter>
      }
    >
      <div className="flex flex-col items-center py-32">
        {/*
          Logotip lokapi: yolg'iz ikona ekran o'rtasida "to'ldirilmagan joy"
          taassurotini berardi. Belgi + nom birga mahsulotning kirish ekrani
          bo'lib o'qiladi.
        */}
        <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-primary/[0.12]">
          <Icon icon={Wrench} size={48} className="text-primary" />
        </span>
        <p className="mt-16 text-h2 text-text-primary">Hizmat24</p>

        <h1 className="mt-24 text-center text-h1 text-text-primary">
          Ishonchli ustani 15 daqiqada toping
        </h1>
        <p className="mt-12 text-center text-body text-text-secondary">
          Buyurtma bering — ustani tizim tayinlaydi.
        </p>
      </div>
    </ScreenShell>
  );
}

/** 03 · Telefon raqami. */
export function PhoneScreen() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState('');

  const isComplete = digits.length === PHONE_DIGITS;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Telefon raqami" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button
            variant="primary"
            disabled={!isComplete}
            onClick={() => navigate('/app/auth/otp', { state: { phone: `+998${digits}` } })}
          >
            Davom etish
          </Button>
        </StickyFooter>
      }
    >
      <h1 className="mt-16 text-h1 text-text-primary">Telefon raqamingizni kiriting</h1>
      <p className="mt-8 text-body text-text-secondary">
        Tasdiqlash kodi SMS orqali yuboriladi
      </p>

      <div className="relative mt-24">
        <span className="pointer-events-none absolute left-16 top-1/2 -translate-y-1/2 text-body-lg text-text-secondary">
          +998
        </span>
        <Input
          inputMode="numeric"
          autoComplete="tel"
          placeholder="90 123 45 67"
          value={maskPhoneInput(digits)}
          onChange={(event) => setDigits(toDigits(event.target.value))}
          className="pl-64"
        />
      </div>
    </ScreenShell>
  );
}

/** 04 · Tasdiqlash kodi. Demo kodi — 123456. */
export function OtpScreen() {
  const navigate = useNavigate();
  const { signIn } = useApp();
  const [code, setCode] = useState('');
  const [isWrong, setIsWrong] = useState(false);

  const phone = '+998901234567';

  const submit = (value: string) => {
    if (value === DEMO_OTP) {
      signIn(phone);
      navigate('/app/home', { replace: true });
      return;
    }
    setIsWrong(true);
  };

  const handleChange = (value: string) => {
    setCode(value);
    setIsWrong(false);
    if (value.length === 6) submit(value);
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Tasdiqlash kodi" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button variant="ghost" onClick={() => setCode('')}>
            Kodni qayta yuborish
          </Button>
        </StickyFooter>
      }
    >
      <h1 className="mt-16 text-h1 text-text-primary">Tasdiqlash kodi</h1>
      <p className="mt-8 text-body text-text-secondary">{formatPhone(phone)} raqamiga yuborildi</p>

      <OtpInput
        value={code}
        onChange={handleChange}
        state={isWrong ? 'error' : 'default'}
        autoFocus
        className="mt-24"
      />

      {isWrong && <p className="mt-12 text-body-sm text-danger">Kod noto&apos;g&apos;ri</p>}

      <p className="mt-16 text-caption text-text-secondary">Kod 5 daqiqa amal qiladi</p>

      {/*
        Demo eslatmasi ataylab alohida blokda: backend ulanmagunicha SMS
        kelmaydi, shuning uchun kodni qayerdan olishni aytish kerak. Oddiy
        matn qatori sifatida u tashlab ketilgan xatolik kabi ko'rinardi.
      */}
      <div className="mt-16 rounded-md border border-border bg-surface-sunken px-16 py-12">
        <p className="text-body-sm text-text-secondary">
          Demo rejimi — tasdiqlash kodi:{' '}
          <span className="tabular text-numeric-sm text-text-primary">{DEMO_OTP}</span>
        </p>
      </div>
    </ScreenShell>
  );
}
