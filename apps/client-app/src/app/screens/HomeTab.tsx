import { Storefront, UsersThree } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { MasterSuggestionCard } from '@/components/MasterSuggestionCard';
import { PremiumMastersRail } from '@/components/PremiumMastersRail';
import { ServiceGroupTile } from '@/components/ServiceGroupTile';
import { StatusChip } from '@/components/StatusChip';
import { StatusBar } from '@/preview/StatusBar';
import { AppTabBar } from '../AppTabBar';
import { BottomInset } from '@/screens/_shared/ScreenShell';
import { MORE_ICON, serviceIcon, serviceIconSize, serviceIconTone } from '@/lib/serviceIcons';
import { formatDuration, formatPrice, formatQueuePosition } from '@/lib/formatters';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { SERVICE_GROUPS } from '@/mocks/serviceGroups';
import { MASTER_LIST, MASTERS } from '@/mocks/masters';
import { HomeBanner } from '@/screens/stage1/HomeBanner';
import { useApp } from '../store';
import { useToast } from '../ToastHost';
import type { LiveOrder } from '../types';

/**
 * Panjarada 4x2 = 8 oʻrin bor va uchtasi navigatsiyaga ketadi (Market,
 * Ustalar, Barchasi). Qolgan beshtasi eng katta xizmat guruhlariga beriladi;
 * tushib qolgan ikkitasi ("Boʻyoqchilik", "Tozalash" — har birida bittadan
 * xizmat) "Barchasi" orqali bitta bosishda topiladi.
 *
 * Nega aynan panjara: Market va Mutaxassislar tab bardan chiqdi va ularga
 * bosh sahifadan yoʻl kerak, lekin sahifa toʻrtta oʻlchamda SCROLLSIZ
 * sigʻishi shart. 390x844 da zaxira ~23px — yangi qator qoʻshib boʻlmaydi,
 * shuning uchun mavjud panjaradagi ikkita oʻrin almashtirildi (+0px).
 */
const VISIBLE_GROUPS = 5;

/**
 * Premium tarifni sotib olgan ustalar — bosh sahifa yuqorisidagi qatorda
 * faqat shular koʻrinadi. Tartib `MASTER_LIST` dan meros: reyting boʻyicha.
 */
const PREMIUM_MASTERS = MASTER_LIST.filter((master) => master.isPremium);

/** Tavsiya blokida ikkita usta — referens maketdagi ikki ustunli qator. */
const SUGGESTED_MASTERS = Object.values(MASTERS).slice(0, 2);

/** Aktiv buyurtma kartasidagi ikkinchi qator — holatga qarab. */
function secondaryLine(order: LiveOrder): string | null {
  switch (order.status) {
    case ORDER_STATUS.SEARCHING:
      return order.scheduledAt ? 'Belgilangan vaqtga rejalashtirilgan' : 'Usta qidirilmoqda…';
    case ORDER_STATUS.SEARCHING_QUEUED:
      return order.queuePosition ? formatQueuePosition(order.queuePosition) : null;
    case ORDER_STATUS.ASSIGNED:
    case ORDER_STATUS.MASTER_EN_ROUTE:
      return order.etaMinutes ? `Taxminiy vaqt: ${formatDuration(order.etaMinutes)}` : null;
    case ORDER_STATUS.IN_PROGRESS:
      return order.master?.fullName ?? null;
    case ORDER_STATUS.COMPLETED_BY_MASTER:
      return 'Ishingiz yakunlandi';
    default:
      return null;
  }
}

export function HomeTab() {
  const navigate = useNavigate();
  const { activeOrder, fullName, phoneNumber, unreadCount, setDraftMaster } = useApp();
  const showToast = useToast();

  const groups = SERVICE_GROUPS.slice(0, VISIBLE_GROUPS);

  return (
    <div className="flex h-full flex-col bg-surface">
      {/*
        Tepa blok qadalgan va SCROLL QILMAYDI.
        Turkuaz fon alohida qatlam sifatida absolyut joylashtirilgan va
        pastdan 56px yetmaydi — shu tufayli banner uning chetidan oshib,
        yarmi sahifa foniga tushadi (referensdagi qatlamlanish). Bannerni
        scroll konteyneriga salbiy margin bilan tiqish bu effektni bermaydi:
        scroll paytida u konteyner chetida keskin kesilardi.
      */}
      <div className="relative shrink-0">
        <div className="hero-field absolute inset-x-0 top-0 bottom-[64px] rounded-b-xl" aria-hidden />

        <div className="relative">
          <StatusBar />
          <Header
            variant="home"
            onHero
            name={fullName}
            phone={phoneNumber}
            unreadCount={unreadCount}
            onNotificationsClick={() => navigate('/app/notifications')}
          />

          {/*
            Qidiruv maydoni oʻrniga premium ustalar qatori. Qidiruv "Barcha
            xizmatlar" ekranida qoladi — u yerda roʻyxat uzun va qidiruv
            haqiqatan kerak; bosh sahifada esa kategoriya katakchalari
            allaqachon toʻgʻridan-toʻgʻri yoʻl beradi.
          */}
          <div className="px-20 pt-4">
            <PremiumMastersRail
              masters={PREMIUM_MASTERS}
              onSelect={(id) => navigate(`/app/master/${id}`)}
            />
          </div>

          <div className="px-20 pt-12 [@media(max-height:800px)]:pt-8">
            <HomeBanner onSelect={() => navigate('/app/services')} />
          </div>
        </div>
      </div>

      <main data-app-scroll className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-20">
        {activeOrder && (
          <section className="pt-16">
            <h2 className="text-h3 text-text-primary">Aktiv buyurtmangiz</h2>
            <Card className="mt-12 flex flex-col gap-12">
              <StatusChip status={activeOrder.status} className="self-start" />
              <div className="flex items-start justify-between gap-12">
                <p className="min-w-0 flex-1 text-title text-text-primary">
                  {activeOrder.categoryName}
                </p>
                <p className="tabular shrink-0 text-price text-text-primary">
                  {formatPrice(activeOrder.invoice.total)}
                </p>
              </div>
              {secondaryLine(activeOrder) && (
                <p className="text-body-sm text-text-secondary">{secondaryLine(activeOrder)}</p>
              )}
              <Button variant="primary" onClick={() => navigate(`/app/order/${activeOrder.id}`)}>
                {activeOrder.status === ORDER_STATUS.COMPLETED_BY_MASTER
                  ? 'Ishni baholash'
                  : 'Kuzatish'}
              </Button>
            </Card>
          </section>
        )}

        <h2 className="pt-16 text-h2 text-text-primary [@media(max-height:800px)]:pt-12">
          Mashhur xizmatlar
        </h2>
        <div className="mt-12 grid grid-cols-4 gap-8 gap-y-12 [@media(max-height:800px)]:mt-8 [@media(max-height:800px)]:gap-y-8">
          {groups.map((group) => (
            <ServiceGroupTile
              key={group.id}
              label={group.name}
              icon={serviceIcon(group.iconKey)}
              iconSize={serviceIconSize(group.iconKey)}
              iconTone={serviceIconTone(group.iconKey)}
              onClick={() => navigate(`/app/groups/${group.id}`)}
            />
          ))}
          {/*
            Market — yashil doʻkon (referens maket): u ham "boʻlim", lekin
            oʻz mahsuloti bor va oʻz rangiga loyiq. "Ustalar" va "Barchasi"
            esa neytral: ular xizmat turi emas, roʻyxatga oʻtish yoʻli.
          */}
          <ServiceGroupTile
            label="Market"
            icon={Storefront}
            iconTone={serviceIconTone('market')}
            onClick={() => navigate('/app/market')}
          />
          <ServiceGroupTile
            label="Ustalar"
            icon={UsersThree}
            tone="neutral"
            onClick={() => navigate('/app/masters')}
          />
          <ServiceGroupTile
            label="Barchasi"
            icon={MORE_ICON}
            iconSize={serviceIconSize('more')}
            tone="neutral"
            onClick={() => navigate('/app/services')}
          />
        </div>

        <h2 className="pt-16 text-h2 text-text-primary [@media(max-height:800px)]:pt-12">
          Sizga tavsiya etiladiganlar
        </h2>
        <ul className="mt-8 grid grid-cols-2 items-stretch gap-12">
          {SUGGESTED_MASTERS.map((master) => (
            <li key={master.id} className="min-w-0">
              <MasterSuggestionCard
                name={master.fullName}
                profession={master.profession}
                rating={master.ratingAvg}
                photoUrl={master.photoUrl}
                /*
                  "Buyurtma berish" endi HALOL: tanlov buyurtmaga yoziladi va
                  aynan shu usta tayinlanadi. 6-bosqichgacha bu yorliq
                  yolgʻon edi — oqim oxirida boshqa odam tayinlanardi.
                */
                actionLabel="Buyurtma berish"
                onAction={() => {
                  setDraftMaster(master.id);
                  showToast(`${master.fullName} tanlandi`, 'success');
                  navigate('/app/services');
                }}
                onOpen={() => navigate(`/app/master/${master.id}`)}
              />
            </li>
          ))}
        </ul>

      </main>

      <AppTabBar active="home" />
      <BottomInset />
    </div>
  );
}
