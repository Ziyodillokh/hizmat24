import { CheckCircle, Info, NotePencil, WarningCircle } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import type { DisputeRecord } from '@/lib/dispute';
import { formatDateTime } from '@/lib/formatters';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { CHANNEL_OPENED_LABELS } from './disputeLabels';
import { useDisputes } from '../dispute-store';

/**
 * Murojaat qatori.
 *
 * `NotificationRow` ishlatilmaydi: uning `type` propi 25-ekrandagi yopiq
 * bildirishnoma turlariga bogʻlangan va u jadvalga murojaat turini qoʻshish
 * spetsifikatsiyani buzardi. Markup oʻsha komponentdan koʻchirildi.
 */
function DisputeRow({
  record,
  now,
  onSelect,
}: {
  record: DisputeRecord;
  now: Date;
  onSelect: () => void;
}) {
  const lastChannel = record.openedChannels[record.openedChannels.length - 1];

  /*
   * Uchinchi holat — kanal ochilgan, lekin hal boʻlmagan — chipSIZ qoladi:
   * oxirgi qatordagi kanal jurnali maʼnoni toʻliq tashiydi va yonma-yon
   * turgan ikkita belgi bir-birini takrorlardi.
   */
  const chip = record.resolvedAt ? (
    <InfoChip tone="neutral">Hal boʻldi</InfoChip>
  ) : record.openedChannels.length === 0 ? (
    <InfoChip tone="warning">Yuborilmagan</InfoChip>
  ) : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex w-full items-start gap-12 rounded-lg p-12 text-left',
        'border border-transparent bg-surface-elevated shadow-e1',
        "[[data-theme='dark']_&]:border-border",
        'transition-transform duration-press ease-std active:scale-[0.99]',
      )}
    >
      <span
        className={cn(
          'flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md',
          record.resolvedAt ? 'bg-success-surface text-success' : 'bg-warning-surface text-warning',
        )}
        aria-hidden
      >
        <Icon icon={record.resolvedAt ? CheckCircle : WarningCircle} size={20} weight="duotone" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-8">
          <span className="min-w-0 flex-1 text-title text-text-primary">{record.reason}</span>
          {chip}
        </span>
        <span className="mt-2 block text-body-sm text-text-secondary">
          {record.orderShortId} · {record.categoryName}
        </span>
        <span className="mt-4 block line-clamp-2 text-body-sm text-text-secondary">
          {record.note}
        </span>
        <span className="mt-8 block text-caption text-text-secondary">
          {formatDateTime(record.createdAt, now)}
        </span>
        {lastChannel && (
          <span className="mt-2 block text-caption text-text-secondary">
            {CHANNEL_OPENED_LABELS[lastChannel.channel]} ·{' '}
            {formatDateTime(lastChannel.openedAt, now)}
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * Murojaatlarim.
 *
 * Bu tayyorlangan matnlar JURNALI, ariza tizimi emas. Shuning uchun bu yerda
 * "Murojaat yozish" tugmasi yoʻq: murojaat buyurtmasiz maʼnosiz — matnning
 * butun qiymati buyurtma raqami, sana va summada.
 */
export function DisputeListScreen() {
  const navigate = useNavigate();
  const now = useMinuteClock();
  const { disputes } = useDisputes();

  return (
    <ScreenShell
      header={<Header variant="inner" title="Murojaatlarim" onBack={() => navigate(-1)} />}
    >
      {disputes.length === 0 ? (
        <>
          <EmptyState
            inline
            className="mt-24"
            icon={NotePencil}
            title="Murojaat yoʻq"
            description="Muammo boʻlsa, buyurtma sahifasidan xabar tayyorlaysiz"
            action={{
              label: 'Qoʻllab-quvvatlashga bogʻlanish',
              variant: 'secondary',
              onClick: () => navigate('/app/support'),
            }}
          />
          {/* Uzun tushuntirish `description` da emas: u ikki satrdan keyin kesiladi. */}
          <Banner variant="info" icon={Info} className="mt-20">
            Murojaat buyurtmaga bogʻlanadi: matnga buyurtma raqami, sana va summa qoʻshiladi.
            Buyurtmani oching va «Muammo haqida xabar» tugmasini bosing.
          </Banner>
        </>
      ) : (
        <>
          <p className="mt-4 text-body text-text-secondary">
            Bu — siz tayyorlagan matnlar jurnali. U faqat shu qurilmada saqlanadi va platformada
            koʻrib chiqilmaydi.
          </p>

          <ul className="mt-20 flex flex-col gap-8">
            {disputes.map((item) => (
              <li key={item.id}>
                <DisputeRow
                  record={item}
                  now={now}
                  onSelect={() => navigate(`/app/disputes/${item.id}`)}
                />
              </li>
            ))}
          </ul>

          <Button variant="ghost" className="mt-20" onClick={() => navigate('/app/support')}>
            Qoʻllab-quvvatlash xizmati
          </Button>
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
