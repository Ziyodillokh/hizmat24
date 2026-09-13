import { Info } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { InfoChip } from '@/components/InfoChip';
import { Modal } from '@/components/Modal';
import {
  ChannelLog,
  CopyMessageButton,
  PreparedMessageText,
  SupportPhoneBlock,
  TelegramFooter,
} from '@/components/PreparedMessage';
import { SummaryRow } from '@/components/SummaryRow';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { DISPUTE_GOAL_LABELS } from '@/lib/dispute';
import { formatDateTime } from '@/lib/formatters';
import { useMinuteClock } from '@/lib/useMinuteClock';
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

  const handleCopied = (ok: boolean) => {
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
        <TelegramFooter copied={copied} onOpen={(channel) => markChannelOpened(record.id, channel)} />
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
      <PreparedMessageText message={record.message} className="mt-8" />
      <CopyMessageButton message={record.message} onCopied={handleCopied} className="mt-12" />

      <SupportPhoneBlock
        sayOnCall={{ label: 'Qoʻngʻiroqda ayting', value: record.orderShortId }}
        now={now}
        onOpen={() => markChannelOpened(record.id, 'phone')}
        className="mt-24"
      />

      <ChannelLog events={record.openedChannels} now={now} className="mt-24" />

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
