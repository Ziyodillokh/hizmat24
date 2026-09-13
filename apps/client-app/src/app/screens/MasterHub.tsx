import { ClipboardText, GearSix, Info, PaperPlaneTilt, Wrench } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { MenuGroup, type MenuSection } from '@/components/MenuGroup';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { formatDateTime } from '@/lib/formatters';
import {
  completedStepCount,
  firstIncompleteStep,
  formatWorkHours,
  REQUIRED_STEP_COUNT,
} from '@/lib/masterProfile';
import { CHANNEL_OPENED_LABELS } from '@/lib/support';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { useMaster } from '../master-store';
import { AppTabBar } from '../AppTabBar';

/**
 * Usta kabineti — usta rejimining kirish nuqtasi.
 *
 * Ilgari "Ustaman" tanlovi faqat toast koʻrsatardi va mijoz oqimiga qaytarardi:
 * rol almashtirgichi hech narsa qilmasdi. Endi rejimning oʻz uyi bor.
 *
 * Bu sahifada ISH TAKLIFLARI YOʻQ va boʻlmaydi — ular serverdan keladi,
 * server esa ulanmagan. Sahifa buni ochiq aytadi va oʻzida bor narsani
 * koʻrsatadi: profil holati va ariza.
 */
export function MasterHubScreen() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { profile, isComplete, application } = useMaster();

  const done = completedStepCount(profile);
  const lastChannel = application?.openedChannels[application.openedChannels.length - 1];

  // Bitta qator — bitta ekran. Toʻliq profilda sozlamalar, toʻliq
  // boʻlmaganida oqimning birinchi boʻsh qadami.
  const menu: MenuSection = {
    title: 'Profil',
    items: [
      isComplete
        ? {
            icon: GearSix,
            label: 'Sozlamalar',
            hint: profile.isAvailable ? 'Ishga tayyor' : 'Tayyor emas',
            onSelect: () => navigate('/app/master/settings'),
          }
        : {
            icon: Wrench,
            label: 'Profilni toʻldirish',
            hint: `${done}/${REQUIRED_STEP_COUNT}`,
            onSelect: () => navigate(`/app/master/setup?step=${firstIncompleteStep(profile)}`),
          },
    ],
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Usta kabineti" />}
      footer={<AppTabBar active="profile" />}
    >
      {/* Holat kartasi — profil toʻliqligiga qarab ikki koʻrinish. */}
      {!isComplete ? (
        <Card className="mt-4">
          <p className="text-title text-text-primary">Profil hali toʻliq emas</p>
          <p className="mt-4 text-body-sm text-text-secondary">
            {done} / {REQUIRED_STEP_COUNT} qadam toʻldirildi. Profil toʻliq boʻlgach ariza
            matnini tayyorlaysiz.
          </p>
          <Button
            variant="primary"
            className="mt-16"
            onClick={() => navigate(`/app/master/setup?step=${firstIncompleteStep(profile)}`)}
          >
            {done === 0 ? 'Boshlash' : 'Davom etish'}
          </Button>
        </Card>
      ) : (
        <Card className="mt-4">
          <div className="flex items-start gap-12">
            <span
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md bg-surface-sunken"
              aria-hidden
            >
              <Icon icon={Wrench} size={20} className="text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-title text-text-primary">{profile.profession}</p>
              <p className="mt-2 text-body-sm text-text-secondary">
                {profile.districts.join(', ')} · {formatWorkHours(profile)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Ariza holati — faqat foydalanuvchi bilgan faktlar. */}
      {isComplete && (
        <Card className="mt-12">
          <div className="flex items-start gap-12">
            <span
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md bg-surface-sunken"
              aria-hidden
            >
              <Icon icon={application ? PaperPlaneTilt : ClipboardText} size={20} className="text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-title text-text-primary">
                {application ? 'Ariza matni tayyor' : 'Ariza hali tayyorlanmagan'}
              </p>
              <p className="mt-2 text-body-sm text-text-secondary">
                {application
                  ? `Tayyorlangan: ${formatDateTime(application.createdAt, now)}`
                  : 'Profil maʼlumotidan tekshiruv uchun matn yigʻiladi — uni siz yuborasiz.'}
              </p>
              {/* "Yuborildi" YOʻQ: faqat qaysi kanal ochilgani maʼlum. */}
              {lastChannel && (
                <p className="mt-2 text-caption text-text-secondary">
                  {CHANNEL_OPENED_LABELS[lastChannel.channel]} ·{' '}
                  {formatDateTime(lastChannel.openedAt, now)}
                </p>
              )}
            </div>
          </div>
          <Button
            variant={application ? 'secondary' : 'primary'}
            className="mt-16"
            onClick={() => navigate('/app/master/apply')}
          >
            {application ? 'Arizani ochish' : 'Ariza tayyorlash'}
          </Button>
        </Card>
      )}

      <MenuGroup section={menu} />

      <Banner variant="info" icon={Info} className="mt-20">
        Ish takliflari serverdan keladi va server hali ulanmagan. Profil va ariza shu qurilmada
        saqlanadi; tekshiruv natijasini qoʻllab-quvvatlash xizmati aytadi.
      </Banner>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
