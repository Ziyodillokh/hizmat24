import {
  BellSlash,
  Camera,
  ChatCircleSlash,
  CurrencyCircleDollar,
  Funnel,
  MapTrifold,
  SealPercent,
  SealQuestion,
  Tag,
  UsersThree,
} from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { DashedChip } from '@/components/DashedChip';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { SupportPhoneBlock } from '@/components/PreparedMessage';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import {
  MASTER_LIMITS,
  MASTER_LIMITS_INTRO,
  SOON_LABEL,
  type MasterLimitId,
} from '@/lib/masterLimits';
import { useMinuteClock } from '@/lib/useMinuteClock';

/**
 * «Nimalar hali ishlamaydi» — ilovaning yagona rost roʻyxati.
 *
 * Har bir qator `span`: bosiladigan element yoʻq, chunki bosiladigan narsa
 * hech nima qilmasdi. Roʻyxatning oʻzi `src/lib/masterLimits.ts` da va u
 * yerdan bir necha ekran oʻqiydi.
 */
const LIMIT_ICONS: Record<MasterLimitId, IconGlyph> = {
  chat: ChatCircleSlash,
  map: MapTrifold,
  push: BellSlash,
  payout: CurrencyCircleDollar,
  photo: Camera,
  certificate: SealQuestion,
  otherOrders: UsersThree,
  price: Tag,
  commission: SealPercent,
  districtFilter: Funnel,
};

export function MasterLimitsScreen() {
  const navigate = useNavigate();
  const now = useMinuteClock();

  return (
    <ScreenShell
      header={
        <Header
          variant="inner"
          title="Nimalar hali ishlamaydi"
          onBack={() => navigate('/app/master/profile')}
        />
      }
    >
      <p className="mt-8 text-body text-text-secondary">{MASTER_LIMITS_INTRO}</p>

      <ul className="mt-20 flex flex-col gap-16">
        {MASTER_LIMITS.map((limit) => (
          <li key={limit.id} className="flex items-start gap-12">
            <span
              className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-md bg-neutral-surface"
              aria-hidden
            >
              <Icon icon={LIMIT_ICONS[limit.id]} size={20} className="text-text-secondary" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-8">
                <span className="text-title text-text-primary">{limit.title}</span>
                <DashedChip size="compact">{SOON_LABEL}</DashedChip>
              </span>
              <span className="mt-4 block text-body-sm text-text-secondary">{limit.sentence}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* Roʻyxatdagi savolga ilova javob bera olmaydi — tirik odam javob beradi. */}
      <SupportPhoneBlock className="mt-32" now={now} onOpen={() => undefined} />

      <div className="h-24" aria-hidden />
    </ScreenShell>
  );
}
