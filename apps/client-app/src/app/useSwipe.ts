import { useEffect, useRef, type RefObject } from 'react';
import { lockAxis, resolveSwipe, type SwipeDirection, type SwipeRules } from '@/lib/swipe';

/**
 * Gorizontal surishni Pointer Events orqali ushlash.
 *
 * Nega pointer, touch emas: React 18 touchstart/touchmove ni ildizda PASSIVE
 * ulaydi — `preventDefault` ishlamaydi, scrollni JS bilan toʻxtatib boʻlmaydi.
 * Yagona ishonchli usul CSS `touch-action: pan-y` (Tailwind `touch-pan-y`):
 * vertikal pan brauzerda qoladi, gorizontal harakat bizga `pointermove`
 * boʻlib keladi. Brauzer vertikal scrollga kirishib ketsa `pointercancel`
 * beradi — bu bizga kerakli oʻq qulfi.
 *
 * Hodisalar `addEventListener` bilan ulanadi (React propʼlari emas), shunda
 * callbacklar oʻzgarganda qayta ulanmaydi — ular ref orqali oʻqiladi.
 */
export interface SwipeHandlers {
  onSwipe: (direction: SwipeDirection) => void;
  /** Barmoq ostidagi gorizontal siljish; `null` — sudrash tugadi. */
  onDrag?: (dx: number | null) => void;
}

export interface SwipeOptions {
  rules?: SwipeRules;
  /** Sichqoncha bilan surish (brauzer preview, Playwright). Standart: ha. */
  allowMouse?: boolean;
  /** Shu selektor ichida boshlangan bosishlar eʼtiborsiz (gorizontal scroller). */
  ignoreSelector?: string;
}

interface Tracking {
  pointerId: number;
  startX: number;
  startY: number;
  startedAt: number;
  axis: 'x' | 'y' | null;
}

const DEFAULT_IGNORE = '[data-swipe-ignore]';

/**
 * Gorizontal sudrashdan keyin brauzer sintez qiladigan `click` shu oynada
 * yutiladi. Sichqonchada teginishdagi kabi "slop" yoʻq: bosib-surib-qoʻyib
 * yuborilsa ham bitta tugma ustida boʻlsa `click` keladi va qator ochilib
 * ketardi. Teginishda Android surishdan keyin `click` bermaydi — oyna zarar
 * qilmaydi.
 */
const CLICK_SUPPRESS_MS = 300;

export function useSwipe<T extends HTMLElement>(
  ref: RefObject<T>,
  handlers: SwipeHandlers,
  options: SwipeOptions = {},
): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let tracking: Tracking | null = null;
    // Vaqt oynasi, bayroq emas: element tashqarisida qoʻyib yuborilsa `click`
    // umuman kelmaydi va bayroq keyingi haqiqiy bosishni yutib yuborardi.
    let suppressClickUntil = 0;

    const finish = () => {
      if (!tracking) return;
      tracking = null;
      handlersRef.current.onDrag?.(null);
    };

    const isIgnored = (event: PointerEvent): boolean => {
      const { allowMouse = true, ignoreSelector = DEFAULT_IGNORE } = optionsRef.current;
      if (!event.isPrimary) return true;
      if (event.pointerType === 'mouse' && (!allowMouse || event.button !== 0)) return true;
      const target = event.target;
      return target instanceof Element && target.closest(ignoreSelector) !== null;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (tracking || isIgnored(event)) return;
      tracking = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        startedAt: event.timeStamp,
        axis: null,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!tracking || event.pointerId !== tracking.pointerId) return;
      const dx = event.clientX - tracking.startX;
      const dy = event.clientY - tracking.startY;

      if (tracking.axis === null) {
        const axis = lockAxis(dx, dy);
        if (axis === null) return;
        if (axis === 'y') {
          // Scroll — brauzerga qoldiramiz, surish bekor.
          tracking = null;
          return;
        }
        tracking = { ...tracking, axis: 'x' };
      }
      handlersRef.current.onDrag?.(dx);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!tracking || event.pointerId !== tracking.pointerId) return;
      const sample = {
        dx: event.clientX - tracking.startX,
        dy: event.clientY - tracking.startY,
        elapsedMs: event.timeStamp - tracking.startedAt,
      };
      const locked = tracking.axis === 'x';
      finish();
      if (!locked) return;
      suppressClickUntil = event.timeStamp + CLICK_SUPPRESS_MS;
      const direction = resolveSwipe(sample, optionsRef.current.rules);
      if (direction) handlersRef.current.onSwipe(direction);
    };

    const onPointerCancel = (event: PointerEvent) => {
      if (!tracking || event.pointerId !== tracking.pointerId) return;
      finish();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (event.timeStamp >= suppressClickUntil) return;
      suppressClickUntil = 0;
      event.preventDefault();
      event.stopPropagation();
    };

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('click', onClickCapture, true);
    element.addEventListener('pointermove', onPointerMove);
    element.addEventListener('pointerup', onPointerUp);
    element.addEventListener('pointercancel', onPointerCancel);
    // Barmoq element tashqarisida koʻtarilsa ham sudrash yopilsin.
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('blur', finish);

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('click', onClickCapture, true);
      element.removeEventListener('pointermove', onPointerMove);
      element.removeEventListener('pointerup', onPointerUp);
      element.removeEventListener('pointercancel', onPointerCancel);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('blur', finish);
    };
  }, [ref]);
}
