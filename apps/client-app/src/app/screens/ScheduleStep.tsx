import { CalendarBlank, CalendarX, Lightning } from '@phosphor-icons/react';
import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { StepDots } from '@/components/StepDots';
import { Toggle } from '@/components/Toggle';
import { ChoiceCard } from '@/components/order/ChoiceCard';
import { ServiceSummaryCard } from '@/components/order/ServiceSummaryCard';
import { StepSection } from '@/components/order/StepSection';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatDayLabel, formatPrice, formatTime } from '@/lib/formatters';
import { firstMissingStep, ORDER_STEP_ROUTES, resolveNextRoute } from '@/lib/orderFlow';
import { URGENT_FEE } from '@/lib/pricing';
import {
  buildDayStrip,
  buildHours,
  groupHours,
  selectionFromSchedule,
  slotAt,
  type ScheduleMode,
} from '@/lib/schedule';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { useCatalog } from '../catalog-store';
import { useApp } from '../store';
import { useReturnTo } from '../useReturnTo';
import { MissingStepGuard } from './order/MissingStepGuard';
import { DayCell, HourButton } from './order/ScheduleParts';

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
/** Roving tabindex uchun: strelkalar tanlanadigan qoʻshniga oʻtadi. */
function moveIndex(current: number, step: number, length: number): number {
  return Math.max(0, Math.min(length - 1, current + step));
}

export function ScheduleStep() {
  const navigate = useNavigate();
  const { draft, setDraftSchedule } = useApp();

  const now = useMinuteClock();
  const days = useMemo(() => buildDayStrip(now), [now]);

  const returnTo = useReturnTo();
  const restored = useMemo(() => selectionFromSchedule(draft.scheduledAt, now), [draft.scheduledAt, now]);
  const [mode, setMode] = useState<ScheduleMode>(restored.mode);
  const [isUrgent, setIsUrgent] = useState(draft.isUrgent);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(restored.dayKey);
  const [selectedHour, setSelectedHour] = useState<number | null>(restored.hour);
  const wasSlotLost = draft.scheduledAt !== null && restored.hour === null;

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

  const { findCategory } = useCatalog();
  const category = findCategory(draft.categoryId);

  const missing = firstMissingStep(draft, ['category', 'address']);
  if (!category || missing) {
    return <MissingStepGuard title="Qachon kelsin?" missing={missing ?? { key: 'category', route: ORDER_STEP_ROUTES.services, title: 'Avval xizmat turini tanlang', cta: 'Xizmat tanlash' }} />;
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
    navigate(resolveNextRoute(ORDER_STEP_ROUTES.payment, returnTo));
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Qachon kelsin?" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <Button variant="primary" disabled={!canContinue} onClick={submit}>
            {returnTo ? 'Saqlash' : 'Toʻlovga oʻtish'}
          </Button>
        </StickyFooter>
      }
    >
      <StepDots currentStep={1} />
      <ServiceSummaryCard service={category} basePrice={category.basePrice} className="mt-16" />

      <StepSection title="Qachon kelsin?">
        <div role="radiogroup" aria-label="Vaqt rejimi" className="grid grid-cols-2 gap-8">
          <ChoiceCard orientation="stack" icon={Lightning} title="Imkon qadar tez" hint="Usta topilishi bilan" isSelected={mode === 'asap'} onSelect={() => changeMode('asap')} />
          <ChoiceCard orientation="stack" icon={CalendarBlank} title="Sana tanlash" hint="Kun va soatni oʻzingiz belgilaysiz" isSelected={mode === 'scheduled'} onSelect={() => changeMode('scheduled')} />
        </div>
      </StepSection>

      {mode === 'asap' ? (
        <Card className="mt-16">
          <div className="flex items-start gap-12">
            <span className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md bg-primary-surface text-primary-pressed" aria-hidden>
              <Icon icon={Lightning} size={20} weight="duotone" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-title text-text-primary">Usta qidiruvi darhol boshlanadi</p>
              <p className="mt-2 text-body-sm text-text-secondary">Aniq kelish vaqti usta topilgach maʼlum boʻladi.</p>
            </div>
          </div>
          {/* Shoshilinch qoʻshimchasi AYNAN shu yerda aytiladi (pricing.ts). */}
          <div className="mt-12 flex items-center justify-between gap-16 border-t border-border pt-12">
            <div className="min-w-0 flex-1">
              <p className="text-title text-text-primary">Shoshilinch</p>
              <p className="tabular mt-2 text-body-sm text-text-secondary">Navbatdan tashqari yuboriladi · +{formatPrice(URGENT_FEE)}</p>
            </div>
            <Toggle checked={isUrgent} onChange={setIsUrgent} label="Shoshilinch" />
          </div>
        </Card>
      ) : (
        <>
          {wasSlotLost && (
            <p className="mt-12 px-4 text-caption text-warning">Avval tanlangan vaqt oʻtib ketdi — yangi vaqt tanlang.</p>
          )}

          <StepSection title="Qaysi kun">
            <div
              role="radiogroup"
              aria-label="Sana"
              onKeyDown={onDayKeyDown}
              className="-mx-20 flex gap-8 overflow-x-auto px-20 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {days.map((day) => (
                <DayCell key={day.key} day={day} now={now} isSelected={day.key === selectedDayKey} onSelect={() => selectDay(day.key)} />
              ))}
            </div>
          </StepSection>

          <StepSection
            title="Qaysi vaqt"
            hint={selectedDay ? `${formatDayLabel(selectedDay.date, now)} · usta qidiruvi shu vaqtda boshlanadi` : undefined}
          >
            {hours.length === 0 ? (
              <EmptyState icon={CalendarX} title="Bugungi soatlar oʻtib ketdi" description="Boshqa kunni tanlang yoki «Imkon qadar tez» rejimiga oʻting" inline compact />
            ) : (
              <Card className="flex flex-col gap-16">
                {groupHours(hours).map((group) => (
                  <div key={group.key}>
                    <p className="text-caption text-text-secondary">{group.label}</p>
                    <div role="radiogroup" aria-label={group.label} onKeyDown={onHourKeyDown} className="mt-8 grid grid-cols-3 gap-8">
                      {group.hours.map((hour) => (
                        <HourButton
                          key={hour}
                          label={formatTime(slotAt(selectedDay?.date ?? now, hour))}
                          isSelected={hour === selectedHour}
                          onSelect={() => setSelectedHour(hour)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </StepSection>

          <p className="mt-12 px-4 text-caption text-text-secondary">Belgilangan vaqtga shoshilinch yuborish qoʻllanmaydi.</p>
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
