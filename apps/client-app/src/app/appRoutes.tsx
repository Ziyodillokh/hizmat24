import type { ReactNode } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from './store';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { HomeTab } from './screens/HomeTab';
import { AllServicesTab, GroupServicesTab } from './screens/CatalogScreens';
import { AddressStep } from './screens/order/AddressStep';
import { ConfirmStep } from './screens/order/ConfirmStep';
import { OrderDetailsStep } from './screens/order/OrderDetailsStep';
import { SavedAddressStep } from './screens/order/SavedAddressStep';
import { ScheduleStep } from './screens/ScheduleStep';
import { PaymentStep } from './screens/PaymentStep';
import { PaymentReceipt } from './screens/PaymentReceipt';
import { MasterEnRouteScreen } from './screens/MasterEnRoute';
import { WorkProofScreen } from './screens/WorkProof';
import { OrderTracking } from './screens/OrderTracking';
import { ConfirmMasterFlow, SafetyAlertResult } from './screens/SafetyFlow';
import { RateOrderScreen, ReceiptScreen } from './screens/RateAndReceipt';
import { NotificationsTab, ProfileTab } from './screens/Tabs';
import { OrdersTab } from './screens/OrdersTab';
import { MasterProfile } from './screens/MasterProfile';
import { WalletTab } from './screens/WalletTab';
import { WalletBonus } from './screens/WalletBonus';
import { WalletHistory } from './screens/WalletHistory';
import { AiAssistantScreen } from './screens/AiAssistant';
import { SupportScreen } from '@/screens/stage5/SupportScreen';
import { ProblemReportScreen } from './screens/ProblemReport';
import { DisputeDetailScreen } from './screens/DisputeDetail';
import { DisputeListScreen } from './screens/DisputeList';
import { GuaranteeScreen } from './screens/Guarantee';
import { ReviewsScreen } from './screens/Reviews';
import { AddressBookScreen } from './screens/AddressBook';
import { AddressFormScreen } from './screens/AddressForm';
import { FavoritesScreen } from './screens/Favorites';
import { ProfileEditScreen } from './screens/ProfileEdit';
import { MasterSetupScreen } from './screens/MasterSetup';
import { MasterSettingsScreen } from './screens/MasterSettings';
import { MasterApplyScreen } from './screens/MasterApply';
import { ServiceDetailScreen } from './screens/ServiceDetail';
import { MasterServicesScreen } from './screens/master/MasterServicesScreen';
import { ModeScreen } from './screens/ModeScreen';
import { MasterFinishScreen } from './screens/master/MasterFinishScreen';
import { MasterJobScreen } from './screens/master/MasterJobScreen';
import { MasterJobsTab } from './screens/master/MasterJobsTab';
import { MasterHistoryTab } from './screens/master/MasterHistoryTab';
import { MasterEarningsTab } from './screens/master/MasterEarningsTab';
import { MasterProfileTab } from './screens/master/MasterProfileTab';
import { MasterLimitsScreen } from './screens/master/MasterLimitsScreen';
import type { UserRole } from './types';

/**
 * `SupportScreen` preview galereyasida ham ishlatiladi va u yerda marshrut
 * yoʻq, shuning uchun orqaga qaytish shu oʻramchida beriladi.
 */
function SupportRoute() {
  const navigate = useNavigate();
  // `location.state` EMAS: u sahifa qayta yuklanganda va Capacitor sovuq
  // startida yoʻqoladi, qidiruv parametri esa URL da qoladi.
  const [params] = useSearchParams();
  const { findOrder } = useApp();

  const orderId = params.get('order');
  const order = orderId ? findOrder(orderId) : undefined;

  return (
    <SupportScreen
      orderShortId={order?.shortId}
      onBack={() => navigate(-1)}
      onDisputes={() => navigate('/app/disputes')}
    />
  );
}

/**
 * Himoyalangan marshrutlar jadvali.
 *
 * `AppRouter` dan AJRATILDI: har marshrut JSX da sakkiz satr edi va fayl
 * 500 satrdan oshdi. Jadval shaklida bitta marshrut — bitta satr, va
 * tartib qoidalari izohda oʻqiladi.
 *
 * TARTIB MUHIM: statik segment dinamikdan OLDIN turadi (`addresses/new` →
 * `addresses/:addressId`). Router aniqroq marshrutni oʻzi tanlaydi, lekin
 * jadvalni oʻqiydigan odam uchun tartib hujjat.
 *
 * `role` — rejim gvardiyasi. Berilgan boʻlsa, marshrut faqat oʻsha rejimda
 * ochiladi; `/app/mode` esa gvardiyasiz qoladi VA HECH QACHON gvardiya
 * olmaydi — gvardiya oʻzi tushiradigan sahifani qoʻriqlasa, ikki ekran
 * bir-birini cheksiz yoʻnaltiradi.
 */
export interface AppRoute {
  path: string;
  element: ReactNode;
  role?: UserRole;
}

export const PROTECTED_ROUTES: AppRoute[] = [
  // Kirish
  { path: 'onboarding', element: <OnboardingScreen /> },

  // Bosh sahifa, katalog, usta profili
  { path: 'home', element: <HomeTab /> },
  { path: 'groups/:groupId', element: <GroupServicesTab /> },
  { path: 'services', element: <AllServicesTab /> },
  // Xizmat kartasi — buyurtma berishdan OLDIN koʻriladi.
  { path: 'services/:categoryId', element: <ServiceDetailScreen /> },
  { path: 'masters/:masterId', element: <MasterProfile /> },

  // Buyurtma berish oqimi
  { path: 'new/details', element: <OrderDetailsStep /> },
  { path: 'new/address', element: <SavedAddressStep /> },
  { path: 'new/address/new', element: <AddressStep /> },
  { path: 'new/schedule', element: <ScheduleStep /> },
  { path: 'new/payment', element: <PaymentStep /> },
  { path: 'new/confirm', element: <ConfirmStep /> },

  // Buyurtma kuzatuvi
  { path: 'order/:orderId', element: <OrderTracking /> },
  { path: 'order/:orderId/confirm-master', element: <ConfirmMasterFlow /> },
  { path: 'order/:orderId/safety', element: <SafetyAlertResult /> },
  { path: 'order/:orderId/rate', element: <RateOrderScreen /> },
  { path: 'order/:orderId/receipt', element: <ReceiptScreen /> },
  { path: 'order/:orderId/payment-receipt', element: <PaymentReceipt /> },
  { path: 'order/:orderId/map', element: <MasterEnRouteScreen /> },
  { path: 'order/:orderId/proof', element: <WorkProofScreen /> },
  { path: 'order/:orderId/dispute', element: <ProblemReportScreen /> },
  { path: 'orders', element: <OrdersTab /> },

  // Karta
  { path: 'wallet', element: <WalletTab /> },
  { path: 'wallet/bonus', element: <WalletBonus /> },
  { path: 'wallet/history', element: <WalletHistory /> },

  // AI yordamchi va bildirishnomalar
  { path: 'ai', element: <AiAssistantScreen /> },
  { path: 'notifications', element: <NotificationsTab /> },

  // Profil va shaxsiy boʻlim
  { path: 'profile', element: <ProfileTab /> },
  { path: 'profile/edit', element: <ProfileEditScreen /> },
  { path: 'addresses', element: <AddressBookScreen /> },
  { path: 'addresses/new', element: <AddressFormScreen /> },
  { path: 'addresses/:addressId', element: <AddressFormScreen /> },
  { path: 'favorites', element: <FavoritesScreen /> },

  // Yordam
  { path: 'support', element: <SupportRoute /> },
  { path: 'disputes', element: <DisputeListScreen /> },
  { path: 'disputes/:disputeId', element: <DisputeDetailScreen /> },
  { path: 'guarantee', element: <GuaranteeScreen /> },
  { path: 'reviews', element: <ReviewsScreen /> },

  // Rejim tanlash — gvardiyasiz (1.2-jadval)
  { path: 'mode', element: <ModeScreen /> },

  // Usta rejimi — toʻrt tab, oʻz pastki paneli bilan
  { path: 'master', element: <Navigate to="/app/master/jobs" replace />, role: 'master' },
  { path: 'master/jobs', element: <MasterJobsTab />, role: 'master' },
  { path: 'master/jobs/:orderId', element: <MasterJobScreen />, role: 'master' },
  { path: 'master/jobs/:orderId/finish', element: <MasterFinishScreen />, role: 'master' },
  { path: 'master/history', element: <MasterHistoryTab />, role: 'master' },
  { path: 'master/earnings', element: <MasterEarningsTab />, role: 'master' },
  { path: 'master/profile', element: <MasterProfileTab />, role: 'master' },
  { path: 'master/limits', element: <MasterLimitsScreen />, role: 'master' },
  { path: 'master/setup', element: <MasterSetupScreen />, role: 'master' },
  { path: 'master/settings', element: <MasterSettingsScreen />, role: 'master' },
  { path: 'master/apply', element: <MasterApplyScreen />, role: 'master' },
  { path: 'master/services', element: <MasterServicesScreen />, role: 'master' },
];
