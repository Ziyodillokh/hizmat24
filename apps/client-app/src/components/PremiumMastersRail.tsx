import { cn } from '@/lib/cn';
import { Avatar } from './Avatar';

/**
 * Bosh sahifa yuqorisidagi premium ustalar qatori.
 *
 * Telegram "stories" naqshi: gorizontal suriladigan dumaloq avatarlar,
 * ostida qisqa yorliq. Bu yerda u premium tarifning asosiy imtiyozi —
 * faqat tarifni sotib olgan ustalar shu qatorga tushadi va mijoz ilovani
 * ochishi bilan ularni koʻradi.
 *
 * Halqa OLTIN rangda: turkuaz hero maydoni ustida brend rangidagi halqa
 * fonga singib ketardi, oltin esa "premium" ni bir qarashda aytadi va
 * ilovadagi yulduz/reyting oilasi bilan bitta tusda.
 *
 * Qator hero blokining ichida turadi, shuning uchun yorliqlar oq rangda.
 */
export interface PremiumMaster {
  id: string;
  fullName: string;
  profession: string;
  photoUrl?: string;
}

export interface PremiumMastersRailProps {
  masters: readonly PremiumMaster[];
  onSelect: (id: string) => void;
  className?: string;
}

export function PremiumMastersRail({ masters, onSelect, className }: PremiumMastersRailProps) {
  // Premium usta boʻlmasa qator umuman chizilmaydi — boʻsh tasma sahifa
  // tepasida tushuntirib boʻlmaydigan boʻshliq qoldirardi.
  if (masters.length === 0) return null;

  return (
    <div
      className={cn(
        // `-mx-20 px-20`: qator ekran chetigacha suriladi, lekin birinchi va
        // oxirgi element sahifa paddingiga tekislanadi.
        '-mx-20 flex gap-12 overflow-x-auto px-20',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {masters.map((master) => (
        <button
          key={master.id}
          type="button"
          onClick={() => onSelect(master.id)}
          className="flex w-[64px] shrink-0 flex-col items-center gap-4 transition-transform duration-press ease-emphasized active:scale-[0.94]"
        >
          {/*
            Ikki qatlamli halqa: tashqarida oltin gradient, ichkarida hero
            rangidagi 2px tirqish. Tirqishsiz halqa fotoga yopishib, qalin
            chekka boʻlib koʻrinadi.
          */}
          <span className="rounded-full bg-gradient-to-br from-star to-illus-hi-vis p-[2px]">
            <span className="block rounded-full border-2 border-surface-hero">
              <Avatar name={master.fullName} src={master.photoUrl} size={48} />
            </span>
          </span>

          <span className="w-full truncate text-center text-caption text-on-primary-deep/[0.92]">
            {master.profession}
          </span>
        </button>
      ))}
    </div>
  );
}
