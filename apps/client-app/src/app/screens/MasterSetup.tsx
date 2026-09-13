import { Info } from '@phosphor-icons/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { SelectableChip } from '@/components/SelectableChip';
import { StepDots, type StepDotIndex } from '@/components/StepDots';
import { SummaryRow } from '@/components/SummaryRow';
import { Textarea } from '@/components/Textarea';
import { Toggle } from '@/components/Toggle';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import {
  ABOUT_MAX,
  ABOUT_MIN,
  canContinueSetupStep,
  DISTRICTS_MAX,
  EXPERIENCE_HINTS,
  EXPERIENCE_LABELS,
  EXPERIENCE_LEVELS,
  formatHour,
  formatWorkHours,
  MASTER_PROFESSIONS,
  parseSetupStep,
  SETUP_STEP_LABELS,
  SETUP_STEPS,
  setupStepHint,
  setupStepIndex,
  TASHKENT_DISTRICTS,
  toggleDistrict,
  WORK_FROM_HOURS,
  WORK_TO_HOURS,
  type MasterProfile,
  type SetupStep,
} from '@/lib/masterProfile';
import { useMaster } from '../master-store';
import { tapFeedback } from '../native';
import { useToast } from '../ToastHost';

const STEP_LABELS = SETUP_STEPS.map((step) => SETUP_STEP_LABELS[step]);

/**
 * Usta profilini sozlash — besh qadam.
 *
 * Qadam URL da (`?step=area`): apparat "orqaga" tugmasi qadamlar boʻylab
 * yuradi va sozlamalar ekrani kerakli qadamga toʻgʻridan-toʻgʻri havola
 * qiladi. `location.state` EMAS — u sovuq startda yoʻqoladi.
 *
 * Har oʻzgarish DARHOL saqlanadi: oqim yarmida chiqib ketgan foydalanuvchi
 * qaytganda toʻldirganini topadi.
 */
export function MasterSetupScreen() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { profile, updateProfile } = useMaster();
  const showToast = useToast();

  const step = parseSetupStep(params.get('step'));
  const index = setupStepIndex(step);
  const hint = setupStepHint(step, profile);
  const canContinue = canContinueSetupStep(step, profile);
  const isLast = step === 'review';

  const goTo = (next: SetupStep) => setParams({ step: next });

  const next = () => {
    if (!canContinue) return;
    if (isLast) {
      void tapFeedback();
      showToast('Profil saqlandi', 'success');
      navigate('/app/master', { replace: true });
      return;
    }
    goTo(SETUP_STEPS[index + 1]);
  };

  const back = () => {
    if (index === 0) {
      navigate('/app/master');
      return;
    }
    goTo(SETUP_STEPS[index - 1]);
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Usta profili" onBack={back} />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            <Button variant="primary" disabled={!canContinue} onClick={next}>
              {isLast ? 'Saqlash' : 'Davom etish'}
            </Button>
            {hint ? (
              <p className="text-center text-body-sm text-text-secondary">{hint}</p>
            ) : (
              <p className="text-center text-caption text-text-secondary">
                {isLast
                  ? 'Profil shu qurilmada saqlanadi. Keyin ariza matnini tayyorlaysiz.'
                  : 'Kiritganingiz darhol saqlanadi — keyin davom ettirishingiz mumkin.'}
              </p>
            )}
          </div>
        </StickyFooter>
      }
    >
      <StepDots
        currentStep={index as StepDotIndex}
        labels={STEP_LABELS}
        flowLabel="Usta profili qadamlari"
      />

      {step === 'profession' && <ProfessionStep profile={profile} onChange={updateProfile} />}
      {step === 'experience' && <ExperienceStep profile={profile} onChange={updateProfile} />}
      {step === 'about' && <AboutStep profile={profile} onChange={updateProfile} />}
      {step === 'area' && <AreaStep profile={profile} onChange={updateProfile} />}
      {step === 'review' && <ReviewStep profile={profile} onEdit={goTo} />}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

interface StepProps {
  profile: MasterProfile;
  onChange: (patch: Partial<MasterProfile>) => void;
}

function ProfessionStep({ profile, onChange }: StepProps) {
  return (
    <>
      <h1 className="mt-20 text-h1 text-text-primary">Qaysi yoʻnalishda ishlaysiz?</h1>
      <p className="mt-8 text-body text-text-secondary">
        Asosiy yoʻnalishingizni tanlang. Mijozlar ustani aynan shu nom bilan koʻradi.
      </p>
      <div className="mt-16 flex flex-wrap gap-8">
        {MASTER_PROFESSIONS.map((item) => (
          <SelectableChip
            key={item}
            selected={profile.profession === item}
            onSelect={() => onChange({ profession: item })}
          >
            {item}
          </SelectableChip>
        ))}
      </div>
    </>
  );
}

function ExperienceStep({ profile, onChange }: StepProps) {
  return (
    <>
      <h1 className="mt-20 text-h1 text-text-primary">Tajribangiz</h1>
      <div className="mt-16 flex flex-col gap-8">
        {EXPERIENCE_LEVELS.map((level) => {
          const isSelected = profile.experienceLevel === level;
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange({ experienceLevel: level })}
              className={cn(
                'flex w-full items-start gap-12 rounded-lg border-2 p-16 text-left transition-colors duration-state ease-std',
                isSelected
                  ? 'border-primary bg-primary-surface'
                  : 'border-border bg-surface-elevated',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-title text-text-primary">{EXPERIENCE_LABELS[level]}</span>
                <span className="mt-2 block text-body-sm text-text-secondary">
                  {EXPERIENCE_HINTS[level]}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/*
        Sertifikat — OʻZI AYTGAN. Kalit yonida darhol aytiladi: bu tasdiq
        emas va mijozga "Sertifikatli" belgisi bermaydi.
      */}
      <Card className="mt-20 flex items-center gap-12">
        <div className="min-w-0 flex-1">
          <p className="text-title text-text-primary">Davlat sertifikatim bor</p>
          <p className="mt-2 text-body-sm text-text-secondary">
            Gaz suv isitgichlari va isitish tizimi ishlari uchun talab qilinadi
          </p>
        </div>
        <Toggle
          checked={profile.claimsCertificate}
          onChange={(claimsCertificate) => onChange({ claimsCertificate })}
          label="Davlat sertifikatim bor"
          className="shrink-0"
        />
      </Card>
      <Banner variant="info" icon={Info} className="mt-12">
        Sertifikat ilovada tekshirilmaydi. Arizada u «oʻzim aytdim» deb belgilanadi va
        tekshiruvdan oʻtmaguncha mijozga «Sertifikatli» belgisi koʻrsatilmaydi.
      </Banner>
    </>
  );
}

function AboutStep({ profile, onChange }: StepProps) {
  const length = profile.about.trim().length;
  return (
    <>
      <h1 className="mt-20 text-h1 text-text-primary">Oʻzingiz haqingizda</h1>
      <p className="mt-8 text-body text-text-secondary">
        Nima qilasiz, qancha vaqtdan beri, qanday ishlarni yaxshi koʻrasiz. Bu matn tekshiruvga
        yuboriladi.
      </p>
      <Textarea
        value={profile.about}
        onChange={(event) => onChange({ about: event.target.value })}
        maxLength={ABOUT_MAX}
        placeholder="Masalan: 8 yildan beri santexnika bilan shugʻullanaman, kran va isitish tizimlari…"
        error={length > 0 && length < ABOUT_MIN ? `Kamida ${ABOUT_MIN} belgi` : undefined}
        className="mt-16"
      />
    </>
  );
}

function AreaStep({ profile, onChange }: StepProps) {
  const isFull = profile.districts.length >= DISTRICTS_MAX;
  return (
    <>
      <h1 className="mt-20 text-h1 text-text-primary">Hudud va ish vaqti</h1>

      <h2 className="mt-16 text-h3 text-text-primary">Qaysi tumanlarga borasiz?</h2>
      <p className="mt-4 text-caption text-text-secondary">
        {DISTRICTS_MAX} tagacha · tanlangan: {profile.districts.length}
      </p>
      <div className="mt-12 flex flex-wrap gap-8">
        {TASHKENT_DISTRICTS.map((district) => {
          const isSelected = profile.districts.includes(district);
          return (
            <SelectableChip
              key={district}
              selected={isSelected}
              // Chegara toʻlganda tanlanmaganlar bosilmaydi — `toggleDistrict`
              // baribir qoʻshmasdi, lekin bosilib hech narsa boʻlmagan chip
              // ishlamaydigan tugma.
              disabled={isFull && !isSelected}
              onSelect={() => onChange({ districts: toggleDistrict(profile.districts, district) })}
            >
              {district}
            </SelectableChip>
          );
        })}
      </div>

      <h2 className="mt-24 text-h3 text-text-primary">Ish boshlanishi</h2>
      <div className="mt-12 flex flex-wrap gap-8">
        {WORK_FROM_HOURS.map((hour) => (
          <SelectableChip
            key={hour}
            selected={profile.workFrom === hour}
            onSelect={() => onChange({ workFrom: hour })}
          >
            {formatHour(hour)}
          </SelectableChip>
        ))}
      </div>

      <h2 className="mt-20 text-h3 text-text-primary">Ish tugashi</h2>
      <div className="mt-12 flex flex-wrap gap-8">
        {WORK_TO_HOURS.map((hour) => (
          <SelectableChip
            key={hour}
            selected={profile.workTo === hour}
            onSelect={() => onChange({ workTo: hour })}
          >
            {formatHour(hour)}
          </SelectableChip>
        ))}
      </div>
    </>
  );
}

function ReviewStep({ profile, onEdit }: { profile: MasterProfile; onEdit: (step: SetupStep) => void }) {
  const rows: { step: SetupStep; label: string; value: string }[] = [
    { step: 'profession', label: 'Soha', value: profile.profession ?? '—' },
    {
      step: 'experience',
      label: 'Tajriba',
      value: profile.experienceLevel ? EXPERIENCE_LABELS[profile.experienceLevel] : '—',
    },
    {
      step: 'experience',
      label: 'Sertifikat',
      value: profile.claimsCertificate ? 'Bor (tekshirilmagan)' : 'Yoʻq',
    },
    { step: 'area', label: 'Tumanlar', value: profile.districts.join(', ') || '—' },
    { step: 'area', label: 'Ish vaqti', value: formatWorkHours(profile) },
  ];

  return (
    <>
      <h1 className="mt-20 text-h1 text-text-primary">Tekshiring</h1>
      <p className="mt-8 text-body text-text-secondary">
        Har qatorni bosib oʻzgartirishingiz mumkin.
      </p>

      <div
        className={cn(
          'mt-16 rounded-lg border border-transparent bg-surface-elevated p-16 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        {rows.map((row) => (
          <button
            key={row.label}
            type="button"
            onClick={() => onEdit(row.step)}
            className="block w-full text-left"
          >
            <SummaryRow label={row.label} value={row.value} />
          </button>
        ))}
      </div>

      <Card className="mt-12">
        <p className="text-caption text-text-secondary">Oʻzingiz haqingizda</p>
        <p className="mt-4 whitespace-pre-wrap text-body text-text-primary">{profile.about.trim()}</p>
        <button
          type="button"
          onClick={() => onEdit('about')}
          className="mt-8 text-caption text-primary-pressed"
        >
          Oʻzgartirish
        </button>
      </Card>
    </>
  );
}
