import {
  ArrowsLeftRight,
  ClipboardText,
  GearSix,
  Headset,
  Info,
  MapPin,
  Moon,
  PaperPlaneTilt,
  ShieldCheck,
  Sun,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { MenuGroup, type MenuItem, type MenuSection } from '@/components/MenuGroup';
import { Modal } from '@/components/Modal';
import { Toggle } from '@/components/Toggle';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { MODE_ROUTE } from '@/lib/appMode';
import { formatDateTime, formatPhone } from '@/lib/formatters';
import {
  completedStepCount,
  firstIncompleteStep,
  REQUIRED_STEP_COUNT,
} from '@/lib/masterProfile';
import { CHANNEL_OPENED_LABELS } from '@/lib/support';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { MasterTabBar } from '../../MasterTabBar';
import { useMaster } from '../../master-store';
import { useApp } from '../../store';
import { useTheme } from '../../theme-context';

/**
 * Usta rejimidagi «Profil».
 *
 * `MasterHub` ning oʻrnini egalladi: kabinet endi alohida ekran emas, usta
 * qobigʻining toʻrtinchi tabi. Toʻliqlik va ariza bloklari huddan AYNAN
 * koʻchirildi — ular ishlagan va ularni qayta yozish sabab yoʻq.
 *
 * «Sertifikatli» belgisi bu yerda HECH QACHON chizilmaydi: sertifikat
 * foydalanuvchining oʻz gapi va ilova uni tekshira olmaydi.
 */
export function MasterProfileTab() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { fullName, phoneNumber, signOut } = useApp();
  const { profile, isComplete, application } = useMaster();
  const { theme, toggleTheme } = useTheme();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const done = completedStepCount(profile);
  const lastChannel = application?.openedChannels[application.openedChannels.length - 1];
  const displayName = fullName?.trim() ? fullName.trim() : formatPhone(phoneNumber);

  const masterItems: MenuItem[] = [
    ...(isComplete
      ? [
          {
            icon: GearSix,
            label: 'Sozlamalar',
            hint: profile.isAvailable ? 'Ishga tayyor' : 'Tayyor emas',
            onSelect: () => navigate('/app/master/settings'),
          },
          {
            icon: PaperPlaneTilt,
            label: 'Ariza',
            onSelect: () => navigate('/app/master/apply'),
          },
        ]
      : []),
    {
      icon: MapPin,
      label: 'Hududlar',
      hint: profile.districts.length > 0 ? `${profile.districts.length} ta` : undefined,
      onSelect: () => navigate('/app/master/setup?step=area'),
    },
  ];

  const sections: MenuSection[] = [
    { title: 'Usta rejimi', items: masterItems },
    {
      title: 'Ilova',
      items: [
        {
          icon: Info,
          label: 'Nimalar hali ishlamaydi',
          onSelect: () => navigate('/app/master/limits'),
        },
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: 'Mavzu',
          control: (
            <Toggle
              checked={theme === 'dark'}
              onChange={toggleTheme}
              label="Tungi rejim"
              className="shrink-0"
            />
          ),
        },
      ],
    },
    {
      title: 'Rejim',
      items: [
        {
          icon: ArrowsLeftRight,
          label: 'Mijoz rejimiga oʻtish',
          hint: 'Xizmat buyurtma qilish',
          stacked: true,
          onSelect: () => navigate(MODE_ROUTE),
        },
      ],
    },
    {
      title: 'Yordam',
      items: [
        {
          icon: Headset,
          label: 'Qoʻllab-quvvatlash',
          onSelect: () => navigate('/app/support'),
        },
        { icon: ShieldCheck, label: 'Kafolat', onSelect: () => navigate('/app/guarantee') },
      ],
    },
  ];

  return (
    <ScreenShell
      header={<Header variant="inner" title="Profil" />}
      footer={<MasterTabBar active="profile" />}
    >
      {/* Shaxs — faqat foydalanuvchi aytgan maʼlumot. */}
      <Card className="mt-4 flex items-start gap-12">
        <Avatar name={fullName} size={56} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-h3 text-text-primary">{displayName}</p>
          <p className="mt-2 truncate text-body-sm text-text-secondary">
            {profile.profession ?? 'Soha tanlanmagan'}
          </p>
          {/* Belgini ilova bermaydi — u DOIM tekshirilmagan. */}
          <InfoChip tone="warning" className="mt-8">
            Tekshirilmagan
          </InfoChip>
        </div>
      </Card>

      {/* Toʻliqlik — huddan koʻchirilgan blok. */}
      {!isComplete ? (
        <Card className="mt-12">
          <p className="text-title text-text-primary">Profil hali toʻliq emas</p>
          <p className="mt-4 text-body-sm text-text-secondary">
            {done} / {REQUIRED_STEP_COUNT} qadam toʻldirildi. Profil toʻliq boʻlgach ariza matnini
            tayyorlaysiz.
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
        <Card className="mt-12">
          <div className="flex items-start gap-12">
            <span
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md bg-surface-sunken"
              aria-hidden
            >
              <Icon
                icon={application ? PaperPlaneTilt : ClipboardText}
                size={20}
                className="text-primary"
              />
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

      {sections.map((section) => (
        <MenuGroup key={section.title} section={section} />
      ))}

      <Banner variant="info" icon={Info} className="mt-20">
        Bu qurilmada mijoz ham, usta ham — bitta raqam. Takliflar shu telefonda berilgan
        buyurtmalardan keladi; boshqa odamlarning buyurtmalari server ulangandan keyin koʻrinadi.
      </Banner>

      {/*
        Chiqish QAYTARIB BOʻLMAYDI va u bilan birga buyurtmalar ham, usta
        profili ham oʻchadi — mijoz tomonidagi kabi tasdiqlash oynasi shart.
      */}
      <Button variant="ghost" className="mt-20" onClick={() => setLogoutOpen(true)}>
        Chiqish
      </Button>

      <Modal
        open={logoutOpen}
        title="Chiqishni tasdiqlaysizmi?"
        onClose={() => setLogoutOpen(false)}
      >
        <div className="mt-20 flex flex-col gap-12">
          <p className="text-center text-body-sm text-text-secondary">
            Chiqsangiz, usta profilingiz va tayyorlangan ariza matni ham oʻchadi.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              signOut();
              navigate('/app', { replace: true });
            }}
          >
            Chiqish
          </Button>
          <Button variant="ghost" onClick={() => setLogoutOpen(false)}>
            Yopish
          </Button>
        </div>
      </Modal>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
