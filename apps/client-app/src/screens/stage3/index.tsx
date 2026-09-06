import { registerScreens, type ScreenEntry } from '@/preview/registry';
import { SearchingScreen } from './SearchingScreen';
import { QueuedScreen } from './QueuedScreen';
import { EnRouteScreen } from './EnRouteScreen';
import { ConfirmMasterScreen } from './ConfirmMasterScreen';
import { SafetyConfirmModal } from './SafetyConfirmModal';
import { InProgressScreen } from './InProgressScreen';
import { RateWorkScreen } from './RateWorkScreen';
import { ReceiptScreen } from './ReceiptScreen';
import { SafetyAlertScreen } from './SafetyAlertScreen';
import { OrderCancelledScreen } from './OrderCancelledScreen';

/** Bosqich 3 — buyurtma holatlari (13-bo'lim). */
const STAGE_3: ScreenEntry[] = [
  { id: '12', name: 'Usta qidirilmoqda', stage: 3, component: SearchingScreen },
  { id: '12', name: 'Usta qidirilmoqda', stage: 3, variant: 'Operator',
    component: () => <SearchingScreen variant="operator" /> },
  { id: '12', name: 'Usta qidirilmoqda', stage: 3, variant: 'Boshqa usta',
    component: () => <SearchingScreen variant="other-master" /> },

  { id: '13', name: 'Siz navbatdasiz', stage: 3, component: QueuedScreen },
  { id: '13', name: 'Siz navbatdasiz', stage: 3, variant: 'Hisoblanmoqda',
    component: () => <QueuedScreen variant="no-estimate" /> },
  { id: '13', name: 'Siz navbatdasiz', stage: 3, variant: 'Operator',
    component: () => <QueuedScreen variant="operator" /> },
  { id: '13', name: 'Siz navbatdasiz', stage: 3, variant: 'Offline',
    component: () => <QueuedScreen variant="offline" /> },

  { id: '15', name: "Usta yo'lda", stage: 3, component: EnRouteScreen },
  { id: '15', name: "Usta yo'lda", stage: 3, variant: 'Vaqtsiz',
    component: () => <EnRouteScreen variant="no-eta" /> },
  { id: '15', name: "Usta yo'lda", stage: 3, variant: 'Offline',
    component: () => <EnRouteScreen variant="offline" /> },

  { id: '16', name: 'Ustani tasdiqlang', stage: 3, component: ConfirmMasterScreen },
  { id: '16', name: 'Ustani tasdiqlang', stage: 3, variant: 'Tasdiqlanmoqda',
    component: () => <ConfirmMasterScreen variant="confirming" /> },

  { id: '17', name: "Xavfsizlik tasdig'i", stage: 3, component: SafetyConfirmModal },
  { id: '17', name: "Xavfsizlik tasdig'i", stage: 3, variant: 'Yuborilmoqda',
    component: () => <SafetyConfirmModal variant="submitting" /> },

  { id: '18', name: 'Ish jarayonida', stage: 3, component: InProgressScreen },
  { id: '18', name: 'Ish jarayonida', stage: 3, variant: 'Offline',
    component: () => <InProgressScreen variant="offline" /> },

  { id: '19', name: 'Ishni baholang', stage: 3, component: RateWorkScreen },
  { id: '19', name: 'Ishni baholang', stage: 3, variant: 'Baholanmagan',
    component: () => <RateWorkScreen variant="empty" /> },
  { id: '19', name: 'Ishni baholang', stage: 3, variant: 'Yuborilmoqda',
    component: () => <RateWorkScreen variant="submitting" /> },
  { id: '19', name: 'Ishni baholang', stage: 3, variant: 'Xato',
    component: () => <RateWorkScreen variant="error" /> },

  { id: '20', name: 'Chek', stage: 3, component: ReceiptScreen },
  { id: '20', name: 'Chek', stage: 3, variant: "Ma'lumot yetishmaydi",
    component: () => <ReceiptScreen variant="partial" /> },
  { id: '20', name: 'Chek', stage: 3, variant: 'Skeleton',
    component: () => <ReceiptScreen variant="loading" /> },

  { id: '21', name: 'Xavfsizlik signali', stage: 3, component: SafetyAlertScreen },

  { id: '22', name: 'Buyurtma bekor qilindi', stage: 3, component: OrderCancelledScreen },
  { id: '22', name: 'Buyurtma bekor qilindi', stage: 3, variant: 'Usta bekor qildi',
    component: () => <OrderCancelledScreen cancelledBy="MASTER" /> },
  { id: '22', name: 'Buyurtma bekor qilindi', stage: 3, variant: 'Tizim bekor qildi',
    component: () => <OrderCancelledScreen cancelledBy="SYSTEM" /> },
];

export function registerStage3(): void {
  registerScreens(STAGE_3);
}
