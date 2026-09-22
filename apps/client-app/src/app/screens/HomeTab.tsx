import { ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { OrderListCard } from '@/components/order/OrderListCard';
import { PremiumMastersRail } from '@/components/PremiumMastersRail';
import { ReviewCard } from '@/components/ReviewCard';
import { ServiceTile } from '@/components/ServiceTile';
import { StatusBar } from '@/preview/StatusBar';
import { AppTabBar } from '../AppTabBar';
import { BottomInset } from '@/screens/_shared/ScreenShell';
import { MORE_ICON, serviceIcon } from '@/lib/serviceIcons';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { reviewDate, SAMPLE_REVIEWS } from '@/mocks/reviews';
import { ALL_SERVICES_IMAGE, SERVICE_IMAGES } from '@/mocks/serviceImages';
import { MASTER_LIST } from '@/mocks/masters';
import { HomeBanner } from '@/screens/stage1/HomeBanner';
import aiRobot from '@/assets/brand/ai-robot.webp';
import { useCatalog } from '../catalog-store';
import { useApp } from '../store';
import { useOpenService } from '../useSelectService';
import { API_BASE_URL } from '@/api/client';
import { mediaSrc } from '@/lib/servicePresentation';

/**
 * Bosh sahifa 2026-09-13 dan santexnikaga qaratilgan (egasining maketi):
 * 3×2 panjarada guruhning birinchi BESH xizmati (haqiqiy fotolar bilan) +
 * "Barcha xizmatlar".
 * Namuna sharhlar bosh sahifada belgisiz koʻrsatiladi (egasining qarori);
 * ularning namuna ekani /app/reviews sahifasida va src/mocks/reviews.ts da
 * aytilgan.
 * Platforma hozircha faqat santexnika; qolgan ikki xizmat (kanalizatsiya
 * tozalash, isitish) "Barcha xizmatlar" orqali — /app/services. "Mashhur"
 * demaymiz: mashhurlik maʼlumoti yoʻq, bu shunchaki roʻyxatning boshi.
 */
const HOME_SERVICE_COUNT = 5;

/**
 * Premium tarifni sotib olgan ustalar — bosh sahifa yuqorisidagi qatorda
 * faqat shular koʻrinadi. Tartib `MASTER_LIST` dan meros: reyting boʻyicha.
 */
const PREMIUM_MASTERS = MASTER_LIST.filter((master) => master.isPremium);

/**
 * Boʻlim sarlavhasi + "Barchasini koʻrish" havolasi.
 *
 * Sarlavha text-h3 (h2 emas): h2 "Santexnika xizmatlari" 360 da 199px,
 * yonidagi havola bilan 320px qatorga sigʻmaydi va ikkinchi satrga tushadi.
 * Havoladagi strelka Icon: "→" belgisi Inter latin-ext da yoʻq. `-my-12
 * py-12` — havolaga 44px bosish balandligi, qator balandligi oʻzgarmaydi.
 */
function SectionTitleRow({ title, onMore }: { title: string; onMore: () => void }) {
  return (
    <div className="flex items-center justify-between gap-8 pt-16 [@media(max-height:800px)]:pt-4">
      <h2 className="min-w-0 truncate text-h3 text-text-primary">{title}</h2>
      <button
        type="button"
        onClick={onMore}
        className="-my-12 -mr-8 inline-flex shrink-0 items-center gap-4 whitespace-nowrap py-12 pr-8 text-body-sm font-semibold text-primary active:opacity-70"
      >
        Barchasini koʻrish
        <Icon icon={ArrowRight} size={14} weight="bold" aria-hidden />
      </button>
    </div>
  );
}

export function HomeTab() {
  const navigate = useNavigate();
  const { activeOrder, fullName, phoneNumber, unreadCount } = useApp();
  const { groups } = useCatalog();

  /*
   * Bosh sahifadagi panjara — BIRINCHI guruhning dastlabki beshta xizmati.
   * Guruh `id` si qattiq yozilmaydi: server ulanganda u UUID boʻlib keladi
   * va qattiq yozilgan `g-plumbing` panjarani boʻshatib qoʻyardi.
   */
  const homeServices = (groups[0]?.categories ?? []).slice(0, HOME_SERVICE_COUNT);
  const now = useMinuteClock();
  const selectService = useOpenService();

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
              onSelect={(id) => navigate(`/app/masters/${id}`)}
            />
          </div>

          <div className="px-20 pt-12 [@media(max-height:800px)]:pt-4">
            <HomeBanner onSelect={() => navigate('/app/services')} />
          </div>
        </div>
      </div>

      {/*
        Oʻram `relative`: suzuvchi AI tugmasi scroll konteynerining USTIDA
        turadi va u bilan surilmaydi. Pastki chekkasi tab bar boshlanadigan
        joy — tugma tab bar ustiga chiqmaydi.
      */}
      <div className="relative min-h-0 flex-1">
      <main data-app-scroll className="h-full overflow-y-auto overscroll-contain px-20">
        {activeOrder && (
          <section className="pt-16">
            <h2 className="text-h3 text-text-primary">Aktiv buyurtmangiz</h2>
            {/* Buyurtmalar tabidagi karta bilan bir xil — faktlar va amallar
                bitta manbadan (`src/lib/orderList.ts`). `returnTo` yoʻq:
                bosh sahifaga qaytish standart yoʻl. */}
            <OrderListCard
              order={activeOrder}
              now={now}
              onOpen={() => navigate(`/app/order/${activeOrder.id}`)}
              onAction={(action) => navigate(action.route, { state: action.state ?? null })}
              className="mt-12"
            />
          </section>
        )}

        {/* Sarlavha guruh nomidan: katalog serverdan kelganda ham mos qoladi. */}
        <SectionTitleRow
          title={groups[0] ? `${groups[0].name} xizmatlari` : 'Xizmatlar'}
          onMore={() => navigate(groups[0] ? `/app/groups/${groups[0].id}` : '/app/services')}
        />
        {/* 3×2 panjara (egasining maketi). Ixcham rejimda qatorlar orasi 4px. */}
        <div className="mt-8 grid grid-cols-3 gap-8 [@media(max-height:800px)]:gap-y-4">
          {homeServices.map((category) => (
            <ServiceTile
              key={category.id}
              label={category.name}
              icon={serviceIcon(category.iconKey ?? 'plumber')}
              imageUrl={
                // Paneldan qoʻyilgan muqova ustun; boʻlmasa ilova ichidagi rasm.
                category.coverUrl
                  ? mediaSrc(API_BASE_URL, category.coverUrl)
                  : category.iconKey
                    ? SERVICE_IMAGES[category.iconKey]
                    : undefined
              }
              onClick={() => selectService(category.id)}
            />
          ))}
          {/* Neytral: xizmat emas, toʻliq katalogga (barcha guruhlar) yoʻl. */}
          <ServiceTile
            label="Barcha xizmatlar"
            icon={MORE_ICON}
            imageUrl={ALL_SERVICES_IMAGE}
            tone="neutral"
            onClick={() => navigate('/app/services')}
          />
        </div>

        <SectionTitleRow title="Mijozlarimiz fikrlari" onMore={() => navigate('/app/reviews')} />
        {/*
          Gorizontal tasma — PremiumMastersRail naqshi (-mx-20). Oʻng padding
          80px: AI tugmasi oʻngdagi 20+52=72px ni egallaydi; 80px oxirgi karta
          tugmadan 8px chiqib scroll qilishiga imkon beradi. pb — e1 soyasi
          overflow qutisida kesilmasin.
        */}
        <ul className="-mx-20 mt-8 flex gap-8 overflow-x-auto pb-8 pl-20 pr-[80px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [@media(max-height:800px)]:pb-4">
          {SAMPLE_REVIEWS.map((review) => (
            <li key={review.id} className="w-[248px] shrink-0">
              <ReviewCard
                customerName={review.customerName}
                stars={review.stars}
                comment={review.comment}
                likeCount={review.likeCount}
                createdAt={reviewDate(review, now)}
                now={now}
              />
            </li>
          ))}
        </ul>
      </main>

      {/*
        AI yordamchi — pastki oʻng burchakdagi suzuvchi tugma (egasining
        talabi). Ostidagi statik kontent (sarlavhalar, panjara) har bir
        telefonda tugmadan yuqorida tugaydi. Tugma ostiga faqat
        gorizontal sharhlar tasmasining IKKINCHI kartasining burchagi tushadi:
        birinchi karta 248px — tugma boshlanadigan 268px dan chapda; tasmada
        pr-[80px] bor, shuning uchun har bir karta tugmadan chiqib oʻqiladi.
      */}
      <button
        type="button"
        onClick={() => navigate('/app/ai')}
        aria-label="AI yordamchi"
        className="absolute bottom-12 right-20 flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-full bg-surface-elevated shadow-e3 ring-2 ring-primary transition-transform duration-press ease-emphasized active:scale-[0.94] [@media(max-height:800px)]:bottom-8"
      >
        {/*
          Egasi bergan robot maskoti (2026-09-13 kechki versiya, 240px WebP,
          6 KB) — oq doira, koʻk halqa: kontent ustida ham aniq ajralib
          turadi, tungi temada ham.
        */}
        <img src={aiRobot} alt="" draggable={false} className="h-full w-full object-cover" />
      </button>
      </div>

      <AppTabBar active="home" />
      <BottomInset />
    </div>
  );
}
