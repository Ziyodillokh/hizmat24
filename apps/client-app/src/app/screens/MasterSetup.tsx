import { Info } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Textarea } from '@/components/Textarea';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { aboutHint, ABOUT_MAX } from '@/lib/masterProfile';
import { useMaster } from '../master-store';
import { tapFeedback } from '../native';
import { useToast } from '../ToastHost';

/**
 * Usta profili — BITTA ixtiyoriy maydon.
 *
 * Avval bu besh qadamli oqim edi: kasb, tajriba, sertifikat, tumanlar,
 * ish vaqti. Platforma faqat santexnikaga oʻtgach, bu savollarning
 * hammasining javobi oldindan maʼlum boʻlib qoldi yoki umuman kerak
 * boʻlmay qoldi — odamni besh ekran ushlab turish esa uni yoʻqotish
 * demakdi. Usta nima qila olishini «Mening xizmatlarim» da belgilaydi,
 * qachon ishlashini esa smena tugmasi aytadi.
 *
 * Har oʻzgarish DARHOL saqlanadi: yarmida chiqib ketgan odam qaytganda
 * yozganini topadi.
 */
export function MasterSetupScreen() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useMaster();
  const showToast = useToast();

  const hint = aboutHint(profile.about);

  const save = () => {
    if (hint) return;
    void tapFeedback();
    showToast('Saqlandi', 'success');
    navigate('/app/master/profile', { replace: true });
  };

  return (
    <ScreenShell
      header={
        <Header variant="inner" title="Usta profili" onBack={() => navigate('/app/master/jobs')} />
      }
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            <Button variant="primary" disabled={Boolean(hint)} onClick={save}>
              Saqlash
            </Button>
            <p className="text-center text-body-sm text-text-secondary">
              {hint ?? 'Boʻsh qoldirsangiz ham boʻladi — keyin yozasiz.'}
            </p>
          </div>
        </StickyFooter>
      }
    >
      <h1 className="mt-20 text-h1 text-text-primary">Oʻzingiz haqingizda</h1>
      <p className="mt-8 text-body text-text-secondary">
        Nima qilasiz, qancha vaqtdan beri, qanday ishlarni yaxshi koʻrasiz. Bu matn mijozga
        koʻrinadi va ixtiyoriy.
      </p>

      <Textarea
        value={profile.about}
        onChange={(event) => updateProfile({ about: event.target.value })}
        maxLength={ABOUT_MAX}
        placeholder="Masalan: 8 yildan beri santexnika bilan shugʻullanaman, kran va isitish tizimlari…"
        error={hint ?? undefined}
        className="mt-16"
      />

      <Banner variant="info" icon={Info} className="mt-16">
        Qaysi ishlarni qabul qilishingizni «Mening xizmatlarim» boʻlimida yoqasiz va oʻchirasiz —
        buyurtmalar aynan shunga qarab tushadi.
      </Banner>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
