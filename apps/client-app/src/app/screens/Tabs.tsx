import { useMemo, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  BellOff,
  ChevronRight,
  ClipboardList,
  Headset,
  Info,
  Moon,
  SearchX,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { NotificationRow } from '@/components/NotificationRow';
import { OrderCard } from '@/components/OrderCard';
import { SegmentControl } from '@/components/SegmentControl';
import { StarRating } from '@/components/StarRating';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { AppTabBar } from '../AppTabBar';
import { cn } from '@/lib/cn';
import { serviceIcon } from '@/lib/serviceIcons';
import { formatPhone } from '@/lib/formatters';
import {
  HISTORY_FILTER_LABELS,
  isMasterPhoneVisible,
  matchesHistoryFilter,
  type HistoryFilter,
} from '@/lib/orderStateMachine';
import { notificationUiType } from '@/mocks/notifications';
import { MASTERS } from '@/mocks/masters';
import { Toggle } from '@/components/Toggle';
import { useApp } from '../store';
import { useTheme } from '../theme-context';

const FILTERS: HistoryFilter[] = ['all', 'active', 'done', 'cancelled'];

/** 24 · Buyurtmalarim. */
export function OrdersTab() {
  const navigate = useNavigate();
  const { orders } = useApp();
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const visible = useMemo(
    () => orders.filter((order) => matchesHistoryFilter(order.status, filter)),
    [orders, filter],
  );

  return (
    <ScreenShell
      header={<Header variant="inner" title="Buyurtmalarim" />}
      footer={<AppTabBar active="orders" />}
    >
      <SegmentControl
        value={filter}
        onChange={setFilter}
        options={FILTERS.map((value) => ({ value, label: HISTORY_FILTER_LABELS[value] }))}
      />

      {orders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Hozircha buyurtmalaringiz yoʻq"
          description="Birinchi buyurtmangizni bering"
          action={{ label: 'Ustani chaqirish', onClick: () => navigate('/app/services') }}
          inline
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchX} title="Hech narsa topilmadi" className="mt-24"
          inline
        />
      ) : (
        <ul className="mt-16 flex flex-col gap-12">
          {visible.map((order) => (
            <li key={order.id}>
              <OrderCard
                serviceIcon={serviceIcon(order.categoryIconKey)}
                serviceName={order.categoryName}
                status={order.status}
                createdAt={order.createdAt}
                now={new Date()}
                price={order.price}
                onSelect={() => navigate(`/app/order/${order.id}`)}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

/** 25 · Bildirishnomalar. */
export function NotificationsTab() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markNotificationsRead } = useApp();

  return (
    <ScreenShell
      header={<Header variant="inner" title="Bildirishnomalar" />}
      footer={<AppTabBar active="notifications" />}
    >
      {unreadCount > 0 && (
        <div className="flex items-center justify-between gap-12 pt-4">
          <p className="shrink-0 text-caption text-text-secondary">
            {unreadCount} ta oʻqilmagan
          </p>
          {/*
            Oddiy matnli amal: `Button` `button` shkalasida (16px/600) chiqib,
            sahifa sarlavhasidan ham baland koʻrinardi va yon yorliqni ikki
            satrga surib yuborardi.
          */}
          <button
            type="button"
            onClick={markNotificationsRead}
            className="shrink-0 text-caption text-primary"
          >
            Barchasini oʻqildi
          </button>
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="Bildirishnomalar yoʻq"
          description="Buyurtma bergach, holat oʻzgarishlari shu yerda koʻrinadi"
          inline
        />
      ) : (
        <ul className="mt-12 flex flex-col gap-4">
          {notifications.map((item) => (
            <li key={item.id}>
              <NotificationRow
                type={notificationUiType(item.kind)}
                title={item.title}
                body={item.body}
                createdAt={item.sentAt}
                now={new Date()}
                isUnread={item.readAt === null}
                onSelect={() => navigate('/app/orders')}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

interface MenuItem {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onSelect?: () => void;
  /** Chevron oʻrniga chiziladigan boshqaruv (masalan tema almashtirgichi). */
  control?: ReactNode;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

/**
 * Sozlama qatorlari bitta kartaga yigʻiladi — alohida suzuvchi qatorlar
 * oʻrniga guruhlangan roʻyxat mobil ilovalarda tanish va tartibli koʻrinadi.
 */
function MenuGroup({ section }: { section: MenuSection }) {
  return (
    <section className="mt-24">
      <h2 className="px-4 text-overline uppercase text-text-secondary">{section.title}</h2>

      <div className="mt-8 overflow-hidden rounded-lg border border-border bg-surface-elevated">
        {section.items.map((item, index) => {
          const isInteractive = Boolean(item.onSelect);
          const Row = isInteractive ? 'button' : 'div';

          return (
            <Row
              key={item.label}
              {...(isInteractive ? { type: 'button' as const, onClick: item.onSelect } : {})}
              className={cn(
                'flex min-h-touch w-full items-center gap-12 px-16 py-12 text-left',
                index > 0 && 'border-t border-border',
              )}
            >
              <Icon icon={item.icon} size={20} className="shrink-0 text-text-secondary" />
              <span className="min-w-0 flex-1 truncate text-body-lg text-text-primary">
                {item.label}
              </span>
              {item.hint && (
                <span className="shrink-0 text-body-sm text-text-secondary">{item.hint}</span>
              )}
              {item.control ??
                (isInteractive && (
                  <Icon icon={ChevronRight} size={16} className="shrink-0 text-text-secondary" />
                ))}
            </Row>
          );
        })}
      </div>
    </section>
  );
}

/** 26 · Profil — read-only. */
export function ProfileTab() {
  const navigate = useNavigate();
  const { phoneNumber, signOut } = useApp();
  const { theme, toggleTheme } = useTheme();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const sections: MenuSection[] = [
    {
      title: 'Hisob',
      items: [
        {
          icon: ClipboardList,
          label: 'Buyurtmalar tarixi',
          onSelect: () => navigate('/app/orders'),
        },
        { icon: Bell, label: 'Bildirishnomalar', hint: 'Yoqilgan' },
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
  ];

  return (
    <ScreenShell
      header={<Header variant="inner" title="Profil" />}
      footer={<AppTabBar active="profile" />}
    >
      {/*
        Foydalanuvchi bloki chapga tekislangan: markazlashgan katta avatar
        ekranning yarmini boʻsh qoldirardi. Raqam maskalanmaydi — bu
        foydalanuvchining OʻZ profili, oʻz raqamini yashirishning maʼnosi yoʻq.
      */}
      <div className="mt-8 flex items-center gap-16">
        <Avatar size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-h3 text-text-primary">{formatPhone(phoneNumber)}</p>
          <p className="mt-2 text-body-sm text-text-secondary">Hizmat24 mijozi</p>
        </div>
      </div>

      {sections.map((section) => (
        <MenuGroup key={section.title} section={section} />
      ))}

      <div className="mt-24">
        <Button variant="ghost" onClick={() => setLogoutOpen(true)}>
          Chiqish
        </Button>
      </div>

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

/** 27 · Usta profili — read-only. */
export function MasterProfile() {
  const navigate = useNavigate();
  const { masterId } = useParams<{ masterId: string }>();
  const { activeOrder } = useApp();

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
          {canCall ? (
            <a
              href={`tel:${master.phoneNumber}`}
              className="flex h-[52px] w-full items-center justify-center rounded-md bg-primary px-20 text-button text-on-primary"
            >
              Qoʻngʻiroq qilish
            </a>
          ) : (
            <div className="flex flex-col gap-12">
              <p className="text-center text-body-sm text-text-secondary">
                Ish yakunlangan — savol boʻlsa qoʻllab-quvvatlash xizmatiga murojaat
                qiling
              </p>
              <Button variant="ghost" onClick={() => navigate('/app/support')}>
                Qoʻllab-quvvatlashga murojaat
              </Button>
            </div>
          )}
        </StickyFooter>
      }
    >
      <div className="mt-16 flex flex-col items-center">
        {/* 120px avatar ekranning uchdan birini egallardi — 80px hero blokni
            ixchamlashtiradi va ostidagi maʼlumotga joy ochadi. */}
        <Avatar name={master.fullName} size={80} />
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
