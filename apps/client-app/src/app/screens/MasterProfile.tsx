import { ChatCircleDots, Heart, Phone, ShieldCheck } from '@phosphor-icons/react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { StarRating } from '@/components/StarRating';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { isMasterPhoneVisible } from '@/lib/orderStateMachine';
import { MASTERS } from '@/mocks/masters';
import { useChat } from '../chat-store';
import { useFavorites } from '../favorites-store';
import { useApp } from '../store';
import { useToast } from '../ToastHost';
import { tapFeedback } from '../native';

/**
 * 27 · Usta profili.
 *
 * `Tabs.tsx` dan AJRATILDI: u 500 satrdan oshdi va usta profili boshqa
 * uchta tabga hech qanday aloqasi yoʻq alohida ekran.
 */
export function MasterProfile() {
  const navigate = useNavigate();
  const { masterId } = useParams<{ masterId: string }>();
  const { activeOrder } = useApp();
  const { openThread } = useChat();
  const { isFavorite, toggleFavorite } = useFavorites();
  const showToast = useToast();

  const master = Object.values(MASTERS).find((item) => item.id === masterId);
  if (!master) return <Navigate to="/app/home" replace />;

  const canCall =
    activeOrder !== null &&
    isMasterPhoneVisible(activeOrder.status) &&
    Boolean(master.phoneNumber);

  return (
    <ScreenShell
      header={<Header variant="inner" title="Usta profili" onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <div className="flex flex-col gap-12">
            {/*
              Yozish HAR DOIM ochiq, qoʻngʻiroq esa faqat buyurtma aktiv
              paytda: usta raqami ish tugagach yopiladi. Ilgari bu holatda
              ekranda faqat "qoʻllab-quvvatlashga yozing" degan matn qolardi.
            */}
            <div className="flex gap-12">
              {canCall && (
                <a
                  href={`tel:${master.phoneNumber}`}
                  className="flex h-[52px] flex-1 items-center justify-center gap-8 rounded-md bg-primary px-16 text-button text-on-primary shadow-primary-lift"
                >
                  <Icon icon={Phone} size={20} weight="fill" />
                  Qoʻngʻiroq
                </a>
              )}
              <Button
                variant={canCall ? 'secondary' : 'primary'}
                leadingIcon={ChatCircleDots}
                className="flex-1"
                onClick={() =>
                  navigate(
                    `/app/chat/${openThread(
                      master.id,
                      activeOrder?.master?.id === master.id
                        ? activeOrder.categoryName
                        : 'Savol-javob',
                    )}`,
                  )
                }
              >
                Yozish
              </Button>
            </div>

            {!canCall && (
              <>
                <p className="text-center text-body-sm text-text-secondary">
                  Ish yakunlangan — usta raqami yopiq
                </p>
                <Button variant="ghost" onClick={() => navigate('/app/support')}>
                  Qoʻllab-quvvatlashga murojaat
                </Button>
              </>
            )}
          </div>
        </StickyFooter>
      }
    >
      <div className="mt-16 flex flex-col items-center">
        {/* 120px avatar ekranning uchdan birini egallardi — 80px hero blokni
            ixchamlashtiradi va ostidagi maʼlumotga joy ochadi. */}
        <Avatar name={master.fullName} src={master.photoUrl} size={80} shape="square" />
        <h1 className="mt-12 text-center text-h2 text-text-primary">{master.fullName}</h1>
        <p className="mt-2 text-body text-text-secondary">{master.profession}</p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          <Badge variant={master.experienceLevel === 'EXPERIENCED' ? 'experienced' : 'new'} />
          {master.hasGovCertificate && <Badge variant="certified" />}
        </div>
      </div>

      {/*
        Sevimli belgisi. Spetsifikatsiyaning 14.1.5-bandi bu tugmani
        taqiqlagan edi, chunki oʻsha paytda uning ortida hech narsa yoʻq edi.
        Endi bor: roʻyxatdagi ustaga yozish ham, keyingi buyurtmada aynan
        uni soʻrash ham ishlaydi.
      */}
      <button
        type="button"
        onClick={() => {
          const added = toggleFavorite(master.id);
          void tapFeedback();
          showToast(added ? 'Sevimlilarga qoʻshildi' : 'Sevimlilardan olib tashlandi');
        }}
        className="mt-20 flex min-h-touch w-full items-center justify-center gap-8 rounded-md border border-border bg-surface-elevated px-16 text-button text-text-primary"
      >
        <Icon
          icon={Heart}
          size={20}
          weight={isFavorite(master.id) ? 'fill' : 'regular'}
          className={isFavorite(master.id) ? 'text-danger' : 'text-text-secondary'}
        />
        {isFavorite(master.id) ? 'Sevimlilarda' : 'Sevimlilarga qoʻshish'}
      </button>
      <p className="mt-8 px-4 text-center text-caption text-text-secondary">
        Sevimli ustaga profilni qidirmasdan yozasiz va keyingi buyurtmada aynan uni
        soʻraysiz.
      </p>

      {/*
        Reyting va bajarilgan ishlar koʻrsatkichlari. Ilgari ular sarlavha
        ostida oddiy matn boʻlib turardi va ekranning pastki yarmi butunlay
        boʻsh qolardi — bu sahifani tugallanmagandek koʻrsatardi.
      */}
      <div className="mt-20 grid grid-cols-2 gap-12">
        <div className="rounded-lg border border-border bg-surface-elevated px-16 py-12">
          <StarRating value={master.ratingAvg} size="sm" showValue />
          <p className="mt-4 text-body-sm text-text-secondary">Reyting</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-elevated px-16 py-12">
          <p className="tabular text-h3 text-text-primary">{master.completedOrdersCount}</p>
          <p className="mt-4 text-body-sm text-text-secondary">Bajarilgan buyurtma</p>
        </div>
      </div>

      {/*
        Tekshiruv maʼlumoti — foydalanuvchi ustaga nega ishonishi mumkinligini
        tushuntiradi va sahifaning pastki qismini mazmun bilan toʻldiradi.
        Ilgari bu yerda faqat boʻsh maydon turardi.
      */}
      {/*
        "Pasport maʼlumotlari tekshirilgan" OLIB TASHLANDI: `Master` tipida
        bunday maydon yoʻq va Kafolat sahifasi buning aksini aytadi
        ("Passport va ID tekshiruvi ilovada koʻrsatilmaydi"). Ikki sahifa
        bir-biriga qarama-qarshi turgan edi.
      */}
      <div className="mt-12 rounded-lg border border-border bg-surface-elevated px-16 py-12">
        <div className="flex items-start gap-12">
          <Icon
            icon={ShieldCheck}
            size={20}
            className={cn('mt-2 shrink-0', master.hasGovCertificate ? 'text-success' : 'text-text-secondary')}
          />
          <div className="min-w-0 flex-1">
            <p className="text-title text-text-primary">
              {master.hasGovCertificate ? 'Davlat sertifikati bor' : 'Sertifikat koʻrsatilmagan'}
            </p>
            <p className="mt-2 text-body-sm text-text-secondary">
              {master.hasGovCertificate
                ? 'Reyting faqat yakunlangan buyurtmalardan hisoblanadi.'
                : 'Pasport va ID tekshiruvi ilovada koʻrsatilmaydi — buni tekshirilgan deb hisoblamang.'}
            </p>
          </div>
        </div>

        <p className="mt-12 border-t border-border pt-12 text-body-sm text-text-secondary">
          Usta kelganda uning ismi va rasmini shu sahifadagi maʼlumot bilan solishtiring.
        </p>
      </div>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
