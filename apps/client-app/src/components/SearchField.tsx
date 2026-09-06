import { MagnifyingGlass } from '@phosphor-icons/react';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';
import { FIELD_FOCUS_RING_CLASSES } from './Input';

/**
 * Qidiruv paneli — spetsifikatsiya 9.3-bandi.
 * h=56, radius/md. Chapda placeholder, oʻngda 20px lupa ikonasi.
 *
 * `floating` — Light temadagi tepa turkuaz blok ustida suzuvchi oq variant
 * (oq toʻldirish + e2 soya). Bu 14.7-band 56-punktda ruxsat etilgan yagona
 * tema farqi, shuning uchun qaysi variant kerakligini ekran hal qiladi.
 * Aks holda fon `surface-sunken` + 1px `border`.
 */
type SearchFieldSurface = 'sunken' | 'floating';

const SURFACE_CLASSES: Record<SearchFieldSurface, string> = {
  sunken: 'border border-border bg-surface-sunken',
  // Light: chuqur maydon ustida suzuvchi oq tabletka.
  // Dark: oʻsha maydonga oʻyilgan quduq + ingichka chegara. Ilgari Darkʼda
  // `surface-elevated` (#123738) hero (#1C6B6B) ustida deyarli koʻrinmasdi.
  floating:
    "border border-transparent bg-surface-elevated shadow-e2 [[data-theme='dark']_&]:border-border [[data-theme='dark']_&]:bg-surface [[data-theme='dark']_&]:shadow-none",
};

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  floating?: boolean;
}

export function SearchField({
  floating = false,
  placeholder = 'Xizmat qidirish',
  className,
  ...rest
}: SearchFieldProps) {
  return (
    <div className={cn('relative w-full', className)}>
      <input
        type="text"
        placeholder={placeholder}
        className={cn(
          // Oʻng padding: 16 chekka + 20 ikona + 12 boʻshliq = 48.
          'h-[56px] w-full rounded-full px-20 pr-48 text-body-lg text-text-primary outline-none',
          'placeholder:text-text-secondary',
          'focus:border-2 focus:border-primary',
          FIELD_FOCUS_RING_CLASSES,
          SURFACE_CLASSES[floating ? 'floating' : 'sunken'],
        )}
        {...rest}
      />
      <Icon
        icon={MagnifyingGlass}
        size={20}
        aria-hidden
        className={cn(
          'pointer-events-none absolute right-20 top-1/2 -translate-y-1/2',
          floating ? 'text-primary' : 'text-text-secondary',
        )}
      />
    </div>
  );
}
