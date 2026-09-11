import { ImageSquare, Info, MapPinLine } from '@phosphor-icons/react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Stepper } from '@/components/Stepper';
import { SummaryRow } from '@/components/SummaryRow';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { addressDetailsLine } from '@/lib/address';
import { cn } from '@/lib/cn';
import { formatDateTime, formatPrice, orEmpty } from '@/lib/formatters';
import { canRate, DETAIL_ACTION_LABELS, hasReceipt } from '@/lib/orderStateMachine';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { METHOD_LABELS } from '@/lib/wallet';
import { useApp } from '../store';

/**
 * Ish isboti — MIJOZ uchun KOʻRISH ekrani.
 *
 * Fotoni USTA oladi; mijoz ilovasiga kamera kerak emas va kamera plagini
 * oʻrnatilmagan. Usta ilovasi va backend yoʻq, demak foto HECH QACHON
 * kelmaydi — bu ochiq aytiladi, oʻrindosh rasm bilan toʻldirilmaydi.
 *
 * Ramka (nima soʻralgan, qachon yakunlangan, qancha) HAQIQIY maʼlumotdan
 * quriladi; foto va joylashuv tasdigʻi oʻrnida ularning YOʻQLIGI aytiladi.
 *
 * MUHIM INVARIANT: bu sahifa baholashni BLOKLAMAYDI. Hech qachon
 * kelmaydigan maʼlumotga qoʻyilgan darvoza buyurtmani yakunlanmagan holatda
 * muzlatib qoʻyardi.
 */
export function WorkProofScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { findOrder } = useApp();
  const now = useMinuteClock();

  const order = orderId ? findOrder(orderId) : undefined;
  if (!order) return <Navigate to="/app/home" replace />;

  /*
   * Bloklovchi ekran qorovuli ATAYLAB yoʻq: bu sahifaga faqat ish
   * yakunlangach kelinadi. Yaroqsiz holatda quyidagi qorovul buyurtma
   * ekraniga yuboradi va u yerda kerakli yoʻnaltirish oʻzi ishlaydi.
   */
  if (!hasReceipt(order.status)) {
    return <Navigate to={`/app/order/${order.id}`} replace />;
  }

  const details = addressDetailsLine(order.address);
  const isAwaitingRating = canRate(order.status);

  return (
    <ScreenShell
      header={<Header variant="inner" title="Ish isboti" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            <Button
              variant="primary"
              onClick={() =>
                navigate(
                  isAwaitingRating
                    ? `/app/order/${order.id}/rate`
                    : `/app/order/${order.id}/receipt`,
                  { replace: true },
                )
              }
            >
              {isAwaitingRating ? DETAIL_ACTION_LABELS.rate : DETAIL_ACTION_LABELS.receipt}
            </Button>
            <Button variant="ghost" onClick={() => navigate('/app/support')}>
              Muammo bormi?
            </Button>
            <p className="text-center text-caption text-text-secondary">
              Nizo ochish va pulni qaytarish hali tayyor emas — hozircha
              qoʻllab-quvvatlash xizmati yordam beradi.
            </p>
          </div>
        </StickyFooter>
      }
    >
      <Stepper status={order.status} className="-mx-20" />

      <h1 className="mt-20 text-h1 text-text-primary">Bajarilgan ish</h1>
      <p className="mt-8 text-body text-text-secondary">
        {isAwaitingRating
          ? 'Usta ishni yakunlandi deb belgiladi. Quyida — nima soʻralgani va qachon yakunlangani.'
          : 'Siz ishni tasdiqladingiz. Quyida — buyurtma boʻyicha saqlangan yozuv.'}
      </p>

      <Banner variant="info" icon={Info} className="mt-16">
        Isbot fotosi va joylashuv tasdigʻi usta ilovasidan keladi. Usta ilovasi hali
        ulanmagan, shuning uchun bu sahifada faqat siz kiritgan va ilova qayd etgan
        maʼlumot koʻrsatiladi.
      </Banner>

      {/* Mijoz oʻzi yozgan matn — isbotni solishtiradigan yagona rost oʻlchov. */}
      {order.description.trim() && (
        <Card className="mt-16 flex flex-col gap-8">
          <p className="text-overline uppercase text-text-secondary">Nima soʻralgan edi</p>
          <p className="text-body text-text-primary">{order.description}</p>
        </Card>
      )}

      <Card className="mt-16 flex flex-col gap-12">
        <p className="text-h3 text-text-primary">Ish fotosi</p>
        {/*
          Ataylab FOTO EMAS oʻrindosh. BITTA blok, uchta katakcha emas: uch
          ramka "uchta foto boʻladi" degan tuzilma daʼvosini berardi, nechta
          kadr kelishini esa biz bilmaymiz. `div`, `button` EMAS —
          ochadigan rasm yoʻq.
        */}
        <div className="flex h-[160px] flex-col items-center justify-center gap-8 rounded-sm border border-dashed border-border-strong bg-surface-sunken px-20">
          <Icon icon={ImageSquare} size={40} weight="duotone" className="text-text-secondary" />
          <p className="text-body-sm text-text-secondary">Foto hali yuklanmagan</p>
          <p className="text-center text-caption text-text-secondary">
            Ish suratlarini usta oʻz ilovasidan yuklaydi
          </p>
        </div>
      </Card>

      <Card className="mt-16 flex flex-col gap-8">
        <p className="text-overline uppercase text-text-secondary">Manzil</p>
        <p className="text-body-lg text-text-primary">{order.address.label}</p>
        {details && <p className="text-body-sm text-text-secondary">{details}</p>}
        <p className="text-caption text-text-secondary">Manzilni siz kiritgansiz</p>
      </Card>

      {/* "Tasdiqlandi" belgichasi CHIZILMAYDI: tekshirilmagan xavfsizlik
          daʼvosi oddiy soxta maʼlumotdan ogʻirroq. */}
      <Banner variant="info" icon={MapPinLine} className="mt-12">
        Ustaning joylashuvi tekshirilmaydi. GPS tasdigʻi — ustaning manzilingizda
        ekanini isbotlaydigan belgi — usta ilovasi ulangach qoʻshiladi.
      </Banner>

      <div
        className={cn(
          'mt-16 rounded-lg border border-transparent bg-surface-elevated p-16 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <SummaryRow label="Buyurtma raqami" value={order.shortId} mono />
        <SummaryRow label="Xizmat" value={order.categoryName} />
        <SummaryRow label="Usta" value={orEmpty(order.master?.fullName)} />
        <SummaryRow
          label="Yakunlangan sana"
          value={order.completedAt ? formatDateTime(order.completedAt, now) : orEmpty(null)}
        />
        <SummaryRow label="Toʻlov usuli" value={METHOD_LABELS[order.paymentMethod]} />

        <div className="border-t border-dashed border-border pt-16" />
        <div className="flex items-baseline justify-between gap-16">
          <span className="text-body-lg text-text-secondary">Jami</span>
          <span className="tabular text-display text-text-primary">
            {formatPrice(order.invoice.total)}
          </span>
        </div>
      </div>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
