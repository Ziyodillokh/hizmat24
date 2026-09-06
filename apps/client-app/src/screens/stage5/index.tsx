import { registerScreens, type ScreenEntry } from '@/preview/registry';
import { CancelReasonSheet } from './CancelReasonSheet';
import { CancelBlockedModal } from './CancelBlockedModal';
import { SupportScreen } from './SupportScreen';
import { PermissionScreen } from './PermissionScreen';
import { StatePatternsScreen } from './StatePatternsScreen';

/** Bosqich 5 — holatlar, modallar, ruxsatlar (13-bo'lim). */
const STAGE_5: ScreenEntry[] = [
  { id: '28', name: 'Bekor qilish sababi', stage: 5, component: CancelReasonSheet },
  { id: '28', name: 'Bekor qilish sababi', stage: 5, variant: 'Sabab tanlanmagan',
    component: () => <CancelReasonSheet variant="empty" /> },
  { id: '28', name: 'Bekor qilish sababi', stage: 5, variant: 'Boshqa sabab — qisqa',
    component: () => <CancelReasonSheet variant="other-short" /> },
  { id: '28', name: 'Bekor qilish sababi', stage: 5, variant: 'Yuborilmoqda',
    component: () => <CancelReasonSheet variant="submitting" /> },
  { id: '28', name: 'Bekor qilish sababi', stage: 5, variant: 'Tasdiqlash',
    component: () => <CancelReasonSheet variant="confirm" /> },

  { id: '29', name: "Bekor qilib bo'lmaydi", stage: 5, component: CancelBlockedModal },

  { id: '30', name: "Qo'llab-quvvatlash xizmati", stage: 5, component: SupportScreen },
  { id: '30', name: "Qo'llab-quvvatlash xizmati", stage: 5, variant: 'Buyurtmadan',
    component: () => <SupportScreen variant="with-order" /> },

  { id: '31', name: 'Joylashuvga ruxsat', stage: 5, component: PermissionScreen },
  { id: '31', name: 'Joylashuvga ruxsat', stage: 5, variant: 'Rad etilgan',
    component: () => <PermissionScreen kind="location" denied /> },
  { id: '31', name: 'Bildirishnomalarga ruxsat', stage: 5,
    component: () => <PermissionScreen kind="notifications" /> },
  { id: '31', name: 'Bildirishnomalarga ruxsat', stage: 5, variant: 'Rad etilgan',
    component: () => <PermissionScreen kind="notifications" denied /> },

  { id: "12-bo'lim", name: 'Holat naqshlari', stage: 5, component: StatePatternsScreen },
];

export function registerStage5(): void {
  registerScreens(STAGE_5);
}
