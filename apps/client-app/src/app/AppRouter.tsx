import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { DeviceView } from '@/preview/DeviceView';
import { AppLaunch } from './AppLaunch';
import { PageTransition } from './PageTransition';
import { ToastHost } from './ToastHost';
import { useBackButton } from './useBackButton';
import { syncStatusBar } from './native';
import { ThemeProvider, useTheme } from './theme-context';
import { AppProvider, useApp } from './store';
import { LoginScreen } from './screens/LoginScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { OtpScreen } from './screens/OtpScreen';
import { HomeTab } from './screens/HomeTab';
import { AllServicesTab, GroupServicesTab } from './screens/CatalogScreens';
import { AddressStep, ConfirmStep, MapStep, OrderDetailsStep } from './screens/CreateOrderScreens';
import { OrderTracking } from './screens/OrderTracking';
import { ConfirmMasterFlow, SafetyAlertResult } from './screens/SafetyFlow';
import { RateOrderScreen, ReceiptScreen } from './screens/RateAndReceipt';
import { MasterProfile, NotificationsTab, OrdersTab, ProfileTab } from './screens/Tabs';
import { MarketTab } from './screens/MarketTab';
import { ProductDetail } from './screens/ProductDetail';
import { ShopDetail } from './screens/ShopDetail';
import { MastersTab } from './screens/MastersTab';
import { SupportScreen } from '@/screens/stage5/SupportScreen';

/**
 * `SupportScreen` preview galereyasida ham ishlatiladi va u yerda marshrut
 * yoʻq, shuning uchun orqaga qaytish shu oʻramchida beriladi.
 */
function SupportRoute() {
  const navigate = useNavigate();
  return <SupportScreen onBack={() => navigate(-1)} />;
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
          <Route
            path="new/map"
            element={
              <RequireAuth>
                <MapStep />
              </RequireAuth>
            }
          />
          <Route
            path="new/address"
            element={
              <RequireAuth>
                <AddressStep />
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
            path="orders"
            element={
              <RequireAuth>
                <OrdersTab />
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
        <AppShell />
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
