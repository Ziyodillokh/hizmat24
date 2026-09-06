import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, type ButtonVariant } from './Button';
import { Icon } from './Icon';

/**
 * Boʻsh holat — spetsifikatsiya 9.20 va 12.2-bandlari.
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
   * Blok sahifa oqimi ichida turibdi (roʻyxat ostida), toʻliq ekranda emas.
   * Bunda vertikal markazlashtirish va 25% siljish qoʻllanmaydi.
   */
  inline?: boolean;
  /**
   * Ixcham variant: bosh sahifadagi kabi blok sahifaning kichik qismini
   * egallashi kerak boʻlganda — ikona va boʻshliqlar kichrayadi.
   */
  compact?: boolean;
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Berilmasa tugma bloki chizilmaydi VA matn ostidagi boʻshliq 0 boʻladi. */
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
        // Toʻliq ekran varianti markazda turadi va 25% yuqoriga siljiydi (12.2-band).
        // Sahifa ichida esa siljimaydi — aks holda blok yuqoridagi kontent
        // ustiga chiqib ketadi.
        inline ? (compact ? 'py-16' : 'py-32') : 'flex-1 justify-center',
        className,
      )}
    >
      {/*
       * Blok konteyner markazida turadi. Ilgari u 25% ga yuqoriga siljitilardi,
       * lekin ekran ostida tab bar borligi uchun optik markaz allaqachon
       * oʻrtadan yuqorida — qoʻshimcha siljish blokni ekranning yuqori
       * uchdan biriga chiqarib, ostida katta boʻsh maydon qoldirardi.
       */}
      <div className="flex w-full flex-col items-center text-center">
        {/*
          Ikkita ichma-ich tusli disk. Ilgari bu 24px lik interfeys glifini
          96px gacha kattalashtirib, uni OʻCHIRILGAN rangda chizish edi —
          shuning uchun boʻsh ekran "boʻsh" emas, "buzilgan" boʻlib oʻqilardi.
          Alfa qiymatlari yuza ustiga kompozitsiya qilinadi, yaʼni ikkala
          temada ham oʻzgarishsiz ishlaydi.
        */}
        <span
          className={cn(
            'flex items-center justify-center rounded-full bg-primary/[0.06]',
            compact ? 'h-[72px] w-[72px]' : 'h-[112px] w-[112px]',
          )}
        >
          <span
            className={cn(
              'flex items-center justify-center rounded-full bg-primary/[0.10]',
              compact ? 'h-[48px] w-[48px]' : 'h-[76px] w-[76px]',
            )}
          >
            <Icon
              icon={icon}
              size={compact ? 24 : 40}
              className="text-primary/[0.55]"
              aria-hidden
            />
          </span>
        </span>
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
