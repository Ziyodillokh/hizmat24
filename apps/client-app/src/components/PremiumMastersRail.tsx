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
 * Halqa OQ (referens maket): koʻk hero ustida oq halqa eng toza kontrast
 * beradi va foto atrofida "stories" effektini yaratadi. Ilgari halqa oltin
 * edi — u turkuaz fon uchun tanlangan va koʻk ustida begona koʻrinardi.
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
        '-mx-20 flex gap-8 overflow-x-auto px-20',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
    >
      {masters.map((master) => (
        <button
          key={master.id}
          type="button"
          onClick={() => onSelect(master.id)}
          aria-label={`${master.fullName} — ${master.profession}`}
          className="flex w-[64px] shrink-0 flex-col items-center gap-4 transition-transform duration-press ease-emphasized active:scale-[0.94]"
        >
          {/*
            Oq halqa va uning ichida SHAFFOF tirqish: hero gradient boʻlgani
            uchun qatʼiy rangli tirqish doira atrofida notoʻgʻri rangdagi
            ikkinchi halqa boʻlib koʻrinardi. Shaffof tirqishda fonning oʻzi
            koʻrinadi.
          */}
          {/*
            `flex` shart: `block` boʻlganda ichkaridagi inline avatar qator
            qutisini hosil qilib, oʻramning balandligini kengligidan katta
            qilardi (58x65) va halqa DOIRA emas, ellips boʻlib chizilardi.
          */}
          <span className="flex rounded-full border-2 border-on-primary-deep p-[2px]">
            <Avatar name={master.fullName} src={master.photoUrl} size={44} />
          </span>

          {/*
            Yorliq — ISM, kasb emas: platforma faqat santexnika (2026-09-13),
            beshta "Santexnik" yozuvi hech narsa aytmasdi va uzun
            mutaxassisliklar 64px da qirqilardi. Kasb `aria-label` da qoladi.
          */}
          <span className="w-full truncate text-center text-caption text-on-primary-deep">
            {master.fullName.split(' ')[0]}
          </span>
        </button>
      ))}
    </div>
  );
}
