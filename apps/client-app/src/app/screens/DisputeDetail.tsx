import {
  CaretRight,
  Clock,
  Copy,
  Info,
  PaperPlaneTilt,
  Phone,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { Modal } from '@/components/Modal';
import { SummaryRow } from '@/components/SummaryRow';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { copyText } from '@/lib/clipboard';
import { DISPUTE_GOAL_LABELS } from '@/lib/dispute';
import { formatDateTime } from '@/lib/formatters';
import {
  SUPPORT_PHONE,
  SUPPORT_PHONE_LABEL,
  SUPPORT_TELEGRAM_URL,
  supportStatusLine,
} from '@/lib/support';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { CHANNEL_OPENED_LABELS } from './disputeLabels';
import { useDisputes } from '../dispute-store';
import { tapFeedback } from '../native';
import { useApp } from '../store';
import { useToast } from '../ToastHost';

/**
 * Murojaat matni.
 *
 * Sahifa bitta ishni bajaradi va uni oxirigacha bajaradi: matnni koʻrsatadi,
 * nusxalaydi va haqiqiy kanalga olib boradi. "Koʻrib chiqilmoqda" degan holat
 * yoʻq — chunki koʻrib chiqadigan tizim yoʻq.
 */
export function DisputeDetailScreen() {
  const navigate = useNavigate();
  const { disputeId } = useParams<{ disputeId: string }>();
  const { findDispute, markChannelOpened, setResolved, removeDispute } = useDisputes();
  const { findOrder } = useApp();
  const showToast = useToast();
  const now = useMinuteClock();

  const [copied, setCopied] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const record = disputeId ? findDispute(disputeId) : undefined;
  if (!record) return <Navigate to="/app/disputes" replace />;

  const order = findOrder(record.orderId);

  const copy = async () => {
    const ok = await copyText(record.message);
    setCopied(ok);
    if (ok) {
      void tapFeedback();
      showToast('Matn nusxalandi', 'success');
    } else {
      showToast('Nusxalab boʻlmadi — matnni qoʻlda belgilab oling', 'danger');
    }
  };

  return (
    <ScreenShell
      header={
        // `navigate(-1)` EMAS: formadan `replace` bilan kelinganda orqaga
        // buyurtma ekrani chiqardi va foydalanuvchi jurnalini koʻrmasdi.
        <Header variant="inner" title="Murojaat matni" onBack={() => navigate('/app/disputes')} />
      }
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            {/* Tugma emas, HAVOLA: `tel:`/`https:` sxemasini brauzerning
                oʻzi ochadi, `onClick` esa faqat lokal jurnalga yozadi. */}
            <a
              href={SUPPORT_TELEGRAM_URL}
              onClick={() => markChannelOpened(record.id, 'telegram')}
              className="flex h-[52px] w-full items-center justify-center gap-8 rounded-md bg-primary px-16 text-button text-on-primary shadow-primary-lift"
            >
              <Icon icon={PaperPlaneTilt} size={20} weight="fill" />
              Telegramni ochish
            </a>
            <p className="text-center text-caption text-text-secondary">
              {copied
                ? 'Telegram ochilgach matn maydonini bosib turing va «Qoʻyish» ni tanlang.'
                : 'Avval matnni nusxalang — Telegramda uni qoʻyasiz.'}
            </p>
          </div>
        </StickyFooter>
      }
    >
      {record.resolvedAt !== null && (
        <InfoChip tone="neutral" className="mt-4">
          Hal boʻldi
        </InfoChip>
      )}

      <Banner variant="info" icon={Info} className="mt-16">
        Bu matn hech qayerga yuborilmagan. Uni nusxalab, quyidagi kanallardan biriga oʻzingiz
        yuborasiz.
      </Banner>

      <div
        className={cn(
          'mt-16 rounded-lg border border-transparent bg-surface-elevated p-16 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <SummaryRow label="Buyurtma raqami" value={record.orderShortId} mono />
        <SummaryRow label="Xizmat" value={record.categoryName} />
        <SummaryRow label="Muammo" value={record.reason} />
        <SummaryRow label="Soʻrov" value={DISPUTE_GOAL_LABELS[record.goal]} />
        <SummaryRow label="Tayyorlangan" value={formatDateTime(record.createdAt, now)} />
      </div>

      {/* Buyurtma oʻchirilgan boʻlishi mumkin — havola faqat u topilsa. */}
      {order && (
        <button
          type="button"
          onClick={() => navigate(`/app/order/${record.orderId}`)}
          className="mt-12 px-4 text-caption text-primary-pressed"
        >
          Buyurtmani koʻrish
        </button>
      )}

      <h2 className="mt-24 px-4 text-overline uppercase text-text-secondary">Murojaat matni</h2>
      {/* Matn DOIM ekranda. Nusxalash ishlamasa ham barmoq bilan belgilanadi. */}
      <div
        className={cn(
          'mt-8 rounded-lg border border-transparent bg-surface-elevated p-16 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <p className="select-text whitespace-pre-wrap break-words text-body-sm text-text-primary">
          {record.message}
        </p>
      </div>

      <Button variant="secondary" leadingIcon={Copy} className="mt-12" onClick={() => void copy()}>
        Matnni nusxalash
      </Button>
      <p className="mt-8 text-center text-caption text-text-secondary">
        Nusxalash ishlamasa, yuqoridagi matnni barmoq bilan belgilab oling.
      </p>

      <h2 className="mt-24 px-4 text-overline uppercase text-text-secondary">
        Yoki qoʻngʻiroq qiling
      </h2>
      <a
        href={`tel:${SUPPORT_PHONE}`}
        onClick={() => markChannelOpened(record.id, 'phone')}
        className="mt-8 flex min-h-touch w-full items-center gap-12 border-b border-border px-4 py-16 text-left"
      >
        <span className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full bg-surface-sunken">
          <Icon icon={Phone} size={20} className="text-primary" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body-lg text-text-primary">Qoʻngʻiroq qilish</span>
          <span className="block text-body-sm text-text-secondary">{SUPPORT_PHONE_LABEL}</span>
        </span>
        <Icon icon={CaretRight} size={16} className="shrink-0 text-text-secondary" />
      </a>

      {/* Qoʻngʻiroqda operator birinchi soʻraydigan narsa — buyurtma raqami. */}
      <div className="mt-12 rounded-sm bg-surface-sunken p-16">
        <p className="text-caption text-text-secondary">Qoʻngʻiroqda ayting</p>
        <p className="tabular mt-4 text-body-lg tracking-[0.4px] text-text-primary">
          {record.orderShortId}
        </p>
      </div>

      <div className="mt-12 flex items-center gap-8">
        <Icon icon={Clock} size={16} className="text-text-secondary" />
        <p className="text-caption text-text-secondary">{supportStatusLine(now)}</p>
      </div>

      {record.openedChannels.length > 0 && (
        <>
          <h2 className="mt-24 px-4 text-overline uppercase text-text-secondary">Nima qilingan</h2>
          {/*
            "Yuborildi" HECH QACHON yozilmaydi: ilova havola ochilganini
            biladi, matn qoʻyilganini BILMAYDI.
          */}
          <ul className="mt-8 flex flex-col gap-4">
            {record.openedChannels.map((event, index) => (
              <li key={index} className="px-4 text-body-sm text-text-secondary">
                {CHANNEL_OPENED_LABELS[event.channel]} · {formatDateTime(event.openedAt, now)}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Foydalanuvchi boshqaradigan yagona halol "holat". */}
      {record.resolvedAt === null ? (
        <Button
          variant="secondary"
          className="mt-24"
          onClick={() => {
            setResolved(record.id, true);
            showToast('Hal boʻldi deb belgilandi');
          }}
        >
          Hal boʻldi deb belgilash
        </Button>
      ) : (
        <Button variant="ghost" className="mt-24" onClick={() => setResolved(record.id, false)}>
          Qayta ochish
        </Button>
      )}

      <Button variant="ghost" className="mt-12" onClick={() => setDeleteOpen(true)}>
        Murojaatni oʻchirish
      </Button>

      <p className="mt-16 px-4 text-caption text-text-secondary">
        Murojaat faqat shu qurilmada saqlanadi. Ilovadan chiqsangiz oʻchiriladi.
      </p>

      {/* Ikkala tugma bir xil oʻlchamda — "yoʻq" ni kichraytirish taqiqlanadi. */}
      <Modal open={deleteOpen} title="Murojaatni oʻchirasizmi?" onClose={() => setDeleteOpen(false)}>
        <div className="mt-20 flex flex-col gap-12">
          <p className="text-center text-body-sm text-text-secondary">
            Matn qurilmadan butunlay oʻchadi va uni tiklab boʻlmaydi.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              removeDispute(record.id);
              navigate('/app/disputes', { replace: true });
            }}
          >
            Ha, oʻchirish
          </Button>
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Yoʻq
          </Button>
        </div>
      </Modal>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
