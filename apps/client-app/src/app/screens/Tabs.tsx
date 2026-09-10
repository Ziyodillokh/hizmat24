import { Bell, BellSlash, ChatCircleDots, ClipboardText, FileMagnifyingGlass, Headset, Info, Medal, Moon, Phone, ShieldCheck, SignOut, Sun, UserCircle, Wrench } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { MenuGroup, type MenuSection } from '@/components/MenuGroup';
import { NotificationRow } from '@/components/NotificationRow';
import { OrderCard } from '@/components/OrderCard';
import { SegmentControl } from '@/components/SegmentControl';
import { StarRating } from '@/components/StarRating';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { AppTabBar } from '../AppTabBar';
import { cn } from '@/lib/cn';
import { serviceIcon } from '@/lib/serviceIcons';
import { formatPhone, formatTime, orderDateGroup } from '@/lib/formatters';
import {
  HISTORY_FILTER_LABELS,
  ORDER_STATUS,
  isTerminal,
  isMasterPhoneVisible,
  matchesHistoryFilter,
  type HistoryFilter,
} from '@/lib/orderStateMachine';
import { notificationUiType } from '@/mocks/notifications';
import { MASTERS } from '@/mocks/masters';
import { USER } from '@/mocks/user';
import { Toggle } from '@/components/Toggle';
import { useApp } from '../store';
import { useChat } from '../chat-store';
import { useWallet } from '../useWallet';
import { useToast } from '../ToastHost';
import { useTheme } from '../theme-context';

const FILTERS: HistoryFilter[] = ['all', 'active', 'done', 'cancelled'];

/** 24 · Buyurtmalarim. */
export function OrdersTab() {
  const navigate = useNavigate();
  const { orders } = useApp();
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const now = new Date();

  /*
   * Buyurtmalar sana boʻyicha guruhlanadi ("Bugun" · "Kecha" · "Sentabr").
   * Roʻyxat allaqachon yangidan eskiga tartiblangan holda keladi, shuning
   * uchun guruhlar ham shu tartibda hosil boʻladi — qayta saralash shart emas.
   */
  const groups = useMemo(() => {
    const visible = orders.filter((order) => matchesHistoryFilter(order.status, filter));
    const result: { title: string; orders: typeof visible }[] = [];

    for (const order of visible) {
      const title = orderDateGroup(order.createdAt, now);
      const last = result[result.length - 1];
      if (last && last.title === title) last.orders.push(order);
      else result.push({ title, orders: [order] });
    }

    return result;
    // `now` har renderda yangilanadi, lekin guruh sarlavhasi kun aniqligida
    // hisoblanadi — uni bogʻliqlikka qoʻshish keraksiz qayta hisoblash beradi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, filter]);

  const isEmpty = groups.length === 0;

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtmalar" />}
      footer={<AppTabBar active="orders" />}
    >
      <SegmentControl
        value={filter}
        onChange={setFilter}
        options={FILTERS.map((value) => ({ value, label: HISTORY_FILTER_LABELS[value] }))}
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardText}
          title="Hozircha buyurtmalaringiz yoʻq"
          description="Birinchi buyurtmangizni bering"
          action={{ label: 'Ustani chaqirish', onClick: () => navigate('/app/services') }}
          inline
        />
      ) : isEmpty ? (
        <EmptyState
          icon={FileMagnifyingGlass}
          title="Bu boʻlimda buyurtma yoʻq"
          description="Boshqa filtrni tanlab koʻring"
          className="mt-24"
          inline
        />
      ) : (
        groups.map((group) => (
          <section key={group.title} className="mt-20 first:mt-16">
            <h2 className="px-4 text-overline uppercase text-text-secondary">{group.title}</h2>
            <ul className="mt-8 flex flex-col gap-8">
              {group.orders.map((order) => (
                <li key={order.id}>
                  <OrderCard
                    serviceIcon={serviceIcon(order.categoryIconKey)}
                    serviceName={order.categoryName}
                    status={order.status}
                    createdAt={order.createdAt}
                    now={now}
                    // "Bugun"/"Kecha" guruhida sarlavha kunni allaqachon
                    // aytgan — kartada faqat vaqt qoladi.
                    dateLabel={
                      group.title === 'Bugun' || group.title === 'Kecha'
                        ? formatTime(order.createdAt)
                        : undefined
                    }
                    price={order.price}
                    onSelect={() => navigate(`/app/order/${order.id}`)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

export function NotificationsTab() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markNotificationsRead } = useApp();

  const now = new Date();

  /*
   * Buyurtmalar roʻyxatidagi kabi sana boʻyicha guruhlash. Bildirishnomalar
   * oqimi tez oʻsadi va guruhsiz u tugamaydigan bir xil kartalar tasmasiga
   * aylanadi — foydalanuvchi qaysi biri bugungi ekanini ajrata olmaydi.
   */
  const groups = useMemo(() => {
    const result: { title: string; items: typeof notifications }[] = [];

    for (const item of notifications) {
      const title = orderDateGroup(item.sentAt, now);
      const last = result[result.length - 1];
      if (last && last.title === title) last.items.push(item);
      else result.push({ title, items: [item] });
    }

    return result;
    // Guruh sarlavhasi kun aniqligida hisoblanadi — `now` ni bogʻliqlikka
    // qoʻshish har renderda keraksiz qayta hisoblash beradi.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  return (
    <ScreenShell
      header={
        <Header variant="inner" title="Bildirishnomalar" onBack={() => navigate('/app/home')} />
      }
    >
      {notifications.length === 0 ? (
        <EmptyState
          icon={BellSlash}
          title="Bildirishnomalar yoʻq"
          description="Buyurtma bergach, holat oʻzgarishlari shu yerda koʻrinadi"
          inline
        />
      ) : (
        <>
          {/* Xulosa qatori: nechta oʻqilmagan va ularni bir bosishda yopish. */}
          <div className="flex items-center justify-between gap-12 pt-8">
            <p className="shrink-0 text-body-sm text-text-secondary">
              {unreadCount > 0 ? `${unreadCount} ta oʻqilmagan` : 'Barchasi oʻqilgan'}
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markNotificationsRead}
                className="shrink-0 rounded-full bg-primary-surface px-12 py-4 text-caption text-primary-pressed"
              >
                Barchasini oʻqildi
              </button>
            )}
          </div>

          {groups.map((group) => (
            <section key={group.title} className="mt-16 first:mt-12">
              <h2 className="px-4 text-overline uppercase text-text-secondary">{group.title}</h2>
              <ul className="mt-8 flex flex-col gap-8">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <NotificationRow
                      type={notificationUiType(item.kind)}
                      title={item.title}
                      body={item.body}
                      createdAt={item.sentAt}
                      now={now}
                      isUnread={item.readAt === null}
                      onSelect={() => navigate('/app/orders')}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

/** 26 · Profil — read-only. */
export function ProfileTab() {
  const navigate = useNavigate();
  const { phoneNumber, orders, role, completeOnboarding, signOut } = useApp();
  const { level } = useWallet();
  const showToast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [logoutOpen, setLogoutOpen] = useState(false);

  /*
   * Koʻrsatkichlar haqiqiy holatdan hisoblanadi — toʻqilgan raqam emas.
   * Buyurtma yoʻq boʻlsa blok umuman chizilmaydi: uchta nol foydalanuvchiga
   * hech narsa aytmaydi va sahifani boʻsh koʻrsatadi.
   */
  const stats = useMemo(() => {
    const done = orders.filter((order) => order.status === ORDER_STATUS.CLOSED).length;
    const active = orders.filter(
      (order) => !isTerminal(order.status) && order.status !== ORDER_STATUS.CANCELLED,
    ).length;
    return [
      { value: orders.length, label: 'Buyurtma' },
      { value: done, label: 'Yakunlangan' },
      { value: active, label: 'Faol' },
    ];
  }, [orders]);

  const sections: MenuSection[] = [
    {
      title: 'Hisob',
      items: [
        {
          icon: ClipboardText,
          label: 'Buyurtmalar tarixi',
          onSelect: () => navigate('/app/orders'),
        },
        {
          // Chat endi tab bar'da — menyudagi takroriy qator oʻrniga bonus.
          icon: Medal,
          label: 'Bonuslar',
          hint: level.label,
          onSelect: () => navigate('/app/wallet/bonus'),
        },
        { icon: Bell, label: 'Bildirishnomalar', hint: 'Yoqilgan' },
        {
          /*
           * Tanishtiruvda "keyinchalik profil orqali almashtira olasiz" deb
           * va'da berilgan — bu qator oʻsha va'dani bajaradi. Usiz ilova
           * bajarilmaydigan va'da bergan boʻlardi.
           */
          icon: role === 'master' ? Wrench : UserCircle,
          label: 'Rol',
          hint: role === 'master' ? 'Usta' : 'Mijoz',
          onSelect: () => {
            const next = role === 'master' ? 'client' : 'master';
            completeOnboarding(next);
            showToast(
              next === 'master'
                ? 'Usta ilovasi tayyorlanmoqda — hozircha mijoz rejimi'
                : 'Mijoz rejimiga oʻtdingiz',
            );
          },
        },
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: 'Tungi rejim',
          control: (
            <Toggle
              checked={theme === 'dark'}
              onChange={toggleTheme}
              label="Tungi rejim"
              className="shrink-0"
            />
          ),
        },
      ],
    },
    {
      title: 'Yordam',
      items: [
        {
          icon: Headset,
          label: "Qoʻllab-quvvatlash xizmati",
          onSelect: () => navigate('/app/support'),
        },
        { icon: Info, label: 'Ilova haqida', hint: '1.0.0' },
      ],
    },
    {
      title: 'Sessiya',
      items: [{ icon: SignOut, label: 'Chiqish', danger: true, onSelect: () => setLogoutOpen(true) }],
    },
  ];

  return (
    <ScreenShell
      header={<Header variant="inner" title="Profil" />}
      footer={<AppTabBar active="profile" />}
    >
      {/* Foydalanuvchi kartasi — ilovadagi boshqa kartalar bilan bir tilda. */}
      <div
        className={cn(
          'mt-8 flex items-center gap-12 rounded-lg border border-transparent bg-surface-elevated p-12 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <Avatar name={USER.fullName} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-h3 text-text-primary">{USER.fullName}</p>
          <p className="mt-2 truncate text-body-sm text-text-secondary">
            {formatPhone(phoneNumber)}
          </p>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="mt-12 grid grid-cols-3 gap-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={cn(
                'rounded-lg border border-transparent bg-surface-elevated px-8 py-12 text-center shadow-e1',
                "[[data-theme='dark']_&]:border-border",
              )}
            >
              <p className="tabular text-h3 text-text-primary">{stat.value}</p>
              <p className="mt-2 truncate text-caption text-text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {sections.map((section) => (
        <MenuGroup key={section.title} section={section} />
      ))}

      <Modal
        open={logoutOpen}
        title="Chiqishni tasdiqlaysizmi?"
        onClose={() => setLogoutOpen(false)}
      >
        <div className="mt-20 flex flex-col gap-12">
          <Button
            variant="destructive"
            onClick={() => {
              signOut();
              navigate('/app', { replace: true });
            }}
          >
            Chiqish
          </Button>
          <Button variant="ghost" onClick={() => setLogoutOpen(false)}>
            Yopish
          </Button>
        </div>
      </Modal>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

export function MasterProfile() {
  const navigate = useNavigate();
  const { masterId } = useParams<{ masterId: string }>();
  const { activeOrder } = useApp();
  const { openThread } = useChat();

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
      <div className="mt-12 rounded-lg border border-border bg-surface-elevated px-16 py-12">
        <div className="flex items-start gap-12">
          <Icon icon={ShieldCheck} size={20} className="mt-2 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="text-title text-text-primary">Shaxsi tasdiqlangan</p>
            <p className="mt-2 text-body-sm text-text-secondary">
              {master.hasGovCertificate
                ? "Davlat sertifikati va pasport maʼlumotlari tekshirilgan"
                : "Pasport maʼlumotlari tekshirilgan"}
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
