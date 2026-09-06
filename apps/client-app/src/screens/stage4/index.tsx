import { registerScreens, type ScreenEntry } from '@/preview/registry';
import { OrderDetailScreen } from './OrderDetailScreen';
import { MyOrdersScreen } from './MyOrdersScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { ProfileScreen } from './ProfileScreen';
import { MasterProfileScreen } from './MasterProfileScreen';

/** Bosqich 4 — tablar va tafsilot (13-boʻlim). */
const STAGE_4: ScreenEntry[] = [
  { id: '23', name: 'Buyurtma tafsiloti', stage: 4, variant: "Usta yoʻlda",
    component: OrderDetailScreen },
  { id: '23', name: 'Buyurtma tafsiloti', stage: 4, variant: 'Yakunlangan',
    component: () => <OrderDetailScreen variant="rated" /> },
  { id: '23', name: 'Buyurtma tafsiloti', stage: 4, variant: 'Bekor qilingan',
    component: () => <OrderDetailScreen variant="cancelled" /> },
  { id: '23', name: 'Buyurtma tafsiloti', stage: 4, variant: 'Xavfsizlik tekshiruvida',
    component: () => <OrderDetailScreen variant="flagged" /> },
  { id: '23', name: 'Buyurtma tafsiloti', stage: 4, variant: 'Skeleton',
    component: () => <OrderDetailScreen variant="loading" /> },
  { id: '23', name: 'Buyurtma tafsiloti', stage: 4, variant: 'Topilmadi',
    component: () => <OrderDetailScreen variant="missing" /> },

  { id: '24', name: 'Buyurtmalarim', stage: 4, component: MyOrdersScreen },
  { id: '24', name: 'Buyurtmalarim', stage: 4, variant: 'Aktiv filtri',
    component: () => <MyOrdersScreen initialFilter="active" /> },
  { id: '24', name: 'Buyurtmalarim', stage: 4, variant: 'Skeleton',
    component: () => <MyOrdersScreen variant="loading" /> },
  { id: '24', name: 'Buyurtmalarim', stage: 4, variant: "Koʻproq yuklanmoqda",
    component: () => <MyOrdersScreen variant="loading-more" /> },
  { id: '24', name: 'Buyurtmalarim', stage: 4, variant: "Boʻsh",
    component: () => <MyOrdersScreen variant="empty" /> },
  { id: '24', name: 'Buyurtmalarim', stage: 4, variant: 'Offline',
    component: () => <MyOrdersScreen variant="offline" /> },

  { id: '25', name: 'Bildirishnomalar', stage: 4, component: NotificationsScreen },
  { id: '25', name: 'Bildirishnomalar', stage: 4, variant: "Hammasi oʻqilgan",
    component: () => <NotificationsScreen variant="all-read" /> },
  { id: '25', name: 'Bildirishnomalar', stage: 4, variant: "Boʻsh",
    component: () => <NotificationsScreen variant="empty" /> },
  { id: '25', name: 'Bildirishnomalar', stage: 4, variant: 'Skeleton',
    component: () => <NotificationsScreen variant="loading" /> },

  { id: '26', name: 'Profil', stage: 4, component: ProfileScreen },
  { id: '26', name: 'Profil', stage: 4, variant: 'Ismsiz',
    component: () => <ProfileScreen variant="without-name" /> },
  { id: '26', name: 'Profil', stage: 4, variant: "Chiqish tasdigʻi",
    component: () => <ProfileScreen variant="logout-confirm" /> },

  { id: '27', name: 'Usta profili', stage: 4, component: MasterProfileScreen },
  { id: '27', name: 'Usta profili', stage: 4, variant: 'Telefonsiz',
    component: () => <MasterProfileScreen variant="without-phone" /> },
  { id: '27', name: 'Usta profili', stage: 4, variant: 'Skeleton',
    component: () => <MasterProfileScreen variant="loading" /> },
];

export function registerStage4(): void {
  registerScreens(STAGE_4);
}
