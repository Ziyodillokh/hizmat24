import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { CaretRight } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

/**
 * Sozlama/roʻyxat qatorlari guruhi.
 *
 * Ilgari u `Tabs.tsx` ichida yashirin edi; "Karta" boʻlimining uchala
 * sahifasi ham shu naqshni ishlatgani uchun alohida komponentga chiqarildi.
 * Markup bir belgi ham oʻzgarmadi.
 */
export interface MenuItem {
  icon: IconGlyph;
  label: string;
  hint?: string;
  onSelect?: () => void;
  /** Chevron oʻrniga chiziladigan boshqaruv (masalan tema almashtirgichi). */
  control?: ReactNode;
  /** Buzuvchi amal (chiqish) — qizil tusda chiziladi. */
  danger?: boolean;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

/**
 * Sozlama qatorlari bitta kartaga yigʻiladi — alohida suzuvchi qatorlar
 * oʻrniga guruhlangan roʻyxat mobil ilovalarda tanish va tartibli koʻrinadi.
 *
 * Ikonalar tusli plitkada: ilovadagi barcha kartalar shu tilda gapiradi
 * (`OrderCard`, `ServiceCard`), yalangʻoch glif esa sozlamalar roʻyxatini
 * qolgan ekranlardan uzib qoʻyardi.
 */
export function MenuGroup({ section }: { section: MenuSection }) {
  return (
    <section className="mt-20">
      <h2 className="px-4 text-overline uppercase text-text-secondary">{section.title}</h2>

      <div
        className={cn(
          'mt-8 overflow-hidden rounded-lg border border-transparent bg-surface-elevated shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        {section.items.map((item, index) => {
          const isInteractive = Boolean(item.onSelect);
          const Row = isInteractive ? 'button' : 'div';

          return (
            <Row
              key={item.label}
              {...(isInteractive ? { type: 'button' as const, onClick: item.onSelect } : {})}
              className={cn(
                'flex min-h-touch w-full items-center gap-12 px-12 py-8 text-left',
                'transition-colors duration-press ease-std',
                isInteractive && 'active:bg-surface-sunken',
                index > 0 && 'border-t border-border',
              )}
            >
              <span
                className={cn(
                  'flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-sm',
                  item.danger ? 'bg-danger-surface text-danger' : 'bg-neutral-surface text-text-secondary',
                )}
                aria-hidden
              >
                <Icon icon={item.icon} size={20} weight="duotone" />
              </span>

              <span
                className={cn(
                  'min-w-0 flex-1 truncate text-body-lg',
                  item.danger ? 'text-danger' : 'text-text-primary',
                )}
              >
                {item.label}
              </span>

              {item.hint && (
                <span className="shrink-0 text-body-sm text-text-secondary">{item.hint}</span>
              )}
              {item.control ??
                (isInteractive && !item.danger && (
                  <Icon icon={CaretRight} size={16} className="shrink-0 text-text-secondary" />
                ))}
            </Row>
          );
        })}
      </div>
    </section>
  );
}
