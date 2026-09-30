import { useState } from 'react';
import { ApiError } from '@/api/client';
import { loginWithPassword } from '@/api/admin';
import { Button, Card, Field, Notice } from '@/components/ui';
import { BrandMark } from '@/components/BrandMark';
import { useAuth, type SignOutReason } from '@/app/AuthProvider';

const SIGN_OUT_MESSAGES: Record<SignOutReason, string> = {
  idle: 'Uzoq vaqt harakat boʻlmagani uchun tizimdan chiqarildingiz',
  expired: 'Sessiya muddati tugadi — qaytadan kiring',
};

/**
 * Kirish — email va parol.
 *
 * Autentifikator (TOTP) bosqichi 2026-09-30 da olib tashlandi: kirish
 * sodda boʻlishi soʻralgan. Parolni himoyalaydigan qolgan choralar oʻz
 * kuchida — ketma-ket 5 xatodan keyin 15 daqiqalik blok, IP boʻyicha
 * cheklov va faolsizlikdan avtomatik chiqish.
 */
export function LoginScreen() {
  const { signIn, signOutReason } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const submit = async (form: FormData) => {
    setIsBusy(true);
    setError(null);

    try {
      const result = await loginWithPassword(
        String(form.get('email') ?? ''),
        String(form.get('password') ?? ''),
      );
      signIn(result.token, result.admin);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Kutilmagan xato');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="flex min-h-full items-center justify-center bg-surface px-20 py-48">
      <Card className="w-full max-w-[400px] p-32">
        <div className="mb-24 flex items-center gap-12">
          {/* Belgining oʻzi koʻk gradient plitka — ortiga yana rangli
              kvadrat qoʻyilmaydi, ikki qavat koʻk chekkada iflos koʻrinadi.
              Hoshiya esa qorongʻi tema uchun: u yerda karta foni (15 39 64)
              belgining toʻq burchagidan (3 18 60) deyarli farq qilmaydi. */}
          <BrandMark size={44} decorative className="border border-border-strong" />
          <div>
            <h1 className="text-h2 text-text-primary">Hizmat24</h1>
            <p className="text-caption text-text-secondary">Boshqaruv paneli</p>
          </div>
        </div>

        {signOutReason && !error && (
          <div className="mb-16">
            <Notice tone="warning">{SIGN_OUT_MESSAGES[signOutReason]}</Notice>
          </div>
        )}

        {error && (
          <div className="mb-16">
            <Notice>{error}</Notice>
          </div>
        )}

        <form
          className="flex flex-col gap-16"
          onSubmit={(event) => {
            event.preventDefault();
            void submit(new FormData(event.currentTarget));
          }}
        >
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="username"
            required
            autoFocus
          />
          <Field
            label="Parol"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
          <Button type="submit" loading={isBusy} fullWidth>
            Kirish
          </Button>
        </form>
      </Card>
    </main>
  );
}
