import { registerScreens, type ScreenEntry } from '@/preview/registry';
import { SessionRestoreScreen } from './SessionRestoreScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { PhoneNumberScreen } from './PhoneNumberScreen';
import { OtpScreen } from './OtpScreen';
import { BlockedAccountScreen } from './BlockedAccountScreen';
import { MapPickerScreen } from './MapPickerScreen';
import { AddressDetailsScreen } from './AddressDetailsScreen';
import { ConfirmOrderScreen } from './ConfirmOrderScreen';

/** Bosqich 2 — kirish va manzil oqimi (13-boʻlim). */
const STAGE_2: ScreenEntry[] = [
  { id: '01', name: 'Sessiyani tiklash', stage: 2, component: SessionRestoreScreen },

  { id: '02', name: 'Kirish taklifi', stage: 2, component: OnboardingScreen },
  { id: '02', name: 'Kirish taklifi', stage: 2, variant: 'Skeleton',
    component: () => <OnboardingScreen variant="loading" /> },
  { id: '02', name: 'Kirish taklifi', stage: 2, variant: 'Offline',
    component: () => <OnboardingScreen variant="error" /> },

  { id: '03', name: 'Telefon raqami', stage: 2, component: PhoneNumberScreen },
  { id: '03', name: 'Telefon raqami', stage: 2, variant: "Toʻldirilgan",
    component: () => <PhoneNumberScreen variant="filled" /> },
  { id: '03', name: 'Telefon raqami', stage: 2, variant: 'Xato',
    component: () => <PhoneNumberScreen variant="error" /> },
  { id: '03', name: 'Telefon raqami', stage: 2, variant: 'Yuborilmoqda',
    component: () => <PhoneNumberScreen variant="submitting" /> },

  { id: '04', name: 'Tasdiqlash kodi', stage: 2, component: OtpScreen },
  { id: '04', name: 'Tasdiqlash kodi', stage: 2, variant: 'Yuborilmoqda',
    component: () => <OtpScreen variant="submitting" /> },
  { id: '04', name: 'Tasdiqlash kodi', stage: 2, variant: "Kod notoʻgʻri",
    component: () => <OtpScreen variant="invalid" /> },
  { id: '04', name: 'Tasdiqlash kodi', stage: 2, variant: 'Muddati tugagan',
    component: () => <OtpScreen variant="expired" /> },
  { id: '04', name: 'Tasdiqlash kodi', stage: 2, variant: 'Urinishlar tugadi',
    component: () => <OtpScreen variant="attempts-exhausted" /> },
  { id: '04', name: 'Tasdiqlash kodi', stage: 2, variant: "Juda koʻp urinish",
    component: () => <OtpScreen variant="too-many-attempts" /> },
  { id: '04', name: 'Tasdiqlash kodi', stage: 2, variant: 'SMS yuborilmadi',
    component: () => <OtpScreen variant="sms-failed" /> },
  { id: '04', name: 'Tasdiqlash kodi', stage: 2, variant: 'Taymer tugagan',
    component: () => <OtpScreen variant="timer-done" /> },

  { id: '05', name: 'Hisob bloklangan', stage: 2, component: BlockedAccountScreen },

  { id: '09', name: 'Manzilni tanlang', stage: 2, component: MapPickerScreen },
  { id: '09', name: 'Manzilni tanlang', stage: 2, variant: 'Xarita yuklanmoqda',
    component: () => <MapPickerScreen variant="map-loading" /> },
  { id: '09', name: 'Manzilni tanlang', stage: 2, variant: 'Manzil aniqlanmoqda',
    component: () => <MapPickerScreen variant="address-loading" /> },
  { id: '09', name: 'Manzilni tanlang', stage: 2, variant: "Ruxsat yoʻq",
    component: () => <MapPickerScreen variant="no-permission" /> },
  { id: '09', name: 'Manzilni tanlang', stage: 2, variant: 'Xato',
    component: () => <MapPickerScreen variant="error" /> },

  { id: '10', name: 'Manzil tafsilotlari', stage: 2, component: AddressDetailsScreen },
  { id: '10', name: 'Manzil tafsilotlari', stage: 2, variant: "Boʻsh",
    component: () => <AddressDetailsScreen variant="empty" /> },
  { id: '10', name: 'Manzil tafsilotlari', stage: 2, variant: 'Qisqa manzil',
    component: () => <AddressDetailsScreen variant="short-address" /> },

  { id: '11', name: 'Buyurtmani tasdiqlash', stage: 2, component: ConfirmOrderScreen },
  { id: '11', name: 'Buyurtmani tasdiqlash', stage: 2, variant: 'Yuborilmoqda',
    component: () => <ConfirmOrderScreen variant="submitting" /> },
  { id: '11', name: 'Buyurtmani tasdiqlash', stage: 2, variant: 'Server xatosi',
    component: () => <ConfirmOrderScreen variant="server-error" /> },
  { id: '11', name: 'Buyurtmani tasdiqlash', stage: 2, variant: "Juda koʻp urinish",
    component: () => <ConfirmOrderScreen variant="rate-limited" /> },
  { id: '11', name: 'Buyurtmani tasdiqlash', stage: 2, variant: 'Javob bermadi',
    component: () => <ConfirmOrderScreen variant="timeout" /> },
];

export function registerStage2(): void {
  registerScreens(STAGE_2);
}
