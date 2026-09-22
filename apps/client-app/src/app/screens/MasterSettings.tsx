import { Info, NotePencil, Wrench } from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { MenuGroup, type MenuSection } from '@/components/MenuGroup';
import { Modal } from '@/components/Modal';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { useMaster } from '../master-store';
import { useToast } from '../ToastHost';

/**
 * Usta profili sozlamalari.
 *
 * Qatorlar KAM: platforma faqat santexnikaga xizmat qilgani uchun kasb,
 * tajriba, sertifikat, tuman va ish vaqti soʻralmaydi. Qolgani ikkita
 * haqiqiy sozlama — tanishtiruv matni va bajariladigan ishlar roʻyxati.
 */
export function MasterSettingsScreen() {
  const navigate = useNavigate();
  const { profile, application, resetMaster } = useMaster();
  const showToast = useToast();
  const [resetOpen, setResetOpen] = useState(false);

  const fields: MenuSection = {
    title: 'Profil',
    items: [
      {
        icon: NotePencil,
        label: 'Oʻzingiz haqingizda',
        hint: profile.about.trim() ? 'Yozilgan' : 'Yozilmagan',
        onSelect: () => navigate('/app/master/setup'),
      },
      {
        icon: Wrench,
        label: 'Mening xizmatlarim',
        hint: 'Qaysi ishlarni qabul qilasiz',
        onSelect: () => navigate('/app/master/services'),
      },
    ],
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Sozlamalar" onBack={() => navigate('/app/master/profile')} />}
    >
      {/*
        «Ishga tayyorman» kaliti bu yerdan OLIB TASHLANDI: u endi «Ishlar»
        ekranidagi smena tugmasi. Bitta maʼnoga ikkita boshqaruv — ilovadagi
        eng yomon chalkashlik; kalit ustaning ish ekranida turishi kerak.
      */}
      <Card className="mt-4">
        <p className="text-title text-text-primary">Ishga tayyorlik</p>
        <p className="mt-4 text-body-sm text-text-secondary">
          Smena «Ishlar» ekranidagi tugma bilan ochiladi va yopiladi. Hozirgi holat:{' '}
          {profile.isAvailable ? 'smena ochiq' : 'smena yopiq'}.
        </p>
        <Button variant="ghost" className="mt-12" onClick={() => navigate('/app/master/jobs')}>
          Ishlarga oʻtish
        </Button>
      </Card>

      <Banner variant="info" icon={Info} className="mt-12">
        Smena faqat shu qurilmada saqlanadi — uni har safar oʻzingiz ochasiz va yopasiz.
      </Banner>

      <MenuGroup section={fields} />

      {application && (
        <p className="mt-12 px-4 text-caption text-text-secondary">
          Profilni oʻzgartirsangiz, tayyorlangan ariza matni oʻz-oʻzidan yangilanmaydi — uni
          qayta tayyorlaysiz.
        </p>
      )}

      <Button variant="ghost" className="mt-24" onClick={() => setResetOpen(true)}>
        Usta profilini oʻchirish
      </Button>

      {/* Ikkala tugma bir xil oʻlchamda — "yoʻq" ni kichraytirish taqiqlanadi. */}
      <Modal open={resetOpen} title="Usta profilini oʻchirasizmi?" onClose={() => setResetOpen(false)}>
        <div className="mt-20 flex flex-col gap-12">
          <p className="text-center text-body-sm text-text-secondary">
            Profil va tayyorlangan ariza matni qurilmadan oʻchadi. Mijoz rejimidagi
            buyurtmalaringizga taʼsir qilmaydi.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              resetMaster();
              showToast('Usta profili oʻchirildi');
              navigate('/app/master/profile', { replace: true });
            }}
          >
            Ha, oʻchirish
          </Button>
          <Button variant="ghost" onClick={() => setResetOpen(false)}>
            Yoʻq
          </Button>
        </div>
      </Modal>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
