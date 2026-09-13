import { useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { previewOffset, type SwipeDirection } from '@/lib/swipe';
import { useSwipe } from '@/app/useSwipe';

/**
 * Buyurtmalar roʻyxatining surish yuzasi.
 *
 * Barmoq ortidan roʻyxat 24px gacha siljiydi (chekkada 8px "rezina"),
 * qoʻyib yuborilganda pruzhina bilan qaytadi. Yangi filtr kontentining
 * KIRISH animatsiyasi bu yerda emas — uni ekran `list-enter` keyframe bilan
 * beradi (yoʻnalish va masofa `--list-enter-x` orqali). Ilgari kirish ham shu
 * yerda ikki bosqichli transition edi: `from` qiymati brauzer stilni qayta
 * hisoblashiga ulgurmay 0 ga almashar va roʻyxat NOTOʻGʻRI tomondan kirardi.
 *
 * `touch-pan-y` shart: usiz Android WebView gorizontal harakatni ham oʻzi
 * olib, `pointercancel` beradi va surish hech qachon yetib kelmaydi.
 * `flex-1` (ota `main` — flex ustun): qisqa roʻyxat ostidagi boʻsh joyda ham
 * surish ishlaydi, lekin sahifa tab qatori balandligiga ortiqcha scroll
 * qilmaydi — `min-h-full` aynan shunday qilardi.
 */
interface SwipeSurfaceProps<K extends string> {
  /** Yoʻnalishdagi qoʻshni; `null` — chekka (rezina). */
  neighbour: (direction: SwipeDirection) => K | null;
  onSwipe: (target: K, direction: SwipeDirection) => void;
  children: ReactNode;
}

export function SwipeSurface<K extends string>({ neighbour, onSwipe, children }: SwipeSurfaceProps<K>) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [dragDx, setDragDx] = useState<number | null>(null);

  useSwipe(surfaceRef, {
    onDrag: setDragDx,
    onSwipe: (direction) => {
      const target = neighbour(direction);
      if (target !== null) onSwipe(target, direction);
    },
  });

  const translate =
    dragDx === null ? 0 : previewOffset(dragDx, neighbour(dragDx < 0 ? 'left' : 'right') !== null);

  return (
    <div
      ref={surfaceRef}
      data-testid="orders-swipe-surface"
      className={cn(
        'flex-1 touch-pan-y select-none',
        // Sudrash paytida transition yoʻq — barmoqqa yopishib turadi; qaytish
        // pruzhinasi faqat harakat kamaytirilmagan boʻlsa.
        dragDx === null &&
          'motion-safe:transition-transform motion-safe:duration-state motion-safe:ease-emphasized',
      )}
      style={{ transform: translate === 0 ? undefined : `translateX(${translate}px)` }}
    >
      {children}
    </div>
  );
}
