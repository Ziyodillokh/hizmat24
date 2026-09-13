import { Briefcase, Clock, Info, MapPin, NotePencil, SealCheck, Wrench } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { MenuGroup, type MenuSection } from '@/components/MenuGroup';
import { Modal } from '@/components/Modal';
import { Toggle } from '@/components/Toggle';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { EXPERIENCE_LABELS, formatWorkHours } from '@/lib/masterProfile';
import { useMaster } from '../master-store';
import { useToast } from '../ToastHost';

/**
 * Usta profili sozlamalari.
 *
 * Har qator sozlash oqimining kerakli qadamiga olib boradi — ikkinchi forma
 * yasalmaydi. "Ishga tayyorman" kaliti FAQAT qurilmada saqlanadi va ekran
 * buni yashirmaydi: backend yoʻq, kalit hech kimga hech narsa yubormaydi.
 */
export function MasterSettingsScreen() {
  const navigate = useNavigate();
  const { profile, isComplete, application, updateProfile, resetMaster } = useMaster();
  const showToast = useToast();
  const [resetOpen, setResetOpen] = useState(false);

  // Toʻliq boʻlmagan profil sozlamalarda emas, oqimda toʻldiriladi.
  if (!isComplete) return <Navigate to="/app/master/setup" replace />;

  const edit = (step: string) => () => navigate(`/app/master/setup?step=${step}`);

  const fields: MenuSection = {
    title: 'Profil',
    items: [
      { icon: Wrench, label: 'Soha', hint: profile.profession ?? undefined, onSelect: edit('profession') },
      {
        icon: Briefcase,
        label: 'Tajriba',
        hint: profile.experienceLevel ? EXPERIENCE_LABELS[profile.experienceLevel] : undefined,
        onSelect: edit('experience'),
      },
      {
        icon: SealCheck,
        label: 'Sertifikat',
        hint: profile.claimsCertificate ? 'Bor (tekshirilmagan)' : 'Yoʻq',
        onSelect: edit('experience'),
      },
      { icon: NotePencil, label: 'Oʻzingiz haqingizda', onSelect: edit('about') },
      {
        icon: MapPin,
        label: 'Tumanlar',
        hint: `${profile.districts.length} ta`,
        onSelect: edit('area'),
      },
      { icon: Clock, label: 'Ish vaqti', hint: formatWorkHours(profile), onSelect: edit('area') },
    ],
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Sozlamalar" onBack={() => navigate('/app/master')} />}
    >
      <Card className="mt-4 flex items-center gap-12">
        <div className="min-w-0 flex-1">
          <p className="text-title text-text-primary">Ishga tayyorman</p>
          <p className="mt-2 text-body-sm text-text-secondary">
            {profile.isAvailable ? 'Tayyor' : 'Tayyor emas'} — faqat shu qurilmada
          </p>
        </div>
        <Toggle
          checked={profile.isAvailable}
          onChange={(isAvailable) => updateProfile({ isAvailable })}
          label="Ishga tayyorman"
          className="shrink-0"
        />
      </Card>
      <Banner variant="info" icon={Info} className="mt-12">
        Bu kalit hozircha hech kimga hech narsa yubormaydi: ish takliflari serverdan keladi va
        server ulanmagan. Ulangach, kalit sizni qidiruvda koʻrsatadi yoki yashiradi.
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
              navigate('/app/master', { replace: true });
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
