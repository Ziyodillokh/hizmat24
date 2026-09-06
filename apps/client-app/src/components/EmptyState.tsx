import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, type ButtonVariant } from './Button';
import { Icon } from './Icon';

/**
 * Bo'sh holat — spetsifikatsiya 9.20 va 12.2-bandlari.
 * 96px outline ikona · 20px · `h3` sarlavha · 8px · `body-sm` tushuntirish
 * (maksimum 2 satr) · 24px · ixtiyoriy tugma.
 */
export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
}

export interface EmptyStateProps {
  /**
   * Blok sahifa oqimi ichida turibdi (ro'yxat ostida), to'liq ekranda emas.
   * Bunda vertikal markazlashtirish va 25% siljish qo'llanmaydi.
   */
  inline?: boolean;
  /**
   * Ixcham variant: bosh sahifadagi kabi blok sahifaning kichik qismini
   * egallashi kerak bo'lganda — ikona va bo'shliqlar kichrayadi.
   */
  compact?: boolean;
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Berilmasa tugma bloki chizilmaydi VA matn ostidagi bo'shliq 0 bo'ladi. */
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  inline = false,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center px-20',
        // To'liq ekran varianti markazda turadi va 25% yuqoriga siljiydi (12.2-band).
        // Sahifa ichida esa siljimaydi — aks holda blok yuqoridagi kontent
        // ustiga chiqib ketadi.
        inline ? (compact ? 'py-16' : 'py-32') : 'flex-1 justify-center',
        className,
      )}
    >
      {/*
       * Blok konteyner markazida turadi. Ilgari u 25% ga yuqoriga siljitilardi,
       * lekin ekran ostida tab bar borligi uchun optik markaz allaqachon
       * o'rtadan yuqorida — qo'shimcha siljish blokni ekranning yuqori
       * uchdan biriga chiqarib, ostida katta bo'sh maydon qoldirardi.
       */}
      <div className="flex w-full flex-col items-center text-center">
        <Icon
          icon={icon}
          size={compact ? 48 : 96}
          className="text-text-disabled"
          aria-hidden
        />
        <h3 className={cn(compact ? 'mt-12 text-body-lg' : 'mt-20 text-h3', 'text-text-primary')}>
          {title}
        </h3>
        {description && (
          <p className="mt-8 line-clamp-2 text-body-sm text-text-secondary">{description}</p>
        )}
        {action && (
          <div className={compact ? 'mt-12' : 'mt-24'}>
            <Button
              variant={action.variant ?? 'primary'}
              size={compact ? 'small' : 'default'}
              fullWidth={false}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
