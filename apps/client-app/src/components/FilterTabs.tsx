import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';

/**
 * Filtr tablari — toʻliq kenglikdagi, scroll QILMAYDIGAN tab qatori.
 *
 * `SelectableChip` qatoridan farqi: chegarali tabletka yoʻq, har tab oʻz
 * matni kengligida (`flex-auto`), ostida bitta 2px koʻk indikator tanlangan
 * tabga SURILADI (transform), rang almashmaydi. Hisob — 18px nishon.
 * Yorliqlar qisqa boʻlishi chaqiruvchining javobgarligi: toʻrt tab 320px
 * kontent kengligiga sigʻmasa, qator emas, yorliq qisqaradi (`ariaLabel`
 * toʻliq nomni oʻqiydi).
 *
 * Klaviatura: ← → qoʻshni tab (chekkada toʻxtaydi, aylanmaydi).
 * `sticky` kerak boʻlsa `className` orqali: `sticky top-0 z-10 bg-surface`.
 */
export interface FilterTabItem<K extends string> {
  key: K;
  /** Qisqa koʻrinadigan yorliq. */
  label: string;
  /** Toʻliq nom ekran oʻquvchi uchun (son bilan birga). */
  ariaLabel?: string;
  /** `null` — nishon chizilmaydi (`formatTabCount`). */
  count?: string | null;
}

export interface FilterTabsProps<K extends string> {
  items: readonly FilterTabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /** `role="tablist"` nomi: "Buyurtma filtrlari". */
  ariaLabel: string;
  className?: string;
}

interface Indicator {
  left: number;
  width: number;
}

const ARROW_STEP: Record<string, 1 | -1> = { ArrowRight: 1, ArrowLeft: -1 };

export function FilterTabs<K extends string>({ items, value, onChange, ariaLabel, className }: FilterTabsProps<K>) {
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Partial<Record<K, HTMLButtonElement | null>>>({});
  const [indicator, setIndicator] = useState<Indicator | null>(null);

  // Indikator tanlangan tabning haqiqiy kengligini oʻlchaydi — yorliq
  // uzunligi tilga bogʻliq, teng boʻlaklarga boʻlib boʻlmaydi.
  useLayoutEffect(() => {
    const list = listRef.current;
    let isActive = true;
    const measure = () => {
      const tab = tabRefs.current[value];
      if (!isActive || !tab) return;
      setIndicator({ left: tab.offsetLeft, width: tab.offsetWidth });
    };
    measure();
    // Inter Variable birinchi renderdan keyin yuklanishi mumkin — shrift
    // almashganda tab kengligi bir necha px siljiydi, indikator qayta oʻlchanadi.
    if (typeof document !== 'undefined' && 'fonts' in document) {
      void document.fonts.ready.then(measure);
    }
    const observer =
      list && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    if (list) observer?.observe(list);
    return () => {
      isActive = false;
      observer?.disconnect();
    };
  }, [value, items]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = ARROW_STEP[event.key];
    if (!step) return;
    const index = items.findIndex((item) => item.key === value);
    const next = items[index + step];
    if (!next) return;
    event.preventDefault();
    onChange(next.key);
    tabRefs.current[next.key]?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn('relative -mx-20 flex border-b border-border px-20', className)}
    >
      {items.map((item) => {
        const isSelected = item.key === value;

        return (
          <button
            key={item.key}
            ref={(el) => {
              tabRefs.current[item.key] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={item.ariaLabel}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(item.key)}
            className={cn(
              // Bir xil ogʻirlik (600) ikkala holatda — tanlanganda kenglik
              // oʻzgarmasin, indikator oʻlchovi sakramasin.
              // `min-w-0` + `truncate`: sonlar "99+" boʻlganda ham qator 360px
              // dan oshmaydi — yorliq qisqaradi, toʻliq nom `aria-label` da.
              'flex h-[44px] min-w-0 flex-auto items-center justify-center gap-4 whitespace-nowrap px-4 text-body-sm font-semibold',
              'transition-colors duration-state ease-std',
              isSelected ? 'text-primary' : 'text-text-secondary',
            )}
          >
            <span className="truncate">{item.label}</span>
            {item.count && (
              <span
                className={cn(
                  'tabular inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-4 text-badge',
                  'transition-colors duration-state ease-std',
                  isSelected ? 'bg-primary-surface text-primary-pressed' : 'bg-surface-sunken text-text-secondary',
                )}
                aria-hidden
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}

      {indicator && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute -bottom-[1px] left-0 h-[2px] rounded-full bg-primary',
            'motion-safe:transition-[transform,width] motion-safe:duration-enter motion-safe:ease-emphasized',
          )}
          style={{ width: indicator.width, transform: `translateX(${indicator.left}px)` }}
        />
      )}
    </div>
  );
}
