import { Info, Wrench } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DashedChip } from '@/components/DashedChip';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { HOME_ROUTE_FOR } from '@/lib/appMode';
import { SOON_LABEL } from '@/lib/masterLimits';
import {
  completedStepCount,
  firstIncompleteStep,
  REQUIRED_STEP_COUNT,
} from '@/lib/masterProfile';
import {
  canOpenShift,
  shiftActionLabel,
  shiftHintLine,
  shiftHoursLine,
  shiftStateLine,
} from '@/lib/masterShift';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { MasterTabBar } from '../../MasterTabBar';
import { useMaster } from '../../master-store';
import { useApp } from '../../store';

/**
 * «Ishlar» — usta uyi.
 *
 * Bu bosqichda ekranda BITTA ishlaydigan boshqaruv bor — smena. U ilgari
 * «Sozlamalar» ichida yashiringan kalit edi; bitta maʼnoga ikkita joy
 * ilovadagi eng yomon chalkashlik, shuning uchun kalit shu yerga koʻchdi.
 *
 * Takliflar roʻyxati hali YOʻQ va ekran buni yashirmaydi: yoʻq narsa uchun
 * tugma chizilmaydi (6-boʻlim, 5-qoida). Tab badge ham berilmaydi — u faqat
 * haqiqiy takliflarni sanashi kerak.
 */
export function MasterJobsTab() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { setRole } = useApp();
  const { profile, isComplete, updateProfile } = useMaster();

  const done = completedStepCount(profile);
  const canOpen = canOpenShift(isComplete);
  const hint = shiftHintLine(profile, now);

  const goClientMode = () => {
    setRole('client');
    navigate(HOME_ROUTE_FOR.client);
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Ishlar" />}
      footer={<MasterTabBar active="jobs" />}
    >
      {/*
        Smena bloki — ekranning eng tepasida va eng katta tugmasi: usta
        ilovani aynan shuning uchun ochadi. `.banner-field` sathi mijoz
        tomonidagi bannerlar bilan bir tilda gapiradi.
      */}
      <section className="banner-field mt-4 rounded-lg p-16 text-on-primary-deep">
        <p className="text-overline uppercase text-on-primary-deep">Smena</p>
        <h2 className="mt-4 text-h2 text-on-primary-deep">{shiftStateLine(profile)}</h2>
        <p className="mt-4 text-body-sm text-on-primary-deep">{shiftHoursLine(profile)}</p>
        {hint && <p className="mt-4 text-caption text-on-primary-deep">{hint}</p>}

        {/*
          Ochiq smenada tugma «shisha»: `secondary` variantining koʻk chizigʻi
          koʻk sath ustida oʻchirilgandek koʻrinardi. Yopiq smenada esa asosiy
          amal — toʻldirilgan `primary`.
        */}
        <Button
          variant={profile.isAvailable ? 'ghost' : 'primary'}
          className={cn(
            'mt-16',
            profile.isAvailable &&
              'bg-on-primary-deep/[0.16] text-on-primary-deep ring-1 ring-inset ring-on-primary-deep/[0.45] active:bg-on-primary-deep/[0.24]',
          )}
          disabled={!canOpen}
          onClick={() => updateProfile({ isAvailable: !profile.isAvailable })}
        >
          {shiftActionLabel(profile)}
        </Button>
      </section>

      {/* Profil qorovuli: toʻliq boʻlmaguncha smena ochilmaydi. */}
      {!isComplete && (
        <Card className="mt-12">
          <p className="text-title text-text-primary">Usta profili toʻldirilmagan</p>
          <p className="mt-4 text-body-sm text-text-secondary">
            {done} / {REQUIRED_STEP_COUNT} qadam toʻldirildi. Profil toʻliq boʻlgunicha smena
            ochilmaydi va taklifni qabul qila olmaysiz.
          </p>
          <Button
            variant="secondary"
            className="mt-16"
            onClick={() => navigate(`/app/master/setup?step=${firstIncompleteStep(profile)}`)}
          >
            Profilni toʻldirish
          </Button>
        </Card>
      )}

      {/* Manba bayonoti — hech qachon yashirilmaydi. */}
      <Banner variant="info" icon={Info} className="mt-12">
        Server ulanmagan. Takliflar shu telefonda mijoz rejimida berilgan buyurtmalardan keladi;
        boshqa odamlarning buyurtmalari ilovaga tushmaydi.
      </Banner>

      <EmptyState
        inline
        icon={Wrench}
        title="Hozircha taklif yoʻq"
        description="Takliflar shu telefonda mijoz rejimida berilgan buyurtmalardan keladi."
        action={{ label: 'Mijoz rejimiga oʻtish', onClick: goClientMode, variant: 'secondary' }}
      />

      {/*
        Ishlamaydigan imkoniyat tugma emas, `span`: takliflar roʻyxati hali
        ulanmagan va buni jimgina yashirish foydalanuvchini boʻsh ekranda
        kutishga majbur qilardi.
      */}
      <div className="flex flex-col items-center gap-8 px-20 text-center">
        <DashedChip>{SOON_LABEL}</DashedChip>
        <p className="text-caption text-text-secondary">
          Takliflar roʻyxati hali ulanmagan — smena ochiq boʻlsa ham bu ekran boʻsh turadi.
        </p>
      </div>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
