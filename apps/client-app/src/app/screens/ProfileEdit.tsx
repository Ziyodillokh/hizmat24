import { Info } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Input } from '@/components/Input';
import { SummaryRow } from '@/components/SummaryRow';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { formatPhone } from '@/lib/formatters';
import { useApp } from '../store';
import { tapFeedback } from '../native';
import { useToast } from '../ToastHost';

/** Ism uchun chegara — qator sarlavhaga sigʻishi kerak. */
const NAME_MAX = 40;

/**
 * Shaxsiy maʼlumotlar.
 *
 * Bu ekran mavjud yolgʻonni tuzatadi: ilgari profil va bosh sahifa
 * `src/mocks/user.ts` dagi "Jasur" ni koʻrsatardi — foydalanuvchi hech
 * qachon aytmagan ism. Endi ism foydalanuvchidan keladi yoki umuman
 * koʻrsatilmaydi.
 *
 * Telefon raqami TAHRIRLANMAYDI: u SMS tasdiqlashdan oʻtgan va uni
 * oʻzgartirish qayta tasdiqlashni talab qiladi — bu oqim yoʻq. Maydonni
 * "ishlaydigan" qilib chizish eng yomon yoʻl boʻlardi.
 */
export function ProfileEditScreen() {
  const navigate = useNavigate();
  const { fullName, phoneNumber, setFullName } = useApp();
  const showToast = useToast();

  const [name, setName] = useState(fullName ?? '');

  const trimmed = name.trim();
  const isDirty = trimmed !== (fullName ?? '');

  const submit = () => {
    if (!isDirty) return;
    setFullName(name);
    void tapFeedback();
    showToast(trimmed ? 'Ism saqlandi' : 'Ism oʻchirildi', trimmed ? 'success' : undefined);
    navigate('/app/profile', { replace: true });
  };

  return (
    <ScreenShell
      header={
        <Header variant="inner" title="Shaxsiy maʼlumotlar" onBack={() => navigate(-1)} />
      }
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            <Button variant="primary" disabled={!isDirty} onClick={submit}>
              Saqlash
            </Button>
            <p className="text-center text-caption text-text-secondary">
              {isDirty
                ? 'Ism shu qurilmada saqlanadi.'
                : 'Oʻzgartirish yoʻq — saqlash uchun ismni tahrirlang.'}
            </p>
          </div>
        </StickyFooter>
      }
    >
      <h2 className="mt-4 text-h3 text-text-primary">Ism</h2>
      <p className="mt-4 text-caption text-text-secondary">
        Ixtiyoriy — kiritmasangiz ilova ismsiz salomlashadi
      </p>
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Ismingiz"
        maxLength={NAME_MAX}
        className="mt-12"
      />

      {/* Ism qayerda koʻrinishi OLDIN aytiladi — keyin topib olmaydi. */}
      <p className="mt-8 px-4 text-caption text-text-secondary">
        Ism bosh sahifadagi salomlashuvda, profilda va qoʻllab-quvvatlashga tayyorlanadigan
        murojaat matnida ishlatiladi.
      </p>

      <h2 className="mt-24 text-h3 text-text-primary">Telefon raqam</h2>
      <div
        className={cn(
          'mt-12 rounded-lg border border-transparent bg-surface-elevated p-16 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <SummaryRow label="Raqam" value={formatPhone(phoneNumber)} mono />
      </div>

      <Banner variant="info" icon={Info} className="mt-12">
        Raqamni ilovada oʻzgartirib boʻlmaydi: u SMS bilan tasdiqlangan va yangi raqam qayta
        tasdiqlashni talab qiladi. Bu oqim hali qoʻshilmagan.
      </Banner>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
