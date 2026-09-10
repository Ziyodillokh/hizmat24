import { CalendarX, Lightning } from '@phosphor-icons/react';
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { SegmentControl } from '@/components/SegmentControl';
import { StepDots } from '@/components/StepDots';
import { Toggle } from '@/components/Toggle';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import {
  formatDayLabel,
  formatDayNumber,
  formatPrice,
  formatTime,
  formatWeekdayShort,
} from '@/lib/formatters';
import { URGENT_FEE } from '@/lib/pricing';
import { buildDayStrip, buildHours, groupHours, slotAt, type DayOption } from '@/lib/schedule';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';
import { useApp } from '../store';

/**
 * Vaqt tanlash — buyurtma oqimining uchinchi qadami.
 *
 * BANDLIK KOʻRSATILMAYDI: bizda usta jadvali maʼlumoti yoʻq. Boʻlmagan
 * bandlikni chizish soxta maʼlumotni haqiqat sifatida koʻrsatish boʻlardi.
 * Yagona haqiqiy cheklov — joriy vaqt.
 *
 * Tanlov `Date` emas, KALIT sifatida saqlanadi: sana tasmasi har daqiqada
 * qayta quriladi va yangi `Date` obyektlari havola boʻyicha tenglashmaydi.
 */
type ScheduleMode = 'asap' | 'scheduled';

const MODES = [
  { value: 'asap' as const, label: 'Imkon qadar tez' },
  { value: 'scheduled' as const, label: 'Sana tanlash' },
];

/** Roving tabindex uchun: strelkalar tanlanadigan qoʻshniga oʻtadi. */
function moveIndex(current: number, step: number, length: number): number {
  return Math.max(0, Math.min(length - 1, current + step));
}

export function ScheduleStep() {
  const navigate = useNavigate();
  const { draft, setDraftSchedule } = useApp();

  const now = useMinuteClock();
  const days = useMemo(() => buildDayStrip(now), [now]);

  const [mode, setMode] = useState<ScheduleMode>(draft.scheduledAt === null ? 'asap' : 'scheduled');
  const [isUrgent, setIsUrgent] = useState(draft.isUrgent);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const selectedDay = days.find((day) => day.key === selectedDayKey) ?? null;
  const hours = selectedDay ? buildHours(selectedDay.date, now) : [];

  /*
   * Ekran ochiq turganda tanlangan soat oʻtib ketishi mumkin. Tozalanmasa
   * foydalanuvchi oʻtgan vaqtga buyurtma bergan boʻlardi.
   */
  useEffect(() => {
    if (selectedDayKey === null) return;

    const day = days.find((item) => item.key === selectedDayKey);
    if (!day || !day.hasSlots) {
      setSelectedDayKey(null);
      setSelectedHour(null);
      return;
    }

    if (selectedHour !== null && !buildHours(day.date, now).includes(selectedHour)) {
      setSelectedHour(null);
    }
  }, [days, now, selectedDayKey, selectedHour]);

  const category = ALL_CATEGORIES.find((item) => item.id === draft.categoryId);

  if (!category || !draft.address) {
    return (
      <ScreenShell
        header={<Header variant="inner" title="Qachon kelsin?" onBack={() => navigate('/app/home')} />}
      >
        <Banner variant="warning" className="mt-16">
          Avval xizmat turi va manzilni tanlang
        </Banner>
        <Button variant="secondary" className="mt-16" onClick={() => navigate('/app/services')}>
          Xizmat tanlash
        </Button>
      </ScreenShell>
    );
  }

  const changeMode = (next: ScheduleMode) => {
    setMode(next);

    if (next === 'asap') {
      setSelectedDayKey(null);
      setSelectedHour(null);
      return;
    }

    // Rejalashtirilgan buyurtma shoshilinch boʻlmaydi.
    setIsUrgent(false);
    // Birinchi boʻsh kun tanlanadi, SOAT esa tanlanmaydi: avtomatik
    // tanlangan vaqt foydalanuvchi koʻrmagan qaror boʻlardi.
    const firstFree = days.find((day) => day.hasSlots);
    if (firstFree) setSelectedDayKey(firstFree.key);
  };

  const selectDay = (key: string) => {
    setSelectedDayKey(key);
    setSelectedHour(null);
  };

  const onDayKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const selectable = days.filter((day) => day.hasSlots);
    if (selectable.length === 0) return;

    const current = selectable.findIndex((day) => day.key === selectedDayKey);
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;

    let next = -1;
    if (step !== 0) next = moveIndex(current === -1 ? 0 : current, step, selectable.length);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = selectable.length - 1;
    if (next === -1) return;

    event.preventDefault();
    selectDay(selectable[next].key);
  };

  const onHourKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (hours.length === 0) return;

    const current = selectedHour === null ? 0 : hours.indexOf(selectedHour);
    const step =
      event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowLeft'
          ? -1
          : event.key === 'ArrowDown'
            ? 3
            : event.key === 'ArrowUp'
              ? -3
              : 0;

    let next = -1;
    if (step !== 0) next = moveIndex(current === -1 ? 0 : current, step, hours.length);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = hours.length - 1;
    if (next === -1) return;

    event.preventDefault();
    setSelectedHour(hours[next]);
  };

  const canContinue = mode === 'asap' || selectedHour !== null;

  const submit = () => {
    const scheduledAt =
      mode === 'scheduled' && selectedDay && selectedHour !== null
        ? slotAt(selectedDay.date, selectedHour)
        : null;

    setDraftSchedule(scheduledAt, mode === 'asap' && isUrgent);
    navigate('/app/new/payment');
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Qachon kelsin?" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button variant="primary" disabled={!canContinue} onClick={submit}>
            Davom etish
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={2} />

      <SegmentControl className="mt-20" options={MODES} value={mode} onChange={changeMode} />

      {mode === 'asap' ? (
        <>
          <Card className="mt-16">
            <div className="flex items-start gap-12">
              <span
                className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-sm bg-primary-surface text-primary-pressed"
                aria-hidden
              >
                <Icon icon={Lightning} size={20} weight="duotone" />
              </span>
              <div className="min-w-0">
                <p className="text-title text-text-primary">Usta imkon qadar tez yuboriladi</p>
                <p className="mt-4 text-body-sm text-text-secondary">
                  Odatda 15–40 daqiqa ichida. Aniq vaqt usta topilgach maʼlum boʻladi.
                </p>
              </div>
            </div>
          </Card>

          {/*
            Shoshilinch qoʻshimchasi AYNAN shu yerda aytiladi. Toʻlov
            ekranida birinchi marta koʻrinsa, u yashirin toʻlov boʻlardi.
          */}
          <div className="mt-24 flex items-start justify-between gap-16">
            <div className="min-w-0 flex-1">
              <p className="text-body-lg text-text-primary">Shoshilinch</p>
              <p className="mt-2 text-body-sm text-text-secondary">
                Usta navbatdan tashqari yuboriladi · +{formatPrice(URGENT_FEE)}
              </p>
            </div>
            <Toggle checked={isUrgent} onChange={setIsUrgent} label="Shoshilinch" />
          </div>
        </>
      ) : (
        <>
          <h3 className="mt-20 px-4 text-overline uppercase text-text-secondary">Qaysi kun</h3>

          {/* Tasma ekran chetigacha suriladi, chetdagi kataklar sahifa
              paddingiga tekislanadi. */}
          <div
            role="radiogroup"
            aria-label="Sana"
            onKeyDown={onDayKeyDown}
            className="-mx-20 mt-12 flex gap-8 overflow-x-auto px-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {days.map((day) => (
              <DayCell
                key={day.key}
                day={day}
                now={now}
                isSelected={day.key === selectedDayKey}
                onSelect={() => selectDay(day.key)}
              />
            ))}
          </div>

          {selectedDay && (
            <p className="mt-8 px-4 text-body-sm text-text-secondary">
              {formatDayLabel(selectedDay.date, now)}
            </p>
          )}

          <h3 className="mt-24 px-4 text-overline uppercase text-text-secondary">Qaysi vaqt</h3>
          <p className="mt-8 px-4 text-body-sm text-text-secondary">
            Bu — siz uchun qulay vaqt. Usta topilgach vaqt tasdiqlanadi.
          </p>

          {hours.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title="Bu kun uchun boʻsh vaqt qolmadi"
              description="Boshqa kunni tanlang yoki «Imkon qadar tez» rejimiga oʻting"
              className="mt-16"
              inline
            />
          ) : (
            groupHours(hours).map((group) => (
              <section key={group.key}>
                <h4 className="mt-16 px-4 text-overline uppercase text-text-secondary">
                  {group.label}
                </h4>
                <div
                  role="radiogroup"
                  aria-label={group.label}
                  onKeyDown={onHourKeyDown}
                  className="mt-12 grid grid-cols-3 gap-8"
                >
                  {group.hours.map((hour) => {
                    const label = formatTime(slotAt(selectedDay?.date ?? now, hour));
                    const isSelected = hour === selectedHour;

                    return (
                      <button
                        key={hour}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        aria-label={label}
                        onClick={() => setSelectedHour(hour)}
                        className={cn(
                          'tabular flex min-h-touch items-center justify-center rounded-sm px-8 py-12 text-body-sm',
                          'transition-[transform,background-color,box-shadow] duration-press ease-std',
                          'active:scale-[0.98]',
                          isSelected
                            ? 'bg-primary-surface text-primary-pressed ring-2 ring-inset ring-primary'
                            : 'bg-surface-elevated text-text-primary ring-1 ring-inset ring-border',
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}

          <p className="mt-16 px-4 text-caption text-text-secondary">
            Belgilangan vaqtga yozilgan buyurtmada shoshilinch yuborish qoʻllanmaydi — usta
            oʻsha vaqtga rejalashtiriladi.
          </p>
        </>
      )}

      <p className="mt-20 px-4 text-caption text-text-secondary">
        Buyurtma tasdiqlangandan keyin vaqtni oʻzgartirib boʻlmaydi — bekor qilib, qaytadan
        berish kerak.
      </p>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

/**
 * Sana katagi.
 *
 * `SelectableChip` ISHLATILMAYDI: uning balandligi 36px (teginish nishoni
 * 44px), kengligi esa matnga bogʻliq — "1" katagi "28" dan tor chiqardi.
 *
 * `ring`, `border` EMAS: `border-width` oʻzgarsa katakning ichki qutisi
 * oʻzgarib qoʻshni kataklar siljiydi.
 */
function DayCell({
  day,
  now,
  isSelected,
  onSelect,
}: {
  day: DayOption;
  now: Date;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      tabIndex={isSelected ? 0 : -1}
      disabled={!day.hasSlots}
      aria-label={
        day.hasSlots
          ? formatDayLabel(day.date, now)
          : `${formatDayLabel(day.date, now)} — boʻsh vaqt yoʻq`
      }
      onClick={onSelect}
      className={cn(
        'flex h-[64px] w-[56px] shrink-0 flex-col items-center justify-center gap-2 rounded-md',
        'transition-[transform,background-color,box-shadow] duration-press ease-std',
        'active:scale-[0.97] disabled:active:scale-100',
        isSelected
          ? 'bg-primary-surface text-primary-pressed ring-2 ring-inset ring-primary'
          : 'bg-surface-elevated text-text-primary ring-1 ring-inset ring-border',
        !day.hasSlots && 'bg-surface-sunken text-text-disabled ring-1 ring-inset ring-border',
      )}
    >
      <span className="text-caption">{formatWeekdayShort(day.date)}</span>
      <span className="tabular text-title">{formatDayNumber(day.date)}</span>
      {/* Uchinchi signal: rang va halqadan tashqari ostidagi chiziq. Joyi
          tanlanmaganda ham band — kataklar sakramaydi. */}
      <span
        className={cn('h-4 w-16 rounded-full', isSelected ? 'bg-primary' : 'bg-transparent')}
        aria-hidden
      />
    </button>
  );
}
