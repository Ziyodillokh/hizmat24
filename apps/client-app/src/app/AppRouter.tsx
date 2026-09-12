import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DeviceView } from '@/preview/DeviceView';
import { AppLaunch } from './AppLaunch';
import { PageTransition } from './PageTransition';
import { ToastHost } from './ToastHost';
import { useBackButton } from './useBackButton';
import { syncStatusBar } from './native';
import { ThemeProvider, useTheme } from './theme-context';
import { AppProvider, useApp } from './store';
import { ChatProvider } from './chat-store';
import { DisputeProvider } from './dispute-store';
import { AddressProvider } from './address-store';
import { FavoritesProvider } from './favorites-store';
import { LoginScreen } from './screens/LoginScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { OtpScreen } from './screens/OtpScreen';
import { HomeTab } from './screens/HomeTab';
import { AllServicesTab, GroupServicesTab } from './screens/CatalogScreens';
import {
  AddressStep,
  ConfirmStep,
  OrderDetailsStep,
  SavedAddressStep,
} from './screens/CreateOrderScreens';
import { ScheduleStep } from './screens/ScheduleStep';
import { PaymentStep } from './screens/PaymentStep';
import { PaymentReceipt } from './screens/PaymentReceipt';
import { MasterEnRouteScreen } from './screens/MasterEnRoute';
import { WorkProofScreen } from './screens/WorkProof';
import { OrderTracking } from './screens/OrderTracking';
import { ConfirmMasterFlow, SafetyAlertResult } from './screens/SafetyFlow';
import { RateOrderScreen, ReceiptScreen } from './screens/RateAndReceipt';
import { NotificationsTab, OrdersTab, ProfileTab } from './screens/Tabs';
import { MasterProfile } from './screens/MasterProfile';
import { MarketTab } from './screens/MarketTab';
import { ProductDetail } from './screens/ProductDetail';
import { ShopDetail } from './screens/ShopDetail';
import { MastersTab } from './screens/MastersTab';
import { WalletTab } from './screens/WalletTab';
import { WalletBonus } from './screens/WalletBonus';
import { WalletHistory } from './screens/WalletHistory';
import { AiAssistantScreen } from './screens/AiAssistant';
import { ChatListScreen } from './screens/ChatList';
import { ChatThreadScreen } from './screens/ChatThread';
import { SupportScreen } from '@/screens/stage5/SupportScreen';
import { ProblemReportScreen } from './screens/ProblemReport';
import { DisputeDetailScreen } from './screens/DisputeDetail';
import { DisputeListScreen } from './screens/DisputeList';
import { GuaranteeScreen } from './screens/Guarantee';
import { AddressBookScreen } from './screens/AddressBook';
import { AddressFormScreen } from './screens/AddressForm';
import { FavoritesScreen } from './screens/Favorites';
import { ProfileEditScreen } from './screens/ProfileEdit';

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

/** Login qilmagan foydalanuvchini kirish oqimiga qaytaradi (1-boʻlim, 14-qoida). */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? <>{children}</> : <Navigate to="/app" replace />;
}

/** Yangi ekranga oʻtganda scroll tepaga qaytadi — haqiqiy ilovadagidek. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.querySelector('[data-app-scroll]')?.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { isAuthenticated, hasOnboarded } = useApp();
  useBackButton();

  return (
    <>
      <ScrollToTop />
      <PageTransition>
        <Routes>
          {/*
            Kirmagan foydalanuvchi — kirish ekrani. Kirgan, lekin tanishtiruvni
            koʻrmagan boʻlsa — tanishtiruv; aks holda bosh sahifa.
          */}
          <Route
            index
            element={
              !isAuthenticated ? (
                <LoginScreen />
              ) : hasOnboarded ? (
                <Navigate to="/app/home" replace />
              ) : (
                <Navigate to="/app/onboarding" replace />
              )
            }
          />
          <Route path="auth/otp" element={<OtpScreen />} />
          <Route
            path="onboarding"
            element={
              <RequireAuth>
                <OnboardingScreen />
              </RequireAuth>
            }
          />

          <Route
            path="home"
            element={
              <RequireAuth>
                <HomeTab />
              </RequireAuth>
            }
          />
          <Route
            path="groups/:groupId"
            element={
              <RequireAuth>
                <GroupServicesTab />
              </RequireAuth>
            }
          />
          <Route
            path="services"
            element={
              <RequireAuth>
                <AllServicesTab />
              </RequireAuth>
            }
          />

          <Route
            path="new/details"
            element={
              <RequireAuth>
                <OrderDetailsStep />
              </RequireAuth>
            }
          />
          {/* Saqlangan manzil tanlash — roʻyxat boʻsh boʻlsa oʻzi formaga
              yoʻnaltiradi, boʻsh oraliq ekran koʻrsatilmaydi. */}
          <Route
            path="new/address"
            element={
              <RequireAuth>
                <SavedAddressStep />
              </RequireAuth>
            }
          />
          <Route
            path="new/address/new"
            element={
              <RequireAuth>
                <AddressStep />
              </RequireAuth>
            }
          />
          <Route
            path="new/schedule"
            element={
              <RequireAuth>
                <ScheduleStep />
              </RequireAuth>
            }
          />
          <Route
            path="new/payment"
            element={
              <RequireAuth>
                <PaymentStep />
              </RequireAuth>
            }
          />
          <Route
            path="new/confirm"
            element={
              <RequireAuth>
                <ConfirmStep />
              </RequireAuth>
            }
          />

          <Route
            path="order/:orderId"
            element={
              <RequireAuth>
                <OrderTracking />
              </RequireAuth>
            }
          />
          <Route
            path="order/:orderId/confirm-master"
            element={
              <RequireAuth>
                <ConfirmMasterFlow />
              </RequireAuth>
            }
          />
          <Route
            path="order/:orderId/safety"
            element={
              <RequireAuth>
                <SafetyAlertResult />
              </RequireAuth>
            }
          />
          <Route
            path="order/:orderId/rate"
            element={
              <RequireAuth>
                <RateOrderScreen />
              </RequireAuth>
            }
          />
          <Route
            path="order/:orderId/receipt"
            element={
              <RequireAuth>
                <ReceiptScreen />
              </RequireAuth>
            }
          />
          <Route
            path="order/:orderId/payment-receipt"
            element={
              <RequireAuth>
                <PaymentReceipt />
              </RequireAuth>
            }
          />
          <Route
            path="order/:orderId/map"
            element={
              <RequireAuth>
                <MasterEnRouteScreen />
              </RequireAuth>
            }
          />
          <Route
            path="order/:orderId/proof"
            element={
              <RequireAuth>
                <WorkProofScreen />
              </RequireAuth>
            }
          />
          <Route
            path="order/:orderId/dispute"
            element={
              <RequireAuth>
                <ProblemReportScreen />
              </RequireAuth>
            }
          />

          <Route
            path="orders"
            element={
              <RequireAuth>
                <OrdersTab />
              </RequireAuth>
            }
          />
          <Route
            path="wallet"
            element={
              <RequireAuth>
                <WalletTab />
              </RequireAuth>
            }
          />
          <Route
            path="wallet/bonus"
            element={
              <RequireAuth>
                <WalletBonus />
              </RequireAuth>
            }
          />
          <Route
            path="wallet/history"
            element={
              <RequireAuth>
                <WalletHistory />
              </RequireAuth>
            }
          />
          <Route
            path="market"
            element={
              <RequireAuth>
                <MarketTab />
              </RequireAuth>
            }
          />
          <Route
            path="market/:shopId"
            element={
              <RequireAuth>
                <ShopDetail />
              </RequireAuth>
            }
          />
          <Route
            path="market/:shopId/:productId"
            element={
              <RequireAuth>
                <ProductDetail />
              </RequireAuth>
            }
          />
          <Route
            path="masters"
            element={
              <RequireAuth>
                <MastersTab />
              </RequireAuth>
            }
          />
          <Route
            path="chat"
            element={
              <RequireAuth>
                <ChatListScreen />
              </RequireAuth>
            }
          />
          {/* `ai` statik segment `:threadId` dan ustun — Router aniqroq
              marshrutni oʻzi tanlaydi, tartibga bogʻliq emas. */}
          <Route
            path="chat/ai"
            element={
              <RequireAuth>
                <AiAssistantScreen />
              </RequireAuth>
            }
          />
          <Route
            path="chat/:threadId"
            element={
              <RequireAuth>
                <ChatThreadScreen />
              </RequireAuth>
            }
          />
          <Route
            path="notifications"
            element={
              <RequireAuth>
                <NotificationsTab />
              </RequireAuth>
            }
          />
          <Route
            path="profile"
            element={
              <RequireAuth>
                <ProfileTab />
              </RequireAuth>
            }
          />
          <Route
            path="master/:masterId"
            element={
              <RequireAuth>
                <MasterProfile />
              </RequireAuth>
            }
          />
          <Route
            path="support"
            element={
              <RequireAuth>
                <SupportRoute />
              </RequireAuth>
            }
          />
          {/* Statik `disputes` va dinamik `disputes/:disputeId` toʻqnashmaydi —
              Router aniqroq marshrutni oʻzi tanlaydi (`chat/ai` bilan bir xil). */}
          <Route
            path="disputes"
            element={
              <RequireAuth>
                <DisputeListScreen />
              </RequireAuth>
            }
          />
          <Route
            path="disputes/:disputeId"
            element={
              <RequireAuth>
                <DisputeDetailScreen />
              </RequireAuth>
            }
          />
          <Route
            path="guarantee"
            element={
              <RequireAuth>
                <GuaranteeScreen />
              </RequireAuth>
            }
          />

          {/* Shaxsiy boʻlim. `addresses/new` (statik) va `addresses/:addressId`
              (dinamik) toʻqnashmaydi — Router aniqroq marshrutni oʻzi tanlaydi. */}
          <Route
            path="profile/edit"
            element={
              <RequireAuth>
                <ProfileEditScreen />
              </RequireAuth>
            }
          />
          <Route
            path="addresses"
            element={
              <RequireAuth>
                <AddressBookScreen />
              </RequireAuth>
            }
          />
          <Route
            path="addresses/new"
            element={
              <RequireAuth>
                <AddressFormScreen />
              </RequireAuth>
            }
          />
          <Route
            path="addresses/:addressId"
            element={
              <RequireAuth>
                <AddressFormScreen />
              </RequireAuth>
            }
          />
          <Route
            path="favorites"
            element={
              <RequireAuth>
                <FavoritesScreen />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </PageTransition>
    </>
  );
}

/**
 * Ilova rejimi — haqiqiy mobil ilova koʻrinishi.
 *
 * Preview galereyasidan farqi: maketa ramkasi yoʻq, ekran toʻliq viewport
 * boʻylab chiziladi va tugmalar haqiqatan ishlaydi.
 */
export function AppRouter() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ChatProvider>
          <DisputeProvider>
            <AddressProvider>
              <FavoritesProvider>
                <AppShell />
              </FavoritesProvider>
            </AddressProvider>
          </DisputeProvider>
        </ChatProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

function AppShell() {
  const { theme } = useTheme();

  // Native status bar ilova temasiga ergashadi — aks holda ilova "web sahifa"
  // boʻlib koʻrinadi.
  useEffect(() => {
    void syncStatusBar(theme);
  }, [theme]);

  /*
   * `ToastHost` `DeviceView` ICHIDA turishi shart: tema CSS oʻzgaruvchilarini
   * aynan `DeviceView` oʻsha divʼga yozadi (`applyTheme(theme, ref.current)`).
   * Ilgari toast undan tashqarida edi va Dark temada Light qiymatlarini olib,
   * toʻq sahifa ustida oq plastinka boʻlib chiqardi.
   */
  return (
    <DeviceView theme={theme}>
      <ToastHost>
        <AppLaunch>
          <AppRoutes />
        </AppLaunch>
      </ToastHost>
    </DeviceView>
  );
}
