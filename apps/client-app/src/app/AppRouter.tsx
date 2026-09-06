import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DeviceView } from '@/preview/DeviceView';
import { AppLaunch } from './AppLaunch';
import { PageTransition } from './PageTransition';
import { ToastHost } from './ToastHost';
import { useBackButton } from './useBackButton';
import { syncStatusBar } from './native';
import { ThemeProvider, useTheme } from './theme-context';
import { AppProvider, useApp } from './store';
import { OtpScreen, PhoneScreen, WelcomeScreen } from './screens/AuthScreens';
import { HomeTab } from './screens/HomeTab';
import { AllServicesTab, GroupServicesTab } from './screens/CatalogScreens';
import { AddressStep, ConfirmStep, MapStep, OrderDetailsStep } from './screens/CreateOrderScreens';
import { OrderTracking } from './screens/OrderTracking';
import { ConfirmMasterFlow, SafetyAlertResult } from './screens/SafetyFlow';
import { RateOrderScreen, ReceiptScreen } from './screens/RateAndReceipt';
import { MasterProfile, NotificationsTab, OrdersTab, ProfileTab } from './screens/Tabs';
import { SupportScreen } from '@/screens/stage5/SupportScreen';

/** Login qilmagan foydalanuvchini kirish oqimiga qaytaradi (1-bo'lim, 14-qoida). */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? <>{children}</> : <Navigate to="/app" replace />;
}

/** Yangi ekranga o'tganda scroll tepaga qaytadi — haqiqiy ilovadagidek. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.querySelector('[data-app-scroll]')?.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { isAuthenticated } = useApp();
  useBackButton();

  return (
    <>
      <ScrollToTop />
      <PageTransition>
        <Routes>
          <Route
            index
            element={isAuthenticated ? <Navigate to="/app/home" replace /> : <WelcomeScreen />}
          />
          <Route path="auth/phone" element={<PhoneScreen />} />
          <Route path="auth/otp" element={<OtpScreen />} />

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
                <SupportScreen />
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
 * Ilova rejimi — haqiqiy mobil ilova ko'rinishi.
 *
 * Preview galereyasidan farqi: maketa ramkasi yo'q, ekran to'liq viewport
 * bo'ylab chiziladi va tugmalar haqiqatan ishlaydi.
 */
export function AppRouter() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ToastHost>
          <AppShell />
        </ToastHost>
      </AppProvider>
    </ThemeProvider>
  );
}

function AppShell() {
  const { theme } = useTheme();

  // Native status bar ilova temasiga ergashadi — aks holda ilova "web sahifa"
  // bo'lib ko'rinadi.
  useEffect(() => {
    void syncStatusBar(theme);
  }, [theme]);

  return (
    <DeviceView theme={theme}>
      <AppLaunch>
        <AppRoutes />
      </AppLaunch>
    </DeviceView>
  );
}
