import { Check, Crown, Gift, Medal } from '@phosphor-icons/react';
import type { Icon as IconGlyph } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { SummaryRow } from '@/components/SummaryRow';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { formatPercent, formatPrice } from '@/lib/formatters';
import { CASHBACK_BLOCK, CASHBACK_PERCENT, LEVELS, type LevelKey } from '@/lib/wallet';
import { useWallet } from '../useWallet';

/**
 * Bonuslar — daraja va keshbek.
 *
 * Ikkita ALOHIDA mexanika: doimiy daraja chegirmasi (buyurtma soniga qarab
 * 2/4/6%) va har 10 buyurtmada bir marta beriladigan 1% keshbek. Demo ularni
 * ataylab ajratgan va bu yerda ham birlashtirilmaydi.
 */

/** Daraja ikonasi: eng yuqorisi toj bilan ajralib turadi. */
const LEVEL_ICONS: Record<LevelKey, IconGlyph> = {
  bronze: Medal,
  silver: Medal,
  gold: Crown,
};

/** Plitka tuslari toʻliq literal — dinamik sinf nomi Tailwindʼda yigʻilmaydi. */
const LEVEL_TONES: Record<LevelKey, string> = {
  bronze: 'bg-neutral-surface text-text-secondary',
  silver: 'bg-primary-surface text-primary-pressed',
  gold: 'bg-warning-surface text-warning',
};

const LEVEL_RANGES: Record<LevelKey, string> = {
  bronze: '0–9 ta buyurtma',
  silver: '10–29 ta buyurtma',
  gold: '30 ta buyurtmadan boshlab',
};

export function WalletBonus() {
  const navigate = useNavigate();
  const { level, nextLevel, ordersTotal, ordersToNextLevel, levelPercent, cashback } = useWallet();

  const stamps = Array.from({ length: CASHBACK_BLOCK }, (_, index) => index < cashback.filled);

  const stampHint =
    cashback.filled === 0
      ? `Blok boshlanmagan · ${CASHBACK_BLOCK} ta buyurtma qoldi`
      : cashback.remaining === 0
        ? `${CASHBACK_BLOCK} ta toʻldirildi · blok yakunlandi`
        : `${cashback.filled} ta toʻldirildi · ${cashback.remaining} ta qoldi`;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Bonuslar" onBack={() => navigate(-1)} />}
    >
      {/*
        Daraja kartasi HAR DOIM chiziladi, buyurtma yoʻq boʻlsa ham: bu boʻsh
        ekran emas, narvonning boshi.
      */}
      <div className="banner-field relative mt-4 overflow-hidden rounded-lg p-16">
        <p className="text-overline uppercase text-on-primary-deep/[0.92]">Sizning darajangiz</p>

        <div className="mt-4 flex items-center gap-12">
          <Icon
            icon={LEVEL_ICONS[level.key]}
            size={28}
            weight="fill"
            className="text-on-primary-deep"
            aria-hidden
          />
          <p className="text-h1 text-on-primary-deep">{level.label}</p>
        </div>

        <p className="mt-2 text-caption text-on-primary-deep/[0.92]">
          {ordersTotal > 0 ? `${ordersTotal} ta buyurtma yakunlandi` : 'Hali buyurtma yakunlanmagan'}
        </p>

        <span className="mt-12 inline-flex h-[28px] items-center gap-8 rounded-full bg-on-primary/[0.16] px-12 text-badge text-on-primary-deep">
          {formatPercent(level.discountPercent)} chegirma
        </span>

        {/*
          Progress uchun `ProgressBar` ISHLATILMAYDI: u 92% dan oshmaydi
          (yetib kelish vaqti uchun ataylab) va yorugʻ yuza uchun
          hisoblangan ranglarda chiziladi — toʻq hero ustida koʻrinmasdi.
        */}
        {nextLevel ? (
          <>
            <div
              role="progressbar"
              aria-label="Daraja progressi"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(levelPercent)}
              className="mt-16 h-[6px] w-full overflow-hidden rounded-full bg-on-primary-deep/[0.16]"
            >
              <span
                aria-hidden
                style={{ width: `${levelPercent}%` }}
                className="block h-full rounded-full bg-on-primary-deep"
              />
            </div>
            <p className="mt-8 text-caption text-on-primary-deep/[0.92]">
              {nextLevel.label} darajaga yana {ordersToNextLevel} ta buyurtma
            </p>
          </>
        ) : (
          <span className="mt-12 ml-8 inline-flex h-[28px] items-center gap-8 rounded-full bg-on-primary/[0.16] px-12 text-badge text-on-primary-deep">
            Eng yuqori daraja
          </span>
        )}
      </div>

      <h2 className="mt-20 px-4 text-overline uppercase text-text-secondary">Daraja tizimi</h2>
      <p className="mt-8 px-4 text-body-sm text-text-secondary">
        Chegirma toʻlanadigan summadan ayiriladi. Uni platforma oʻz komissiyasidan qoplaydi — ustaning ish haqi kamaymaydi, sizdan esa komissiya olinmaydi.
      </p>

      <div
        className={cn(
          'mt-8 overflow-hidden rounded-lg border border-transparent bg-surface-elevated shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        {LEVELS.map((item, index) => {
          const isCurrent = item.key === level.key;

          return (
            <div
              key={item.key}
              className={cn(
                'flex min-h-touch items-center gap-12 px-12 py-8',
                index > 0 && 'border-t border-border',
                // Joriy daraja mavjud yuza zinapoyasi bilan ajratiladi.
                isCurrent && 'bg-surface-sunken',
              )}
            >
              <span
                className={cn(
                  'flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-sm',
                  LEVEL_TONES[item.key],
                )}
                aria-hidden
              >
                <Icon icon={LEVEL_ICONS[item.key]} size={20} weight="duotone" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-lg text-text-primary">{item.label}</span>
                <span className="mt-2 block text-caption text-text-secondary">
                  {LEVEL_RANGES[item.key]}
                </span>
              </span>

              {isCurrent && (
                <InfoChip tone="primary" className="shrink-0">
                  Sizda
                </InfoChip>
              )}
              <span className="tabular shrink-0 text-numeric-sm text-text-primary">
                {formatPercent(item.discountPercent)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-8 px-4 text-caption text-text-secondary">
        Chegirma har bir buyurtmaning toʻlov sahifasida avtomatik qoʻllanadi — hech narsa yoqish shart emas.
      </p>

      <h2 className="mt-20 px-4 text-overline uppercase text-text-secondary">Keshbek</h2>

      <Card className="mt-8">
        <p className="text-title text-text-primary">
          Har {CASHBACK_BLOCK} ta buyurtmada {formatPercent(CASHBACK_PERCENT)}
        </p>
        <p className="mt-4 text-body-sm text-text-secondary">
          Doimiy daraja chegirmasidan alohida hisoblanadi.
        </p>

        <div
          /*
             5x2 panjara: oʻnta katakcha bitta qatorga hech qaysi ekranda
             sigʻmaydi (10x28 + 9x8 = 352px, 360px ekranda kartaga 288px
             qoladi), erkin oʻralganda esa "9 + 1" kabi notekis qator chiqadi.
          */
          className="mt-16 grid grid-cols-5 justify-items-center gap-8"
          role="img"
          aria-label={`${cashback.filled} ta toʻldirildi, ${CASHBACK_BLOCK} tadan`}
        >
          {stamps.map((isFilled, index) => (
            <span
              key={index}
              className={cn(
                'flex h-[28px] w-[28px] items-center justify-center rounded-xs border',
                isFilled
                  ? 'border-primary bg-primary-surface text-primary-pressed'
                  : 'border-border bg-surface-sunken',
              )}
              aria-hidden
            >
              {isFilled && <Icon icon={Check} size={16} weight="bold" />}
            </span>
          ))}
        </div>

        <p
          className={cn(
            'mt-8 text-caption',
            cashback.remaining === 0 ? 'text-success' : 'text-text-secondary',
          )}
        >
          {stampHint}
        </p>

        <span className="-mx-16 my-16 block h-px bg-border" aria-hidden />

        {cashback.blockPaid > 0 && (
          <SummaryRow label="Shu blokda toʻlangan" value={formatPrice(cashback.blockPaid)} />
        )}
        {cashback.pending > 0 && (
          <SummaryRow label="Blok toʻlganda" value={formatPrice(cashback.pending)} tone="success" />
        )}
        <SummaryRow label="Yigʻilgan keshbek" value={formatPrice(cashback.earned)} />

        <p className="mt-12 text-caption text-text-secondary">
          Keshbek hisobi toʻlov tizimi ulangach ochiladi — hozircha faqat hisob koʻrsatiladi.
        </p>
        {/* `span`, `button` EMAS: bajaradigan amali yoʻq. */}
        <span className="mt-12 inline-flex h-[32px] items-center rounded-full border border-dashed border-border-strong px-12 text-caption text-text-secondary">
          Demo · keshbek hali toʻlovda qoʻllanmaydi
        </span>
      </Card>

      <Card className="mt-20">
        <div className="flex items-start gap-12">
          <span
            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-sm bg-neutral-surface text-text-secondary"
            aria-hidden
          >
            <Icon icon={Gift} size={20} weight="duotone" />
          </span>
          <div className="min-w-0">
            <p className="text-title text-text-primary">Doʻstni taklif qilish</p>
            <p className="mt-4 text-body-sm text-text-secondary">
              Doʻstingiz 30 kun ichida 3 ta buyurtmani yakunlasa, siz uning sarflagan
              summasidan 2% keshbek olasiz. Doʻstingiz esa birinchi buyurtmasida 10% chegirma
              oladi.
            </p>
            <p className="mt-8 text-caption text-text-secondary">
              Taklif kodi tez orada beriladi.
            </p>
          </div>
        </div>
      </Card>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
