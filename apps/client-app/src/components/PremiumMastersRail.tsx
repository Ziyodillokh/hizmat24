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
 * Halqa OLTIN rangda (`illus-hi-vis`, #F5B942): turkuaz hero ustida brend
 * rangidagi halqa fonga singib ketardi. Reyting yulduzining rangi (`star`)
 * bu yerda toʻgʻri kelmadi — u toʻq jigarrang-sariq va halqa "premium"
 * emas, zanglagan koʻrinardi.
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
            Oltin halqa va uning ichida SHAFFOF tirqish.
            Ilgari tirqish `surface-hero` qatʼiy rangida edi, hero esa
            gradient — tirqish fonga mos kelmay, doira atrofida notoʻgʻri
            rangdagi ikkinchi halqa boʻlib koʻrinardi. Shaffof tirqishda
            fonning oʻzi koʻrinadi va halqa qayerda tursa ham toʻgʻri chiqadi.
          */}
          {/*
            `flex` shart: `block` boʻlganda ichkaridagi inline avatar qator
            qutisini hosil qilib, oʻramning balandligini kengligidan katta
            qilardi (58x65) va halqa DOIRA emas, ellips boʻlib chizilardi.
          */}
          <span className="flex rounded-full border-[2.5px] border-illus-hi-vis p-[3px]">
            <Avatar name={master.fullName} src={master.photoUrl} size={48} />
          </span>

          <span className="w-full truncate text-center text-caption text-on-primary-deep/[0.92]">
            {master.profession}
          </span>
        </button>
      ))}
    </div>
  );
}
