import { Camera } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DashedChip } from '@/components/DashedChip';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { ServicePhoto } from '@/components/order/ServicePhoto';
import { StepSection } from '@/components/order/StepSection';
import { Textarea } from '@/components/Textarea';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { splitFormattedPrice } from '@/lib/formatters';
import { FINISH_TOAST, WORK_NOTE_MAX } from '@/lib/masterJobs';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { METHOD_SHORT_LABELS } from '@/lib/wallet';
import { useApp } from '../../store';
import { useToast } from '../../ToastHost';

/**
 * Ishni yakunlash — ustaning oxirgi qadami.
 *
 * Narx maydoni YOʻQ: summa buyurtma berilganda kelishilgan va chekda shu
 * turadi. Foto ham yoʻq — kamera moduli ulanmagan va buni yashirish
 * oʻrniga qator ochiq aytadi (`span`, tugma emas).
 *
 * «Pulni oldim» kabi belgi ham chizilmaydi: uni hech kim tekshira olmaydi
 * va saqlanmaydigan boshqaruv — yolgʻonning eng arzon shakli.
 */
export function MasterFinishScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const showToast = useToast();
  const { findOrder, masterFinish } = useApp();

  const [note, setNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const order = orderId ? findOrder(orderId) : undefined;

  if (!order) return <Navigate to="/app/master/jobs" replace />;
  if (order.status !== ORDER_STATUS.IN_PROGRESS || !order.handledByMaster) {
    return <Navigate to={`/app/master/jobs/${order.id}`} replace />;
  }

  const { value, currency } = splitFormattedPrice(order.invoice.total);

  const finish = () => {
    setConfirmOpen(false);
    masterFinish(order.id, note);
    showToast(FINISH_TOAST);
    navigate('/app/master/jobs', { replace: true });
  };

  return (
    <ScreenShell
      header={
        <Header
          variant="inner"
          title="Ishni yakunlash"
          onBack={() => navigate(`/app/master/jobs/${order.id}`)}
        />
      }
      footer={
        <StickyFooter>
          <Button variant="primary" onClick={() => setConfirmOpen(true)}>
            Ishni yakunladim
          </Button>
        </StickyFooter>
      }
    >
      <Card className="mt-4 flex items-center gap-12">
        <ServicePhoto
          serviceId={order.categoryId}
          iconKey={order.categoryIconKey}
          className="h-[56px] w-[84px]"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-title text-text-primary">{order.categoryName}</p>
          <p className="tabular mt-2 text-caption text-text-secondary">{order.shortId}</p>
        </div>
      </Card>

      <StepSection
        title="Nima qildingiz?"
        hint="Mijoz buni «Ish isboti» sahifasida koʻradi. Ixtiyoriy."
      >
        <Textarea
          placeholder="Masalan: smesitel almashtirildi, prokladka yangilandi"
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, WORK_NOTE_MAX))}
          maxLength={WORK_NOTE_MAX}
          rows={4}
        />
      </StepSection>

      {/* Ishlamaydigan imkoniyat — `div`, tugma emas. */}
      <div className="mt-16 flex items-center gap-12 rounded-lg border border-transparent bg-surface-elevated p-12 shadow-e1 [[data-theme='dark']_&]:border-border">
        <span
          className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-sm bg-neutral-surface text-text-disabled"
          aria-hidden
        >
          <Icon icon={Camera} size={20} weight="duotone" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-body-lg text-text-secondary">Ish suratlari</p>
          <p className="text-body-sm text-text-secondary">
            Surat yuklash uchun kamera moduli hali ulanmagan.
          </p>
        </div>
        <DashedChip size="compact">Tez orada</DashedChip>
      </div>

      <Card className="mt-16">
        <p className="text-body-lg text-text-primary">
          Mijoz toʻlaydi:{' '}
          <span className="tabular">
            {value} {currency}
          </span>{' '}
          · {METHOD_SHORT_LABELS[order.paymentMethod]}
        </p>
        <p className="mt-4 text-body-sm text-text-secondary">
          Narxni oʻzgartirish yoʻq: summa buyurtma berilganda kelishilgan va chekda shu turadi.
        </p>
      </Card>

      <Banner variant="info" className="mt-16">
        Yakunlagach mijoz ishni baholaydi. Baho kelgach buyurtma yopiladi va Daromad boʻlimiga
        tushadi. Naqd pulni oʻzingiz olasiz — ilova pul oʻtkazmaydi.
      </Banner>

      <div className="h-bottom-reserve" aria-hidden />

      <Modal
        open={confirmOpen}
        title="Ishni yakunladingizmi?"
        onClose={() => setConfirmOpen(false)}
      >
        <div className="mt-20 flex flex-col gap-12">
          <p className="text-center text-body-sm text-text-secondary">
            Mijozda baholash ekrani ochiladi. Bu amalni qaytarib boʻlmaydi.
          </p>
          <Button variant="primary" onClick={finish}>
            Ha, yakunladim
          </Button>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            Yoʻq
          </Button>
        </div>
      </Modal>
    </ScreenShell>
  );
}
