import { CaretRight, Check, Crown, Medal } from '@phosphor-icons/react';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ShareBar } from '@/components/ShareBar';
import { DashedChip } from '@/components/DashedChip';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/formatters';
import { CASHBACK_BLOCK, CASHBACK_PERCENT, type WalletView } from '@/lib/wallet';
import { levelProgressCopy, levelRatio, stampHint } from '@/lib/walletCard';

/**
 * Bonuslar "chiptasi" — daraja progressi va keshbek shtamplari BITTA bosiladigan
 * kartada; ikkalasi ham /app/wallet/bonus ga olib boradi.
 *
 * Daraja — HAQIQIY (chegirma checkoutʼda qoʻllanadi). Keshbek — demo mexanika:
 * shu yerda faqat toʻlgan katakchalar soni koʻrsatiladi, soʻm summasi EMAS —
 * demo pulni haqiqiy chekdek chizmaslik uchun; chiziqli "Demo" chipi buni
 * ochiq aytadi.
 *
 * Ichida boshqa tugma yoʻq — butun karta bitta `<button>`, ichma-ich
 * interaktiv element (yaroqsiz HTML) yuzaga kelmaydi.
 */
export interface BonusCardProps {
  wallet: Pick<WalletView, 'level' | 'nextLevel' | 'ordersTotal' | 'ordersToNextLevel' | 'levelPercent' | 'cashback'>;
  onSelect: () => void;
  className?: string;
}

export function BonusCard({ wallet, onSelect, className }: BonusCardProps) {
  const { level, cashback } = wallet;
  const stamps = Array.from({ length: CASHBACK_BLOCK }, (_, index) => index < cashback.filled);

  return (
    <Card className={cn('overflow-hidden p-0', className)}>
      <button
        type="button"
        onClick={onSelect}
        className="block w-full p-12 text-left transition-colors duration-press ease-std active:bg-surface-sunken"
      >
        {/* Daraja qatori. */}
        <span className="flex items-center gap-12">
          <span
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-sm bg-primary-surface text-primary-pressed"
            aria-hidden
          >
            <Icon icon={level.key === 'gold' ? Crown : Medal} size={20} weight="duotone" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-8">
              <span className="truncate text-title text-text-primary">{level.label} daraja</span>
              <span className="tabular shrink-0 text-caption text-text-secondary">{levelRatio(wallet)}</span>
            </span>
            <ShareBar value={wallet.levelPercent} className="mt-8" />
            <span className="mt-4 block truncate text-caption text-text-secondary">
              {levelProgressCopy(wallet)}
            </span>
          </span>

          <Icon icon={CaretRight} size={16} className="shrink-0 text-text-secondary" aria-hidden />
        </span>

        {/* Keshbek shtamplari — 10×20 + 9×4 = 236px, 320px kontentga ham sigʻadi. */}
        <span className="mt-12 flex items-center justify-between gap-8 border-t border-border pt-12">
          <span className="min-w-0 truncate text-body-sm text-text-primary">
            Keshbek · har {CASHBACK_BLOCK} ta buyurtmada {formatPercent(CASHBACK_PERCENT)}
          </span>
          <DashedChip size="compact">Demo</DashedChip>
        </span>
        <span className="mt-8 grid grid-cols-10 justify-items-center gap-4" aria-hidden>
          {stamps.map((isFilled, index) => (
            <span
              key={index}
              className={cn(
                'flex h-[20px] w-[20px] items-center justify-center rounded-full',
                isFilled ? 'bg-primary text-on-primary' : 'border border-border-strong bg-surface-sunken',
              )}
            >
              {isFilled && <Icon icon={Check} size={14} weight="bold" />}
            </span>
          ))}
        </span>
        <span className="mt-8 block truncate text-caption text-text-secondary">
          {stampHint(cashback)} · hozircha toʻlovda qoʻllanmaydi
        </span>
      </button>
    </Card>
  );
}
