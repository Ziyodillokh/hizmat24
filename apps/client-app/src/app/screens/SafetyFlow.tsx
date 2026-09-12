import { Check, ShieldWarning, Warning } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { StarRating } from '@/components/StarRating';
import { Textarea } from '@/components/Textarea';
import { StatusBar } from '@/preview/StatusBar';
import { BottomInset } from '@/screens/_shared/ScreenShell';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { useApp } from '../store';
import { useToast } from '../ToastHost';
import { tapFeedback, warnFeedback } from '../native';

function VerificationChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-[28px] items-center gap-4 rounded-full bg-success/[0.12] px-12 text-caption text-success">
      <Icon icon={Check} size={14} />
      {children}
    </span>
  );
}

/**
 * 16 · Ustani tasdiqlang + 17 · Xavfsizlik tasdigʻi.
 *
 * Bloklovchi ekran: bekor qilish tugmasi ham, orqaga qaytish ham yoʻq.
 * Ikkala tugma bir xil oʻlchamda va ogʻirlikda — dark pattern taqiqlanadi.
 */
export function ConfirmMasterFlow() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { findOrder, confirmMaster, rejectMaster } = useApp();
  const showToast = useToast();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');

  const order = orderId ? findOrder(orderId) : undefined;
  if (!order) return <Navigate to="/app/home" replace />;
  if (order.status !== ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION) {
    return <Navigate to={`/app/order/${order.id}`} replace />;
  }

  const master = order.master;
  if (!master) return <Navigate to={`/app/order/${order.id}`} replace />;

  return (
    <div className="flex h-full min-h-full flex-col bg-surface">
      <StatusBar />

      <main className="flex flex-1 flex-col items-center px-20 pt-24">
        <Avatar name={master.fullName} size={120} className="ring-[3px] ring-primary" />
        <h1 className="mt-16 text-center text-h1 text-text-primary">{master.fullName}</h1>
        <p className="mt-4 text-body text-text-secondary">{master.profession}</p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          {master.experienceLevel === 'EXPERIENCED' && (
            <VerificationChip>Tajribali</VerificationChip>
          )}
          {master.hasGovCertificate && <VerificationChip>Sertifikatli</VerificationChip>}
        </div>

        <div className="mt-12 flex items-center gap-12">
          <StarRating value={master.ratingAvg} size="md" showValue />
          <span className="text-body-sm text-text-secondary">
            {master.completedOrdersCount} ta buyurtma bajargan
          </span>
        </div>

        <Banner variant="warning" icon={ShieldWarning} className="mt-24 w-full">
          Kelgan odam suratdagi ustaga oʻxshamasa — «Yoʻq, bu boshqa odam» tugmasini
          bosing.
        </Banner>
      </main>

      <div className="shrink-0 px-20 pb-12 pt-24">
        <div className="flex flex-col gap-12">
          <Button
            variant="primary"
            className="h-[56px]"
            onClick={() => {
              confirmMaster(order.id);
              void tapFeedback();
              showToast('Ish boshlandi', 'success');
              navigate(`/app/order/${order.id}`, { replace: true });
            }}
          >
            Ha, shu usta
          </Button>
          <Button
            variant="destructive-outline"
            className="h-[56px]"
            onClick={() => setRejectOpen(true)}
          >
            Yoʻq, bu boshqa odam
          </Button>
        </div>
      </div>

      <BottomInset />

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)}>
        <div className="flex flex-col items-center">
          <Icon icon={Warning} size={48} className="text-danger" />
          <h3 className="mt-16 text-center text-h3 text-text-primary">
            Bu amalni bekor qilib boʻlmaydi
          </h3>
          <p className="mt-8 text-center text-body text-text-secondary">
            Buyurtma darhol toʻxtatiladi va ish boshlanmaydi. Keyin qoʻllab-quvvatlash
            xizmatiga oʻzingiz bogʻlanasiz — telefon va Telegram keyingi ekranda
            koʻrsatiladi.
          </p>
        </div>

        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={1000}
          placeholder="Izoh (ixtiyoriy)"
          className="mt-20"
        />

        <div className="mt-20 flex flex-col gap-12">
          <Button
            variant="destructive"
            onClick={() => {
              rejectMaster(order.id, note.trim());
              void warnFeedback();
              navigate(`/app/order/${order.id}/safety`, { replace: true });
            }}
          >
            Tasdiqlash
          </Button>
          <Button variant="ghost" onClick={() => setRejectOpen(false)}>
            Orqaga
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/** 21 · Xavfsizlik signali — terminal, dead-end. */
export function SafetyAlertResult() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { findOrder } = useApp();

  const order = orderId ? findOrder(orderId) : undefined;
  if (!order) return <Navigate to="/app/home" replace />;

  return (
    <div className="flex h-full min-h-full flex-col bg-surface">
      <StatusBar />

      <main className="flex flex-1 flex-col items-center justify-center px-20">
        <Icon icon={ShieldWarning} size={72} className="text-danger" />
        {/* "Signal raqami" mavjud boʻlmagan hujjatni nazarda tutardi —
            blok aslida buyurtma raqamini koʻrsatadi. */}
        <h1 className="mt-24 text-center text-h1 text-text-primary">Buyurtma toʻxtatildi</h1>
        <p className="mt-8 text-center text-body text-text-secondary">
          Usta tasdiqlanmadi, ish boshlanmaydi va hech qanday pul yechilmaydi. Endi
          qoʻllab-quvvatlash xizmatiga oʻzingiz bogʻlaning — buyurtma raqami quyida.
        </p>

        <div className="mt-24 w-full rounded-sm bg-surface-sunken p-16 text-center">
          <p className="text-caption text-text-secondary">Buyurtma raqami</p>
          <p className="mt-4 text-body-lg text-text-primary tabular tracking-[0.4px]">
            {order.shortId}
          </p>
        </div>
      </main>

      <div className="shrink-0 px-20 pb-12 pt-24">
        <div className="flex flex-col gap-12">
          <Button variant="primary" onClick={() => navigate(`/app/support?order=${order.id}`)}>
            Qoʻllab-quvvatlash xizmati
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/app/order/${order.id}/dispute`)}
          >
            Muammo haqida xabar
          </Button>
          <Button variant="ghost" onClick={() => navigate('/app/home')}>
            Bosh sahifaga
          </Button>
        </div>
      </div>

      <BottomInset />
    </div>
  );
}
