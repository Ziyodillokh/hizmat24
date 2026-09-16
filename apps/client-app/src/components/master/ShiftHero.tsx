import { Button } from '@/components/Button';
import { cn } from '@/lib/cn';
import type { MasterProfile } from '@/lib/masterProfile';
import {
  shiftActionLabel,
  shiftHintLine,
  shiftHoursLine,
  shiftSinceLine,
  shiftStateLine,
} from '@/lib/masterShift';

/**
 * Smena bloki — «Ishlar» ekranining eng tepasi va eng katta tugmasi.
 *
 * Usta ilovani aynan shuning uchun ochadi, shuning uchun blok `.banner-field`
 * sathida turadi va boshqa hech bir karta bilan raqobatlashmaydi. Toggle EMAS:
 * kalit «yoqilgan/oʻchirilgan» deydi, tugma esa nima boʻlishini aytadi.
 *
 * Butun matn `src/lib/masterShift.ts` dan keladi — komponentda birorta jumla
 * ham qurilmaydi.
 */
export interface ShiftHeroProps {
  profile: MasterProfile;
  /** `useMinuteClock()` dan; komponent ichida `new Date()` chaqirilmaydi. */
  now: Date;
  onOpen: () => void;
  onClose: () => void;
  /** Profil toʻliq boʻlmaguncha smena ochilmaydi. */
  disabled?: boolean;
  /** Tugma nega oʻchiq — sabab ekranda yoziladi. */
  disabledHint?: string | null;
  className?: string;
}

export function ShiftHero({
  profile,
  now,
  onOpen,
  onClose,
  disabled = false,
  disabledHint,
  className,
}: ShiftHeroProps) {
  const sinceLine = shiftSinceLine(profile, now);
  const hint = shiftHintLine(profile, now);

  return (
    <section className={cn('banner-field rounded-lg p-16 text-on-primary-deep', className)}>
      <p className="text-overline uppercase text-on-primary-deep">Smena</p>
      <h2 className="mt-4 text-h2 text-on-primary-deep">{shiftStateLine(profile)}</h2>

      {/* Davomiylik faqat ochiq smenada va faqat boshlanish vaqti saqlangan
          boʻlsa — taxminiy raqam chizilmaydi. */}
      {sinceLine && <p className="tabular mt-4 text-body-sm text-on-primary-deep">{sinceLine}</p>}

      <p className="mt-4 text-body-sm text-on-primary-deep">{shiftHoursLine(profile)}</p>
      {hint && <p className="mt-4 text-caption text-on-primary-deep">{hint}</p>}
      {disabled && disabledHint && (
        <p className="mt-8 text-caption text-on-primary-deep">{disabledHint}</p>
      )}

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
        disabled={disabled}
        onClick={profile.isAvailable ? onClose : onOpen}
      >
        {shiftActionLabel(profile)}
      </Button>
    </section>
  );
}
