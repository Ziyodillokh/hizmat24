import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ApiError } from '@/api/client';
import { loginWithPassword, loginWithTotp } from '@/api/admin';
import { Button, Card, Field, Notice } from '@/components/ui';
import { useAuth, type SignOutReason } from '@/app/AuthProvider';

const SIGN_OUT_MESSAGES: Record<SignOutReason, string> = {
  idle: 'Uzoq vaqt harakat boʻlmagani uchun tizimdan chiqarildingiz',
  expired: 'Sessiya muddati tugadi — qaytadan kiring',
};

interface Challenge {
  challengeToken: string;
  enrollmentUri: string | null;
}

/**
 * Kirish — ikki bosqich, bitta ekran.
 *
 * Bosqichlar alohida marshrut EMAS: chipta faqat besh daqiqa yashaydi va
 * uni URL da olib yurish (yangilash, orqaga qaytish, havolani ulashish)
 * faqat muammo tugʻdirardi.
 */
export function LoginScreen() {
  const { signIn, signOutReason } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setIsBusy(true);
    setError(null);
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Kutilmagan xato');
    } finally {
      setIsBusy(false);
    }
  };

  const submitPassword = (form: FormData) =>
    run(async () => {
      const result = await loginWithPassword(
        String(form.get('email') ?? ''),
        String(form.get('password') ?? ''),
      );
      setChallenge({
        challengeToken: result.challengeToken,
        enrollmentUri: result.enrollmentUri,
      });
    });

  const submitTotp = (form: FormData) =>
    run(async () => {
      if (!challenge) return;
      const result = await loginWithTotp(challenge.challengeToken, String(form.get('code') ?? ''));
      signIn(result.token, result.admin);
    });

  return (
    <main className="flex min-h-full items-center justify-center bg-surface px-20 py-48">
      <Card className="w-full max-w-[400px] p-32">
        <div className="mb-24 flex items-center gap-12">
          <span className="flex h-40 w-40 items-center justify-center rounded-md bg-primary text-on-primary">
            <ShieldCheck size={22} aria-hidden />
          </span>
          <div>
            <h1 className="text-h2 text-text-primary">Hizmat24</h1>
            <p className="text-caption text-text-secondary">Boshqaruv paneli</p>
          </div>
        </div>

        {signOutReason && !challenge && !error && (
          <div className="mb-16">
            <Notice tone="warning">{SIGN_OUT_MESSAGES[signOutReason]}</Notice>
          </div>
        )}

        {error && (
          <div className="mb-16">
            <Notice>{error}</Notice>
          </div>
        )}

        {challenge ? (
          <TotpStep
            enrollmentUri={challenge.enrollmentUri}
            isBusy={isBusy}
            onSubmit={submitTotp}
            onBack={() => {
              setChallenge(null);
              setError(null);
            }}
          />
        ) : (
          <PasswordStep isBusy={isBusy} onSubmit={submitPassword} />
        )}
      </Card>
    </main>
  );
}

function PasswordStep({
  isBusy,
  onSubmit,
}: {
  isBusy: boolean;
  onSubmit: (form: FormData) => void;
}) {
  return (
    <form
      className="flex flex-col gap-16"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
    >
      <Field label="Email" name="email" type="email" autoComplete="username" required autoFocus />
      <Field
        label="Parol"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />
      <Button type="submit" loading={isBusy} fullWidth>
        Davom etish
      </Button>
      <p className="text-caption text-text-secondary">
        Keyingi qadamda autentifikator ilovasidagi kod soʻraladi.
      </p>
    </form>
  );
}

function TotpStep({
  enrollmentUri,
  isBusy,
  onSubmit,
  onBack,
}: {
  enrollmentUri: string | null;
  isBusy: boolean;
  onSubmit: (form: FormData) => void;
  onBack: () => void;
}) {
  return (
    <form
      className="flex flex-col gap-16"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
    >
      {enrollmentUri && <Enrollment uri={enrollmentUri} />}

      <Field
        label="Tasdiqlash kodi"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={7}
        placeholder="000000"
        required
        autoFocus
        className="font-mono tracking-[0.3em]"
      />
      <Button type="submit" loading={isBusy} fullWidth>
        Kirish
      </Button>
      <Button variant="ghost" onClick={onBack} fullWidth>
        Orqaga
      </Button>
    </form>
  );
}

/**
 * Birinchi kirish: sirni autentifikator ilovasiga qoʻshish.
 *
 * QR rasm chizilmaydi — u uchun kutubxona kerak boʻlardi. Sirning oʻzi
 * matn koʻrinishida beriladi: har bir autentifikator ilovasi "kalitni
 * qoʻlda kiritish" yoʻlini biladi. Havola ham bor — telefon brauzerida
 * ochilsa ilova oʻzi koʻtariladi.
 */
function Enrollment({ uri }: { uri: string }) {
  const secret = new URL(uri.replace('otpauth://', 'https://')).searchParams.get('secret') ?? '';

  return (
    <div className="flex flex-col gap-8 rounded-md bg-warning-surface p-12">
      <p className="text-body-strong text-warning">Birinchi kirish — ikki bosqichli himoyani ulang</p>
      <p className="text-caption text-warning">
        Google Authenticator yoki Aegis ilovasida «kalitni qoʻlda kiritish» ni tanlang va quyidagi
        kalitni kiriting:
      </p>
      <code className="select-all break-all rounded-sm bg-surface-elevated px-8 py-4 font-mono text-mono text-text-primary">
        {secret}
      </code>
      <a
        href={uri}
        className="text-caption-strong text-primary underline underline-offset-2"
      >
        Telefonda ochish
      </a>
    </div>
  );
}
