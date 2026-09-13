import { Bell, BellSlash, CaretRight, ClipboardText, Headset, Heart, Info, MapPin, Medal, Moon, NotePencil, ShieldCheck, SignOut, Sun, UserCircle, Wrench } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { MenuGroup, type MenuSection } from '@/components/MenuGroup';
import { NotificationRow } from '@/components/NotificationRow';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { AppTabBar } from '../AppTabBar';
import { cn } from '@/lib/cn';
import { formatPhone, orderDateGroup } from '@/lib/formatters';
import { ORDER_STATUS, isTerminal } from '@/lib/orderStateMachine';
import { notificationUiType } from '@/mocks/notifications';
import { useDisputes } from '../dispute-store';
import { useAddresses } from '../address-store';
import { useFavorites } from '../favorites-store';
import { useMaster } from '../master-store';
import { Toggle } from '@/components/Toggle';
import { useApp } from '../store';
import { useWallet } from '../useWallet';
import { useToast } from '../ToastHost';
import { useTheme } from '../theme-context';

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
  const { fullName, phoneNumber, orders, role, completeOnboarding, signOut } = useApp();
  const { openCount } = useDisputes();
  const { addresses } = useAddresses();
  const { count: favoriteCount } = useFavorites();
  const { isComplete: isMasterComplete } = useMaster();
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
            if (next === 'master') {
              // Rejimning oʻz uyi bor — toast oʻrniga kabinet ochiladi.
              navigate('/app/master');
              return;
            }
            showToast('Mijoz rejimiga oʻtdingiz');
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
    // Usta rejimida kabinet qatori — rejim faqat profil orqali ochilmasin.
    ...(role === 'master'
      ? [
          {
            title: 'Usta',
            items: [
              {
                icon: Wrench,
                label: 'Usta kabineti',
                hint: isMasterComplete ? 'Profil toʻliq' : 'Profil toʻldirilmagan',
                onSelect: () => navigate('/app/master'),
              },
            ],
          },
        ]
      : []),
    {
      title: 'Shaxsiy',
      items: [
        {
          icon: MapPin,
          label: 'Manzillarim',
          // Nol boʻlsa ishora chizilmaydi: "0 ta" hech narsa aytmaydi.
          hint: addresses.length > 0 ? `${addresses.length} ta` : undefined,
          onSelect: () => navigate('/app/addresses'),
        },
        {
          icon: Heart,
          label: 'Sevimli ustalar',
          hint: favoriteCount > 0 ? `${favoriteCount} ta` : undefined,
          onSelect: () => navigate('/app/favorites'),
        },
      ],
    },
    {
      title: 'Yordam',
      items: [
        {
          icon: NotePencil,
          label: 'Murojaatlarim',
          // Nol boʻlsa ishora umuman chizilmaydi: "0 ta" hech narsa aytmaydi,
          // lekin xato bordir degan shubha tugʻdiradi.
          hint: openCount > 0 ? `${openCount} ta` : undefined,
          onSelect: () => navigate('/app/disputes'),
        },
        {
          icon: ShieldCheck,
          label: 'Kafolat va himoya',
          onSelect: () => navigate('/app/guarantee'),
        },
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
      {/*
        Karta BOSILADI: shevron qoʻyilgani uchun u shaxsiy maʼlumotlar
        ekraniga olib borishi shart — bosilmaydigan qatordagi shevron
        ishlamaydigan tugmaning eng jimgina koʻrinishi.
      */}
      <button
        type="button"
        onClick={() => navigate('/app/profile/edit')}
        className={cn(
          'mt-8 flex w-full items-center gap-12 rounded-lg border border-transparent bg-surface-elevated p-12 text-left shadow-e1',
          "[[data-theme='dark']_&]:border-border",
          'transition-transform duration-press ease-std active:scale-[0.99]',
        )}
      >
        {/*
          Ism foydalanuvchidan keladi. Ilgari bu yerda `mocks/user.ts` dagi
          "Jasur" turardi — foydalanuvchi hech qachon aytmagan ism.
        */}
        <Avatar name={fullName} size={64} />
        <div className="min-w-0 flex-1">
          {fullName ? (
            <p className="truncate text-h3 text-text-primary">{fullName}</p>
          ) : (
            // Toʻqilgan ism ham, boʻsh joy ham qoldirilmaydi: qator
            // oʻzining amalini aytadi.
            <p className="truncate text-h3 text-text-secondary">Ism kiritilmagan</p>
          )}
          <p className="mt-2 truncate text-body-sm text-text-secondary">
            {formatPhone(phoneNumber)}
          </p>
        </div>
        <Icon icon={CaretRight} size={16} className="shrink-0 text-text-secondary" />
      </button>

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
          {/* Murojaat matnlari faqat shu qurilmada — chiqish ularni ham
              oʻchiradi va buni oldindan aytish shart. */}
          {openCount > 0 && (
            <p className="text-center text-body-sm text-text-secondary">
              Chiqsangiz, tayyorlangan murojaat matnlari ham oʻchadi.
            </p>
          )}
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
