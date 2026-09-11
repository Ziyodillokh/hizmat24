import { Info } from '@phosphor-icons/react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { MasterCard } from '@/components/MasterCard';
import { ProgressBar } from '@/components/ProgressBar';
import { Stepper } from '@/components/Stepper';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { addressDetailsLine } from '@/lib/address';
import { formatApproxDuration } from '@/lib/formatters';
import { canOpenEnRoute, isBlockingConfirmation } from '@/lib/orderStateMachine';
import { useApp } from '../store';
import { MasterContactRow } from './MasterContactRow';

/**
 * "Usta yoʻlda".
 *
 * Marshrut `/map` deb nomlangan, lekin bu ekranda XARITA YOʻQ va boʻlmaydi:
 * manzilda ham, ustada ham koordinata yoʻq, xarita kutubxonasi va plitka
 * serveri yoʻq, ilova esa internetsiz ishlaydi.
 *
 * `MapPreview` ham ATAYLAB ishlatilmaydi: kuzatuv ekranidagi xarita
 * maydonida bitta pin USTA deb oʻqiladi va mavjud boʻlmagan jonli kuzatuvni
 * vaʼda qiladi. Soxta koʻcha toʻri ustidagi harakatlanuvchi nuqta —
 * foydalanuvchi eng xavotirli boʻlgan daqiqada aytilgan yolgʻon.
 *
 * Ekranning vazifasi — toʻrt savolga javob: qachon keladi, kim keladi,
 * qanday bogʻlanaman, kechiksa nima qilaman.
 */
export function MasterEnRouteScreen() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const { findOrder } = useApp();

  const order = orderId ? findOrder(orderId) : undefined;
  if (!order) return <Navigate to="/app/home" replace />;

  /*
   * Usta yetib kelgan boʻlsa bloklovchi ekran majburan ochiladi: bu oʻtish
   * sahifa OCHIQ turganda sodir boʻladi va usiz foydalanuvchi usta eshik
   * oldida turganda shu yerda qolib ketardi.
   */
  if (isBlockingConfirmation(order.status)) {
    return <Navigate to={`/app/order/${order.id}/confirm-master`} replace />;
  }

  if (!canOpenEnRoute(order.status) || !order.master) {
    return <Navigate to={`/app/order/${order.id}`} replace />;
  }

  const master = order.master;
  const details = addressDetailsLine(order.address);

  return (
    <ScreenShell
      header={
        <Header
          variant="inner"
          title="Usta yoʻlda"
          onBack={() => navigate(`/app/order/${order.id}`)}
        />
      }
      footer={
        <StickyFooter>
          <MasterContactRow order={order} />
        </StickyFooter>
      }
    >
      <Stepper status={order.status} className="-mx-20" />

      <div className="mt-20">
        {order.etaMinutes === null ? (
          // `formatDuration(0)` "0 daqiqa" berardi — bu qiymat chizilmaydi.
          <p className="text-h1 text-text-primary">Hisoblanmoqda</p>
        ) : (
          <>
            <p className="text-h1 text-text-primary">{formatApproxDuration(order.etaMinutes)}</p>
            <p className="mt-4 text-body text-text-secondary">
              Usta shu vaqt ichida yetib keladi
            </p>
            {/* Aniq foiz nomaʼlum — manbasi yoʻq. */}
            <ProgressBar indeterminate className="mt-16" />
            <p className="mt-8 text-caption text-text-secondary">
              Yetib kelish vaqti — demo maʼlumot. Haqiqiy hisob usta ilovasi ulangach
              koʻrsatiladi.
            </p>
          </>
        )}
      </div>

      <MasterCard
        name={master.fullName}
        profession={master.profession}
        rating={master.ratingAvg}
        completedOrders={master.completedOrdersCount}
        photoUrl={master.photoUrl}
        experience={master.experienceLevel === 'EXPERIENCED' ? 'experienced' : 'new'}
        isCertified={master.hasGovCertificate}
        onOpen={() => navigate(`/app/master/${master.id}`)}
        className="mt-20"
      />

      {/*
        Ekranning yagona YANGI maʼlumoti: podez, qavat va xonadon buyurtma
        oqimida kiritiladi, keyin esa butunlay yoʻqoladi. Usta eshikka
        kelayotganda aynan shular kerak.
      */}
      <Card className="mt-16 flex flex-col gap-8">
        <p className="text-overline uppercase text-text-secondary">Usta keladigan manzil</p>
        <p className="text-body-lg text-text-primary">{order.address.label}</p>
        {details && <p className="text-body-sm text-text-secondary">{details}</p>}
        {order.address.comment && (
          <p className="text-body-sm text-text-secondary">{order.address.comment}</p>
        )}
        {!details && (
          <p className="text-caption text-text-secondary">
            Podez, qavat va xonadon kiritilmagan — usta qoʻngʻiroq qilishi mumkin.
          </p>
        )}
      </Card>

      <Card className="mt-16 flex flex-col gap-8">
        <p className="text-h3 text-text-primary">Usta kechiksa</p>
        <p className="text-body-sm text-text-secondary">
          Avval ustaga yozing yoki qoʻngʻiroq qiling — koʻpincha sabab yoʻldagi
          tirbandlik boʻladi. Manzilda xato boʻlsa ham xabarni shu yerdan yuboring.
          Javob boʻlmasa buyurtmani bekor qilishingiz mumkin: hozircha hech qanday pul
          yechilmagan.
        </p>
      </Card>

      <button
        type="button"
        onClick={() => navigate(`/app/order/${order.id}`, { state: { openCancel: true } })}
        className="mt-12 px-4 text-caption text-danger"
      >
        Buyurtmani bekor qilish
      </button>

      <Banner variant="info" icon={Info} className="mt-16">
        Ustaning xaritadagi joylashuvi koʻrsatilmaydi — jonli kuzatuv usta ilovasi
        ulangach ishga tushadi.
      </Banner>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
