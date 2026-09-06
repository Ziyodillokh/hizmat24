import { registerScreens, type ScreenEntry } from '@/preview/registry';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { HomeScreen } from './HomeScreen';
import { GroupServicesScreen } from './GroupServicesScreen';
import { AllServicesScreen } from './AllServicesScreen';
import { CreateOrderScreen } from './CreateOrderScreen';
import { MasterFoundScreen } from './MasterFoundScreen';

/**
 * Bosqich 1 ekranlari (13-boʻlim).
 * Har bir holat varianti alohida yozuv sifatida roʻyxatdan oʻtadi — 7-boʻlimga
 * koʻra ular alohida frame boʻlishi kerak.
 */
const STAGE_1: ScreenEntry[] = [
  { id: '06', name: 'Bosh sahifa', stage: 1, component: HomeScreen },
  {
    id: '06', name: 'Bosh sahifa', stage: 1, variant: 'Navbatdasiz',
    component: () => <HomeScreen activeStatus={ORDER_STATUS.SEARCHING_QUEUED} />,
  },
  {
    id: '06', name: 'Bosh sahifa', stage: 1, variant: 'Baholang',
    component: () => <HomeScreen activeStatus={ORDER_STATUS.COMPLETED_BY_MASTER} />,
  },
  {
    id: '06', name: 'Bosh sahifa', stage: 1, variant: 'Aktiv buyurtmasiz',
    component: () => <HomeScreen variant="no-active-order" />,
  },
  {
    id: '06', name: 'Bosh sahifa', stage: 1, variant: "Boʻsh",
    component: () => <HomeScreen variant="no-orders" />,
  },
  {
    id: '06', name: 'Bosh sahifa', stage: 1, variant: 'Skeleton',
    component: () => <HomeScreen variant="loading" />,
  },

  { id: '07a', name: 'Guruh xizmatlari', stage: 1, component: GroupServicesScreen },
  {
    id: '07a', name: 'Guruh xizmatlari', stage: 1, variant: 'Skeleton',
    component: () => <GroupServicesScreen loading />,
  },

  { id: '07', name: 'Barcha xizmatlar', stage: 1, component: AllServicesScreen },
  {
    id: '07', name: 'Barcha xizmatlar', stage: 1, variant: "Natija yoʻq",
    component: () => <AllServicesScreen initialState="no-results" />,
  },
  {
    id: '07', name: 'Barcha xizmatlar', stage: 1, variant: 'Skeleton',
    component: () => <AllServicesScreen initialState="loading" />,
  },

  { id: '08', name: 'Buyurtma berish', stage: 1, component: CreateOrderScreen },
  {
    id: '08', name: 'Buyurtma berish', stage: 1, variant: "Boʻsh",
    component: () => <CreateOrderScreen variant="empty" />,
  },
  {
    id: '08', name: 'Buyurtma berish', stage: 1, variant: 'Qisqa tavsif',
    component: () => <CreateOrderScreen variant="too-short" />,
  },
  {
    id: '08', name: 'Buyurtma berish', stage: 1, variant: 'Maksimum',
    component: () => <CreateOrderScreen variant="max" />,
  },
  {
    id: '08', name: 'Buyurtma berish', stage: 1, variant: 'Biriktirma bloki',
    component: () => <CreateOrderScreen variant="with-attachments" />,
  },

  { id: '14', name: 'Usta topildi', stage: 1, component: MasterFoundScreen },
  {
    id: '14', name: 'Usta topildi', stage: 1, variant: 'Vaqtsiz',
    component: () => <MasterFoundScreen variant="no-eta" />,
  },
];

export function registerStage1(): void {
  registerScreens(STAGE_1);
}
