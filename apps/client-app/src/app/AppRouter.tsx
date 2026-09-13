import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DeviceView } from '@/preview/DeviceView';
import { AppLaunch } from './AppLaunch';
import { PageTransition } from './PageTransition';
import { ToastHost } from './ToastHost';
import { useBackButton } from './useBackButton';
import { PROTECTED_ROUTES } from './appRoutes';
import { LoginScreen } from './screens/LoginScreen';
import { OtpScreen } from './screens/OtpScreen';
import { syncStatusBar } from './native';
import { ThemeProvider, useTheme } from './theme-context';
import { AppProvider, useApp } from './store';
import { AiProvider } from './ai-store';
import { DisputeProvider } from './dispute-store';
import { AddressProvider } from './address-store';
import { FavoritesProvider } from './favorites-store';
import { MasterProvider } from './master-store';

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

          {PROTECTED_ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<RequireAuth>{route.element}</RequireAuth>}
            />
          ))}

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
        <AiProvider>
          <DisputeProvider>
            <AddressProvider>
              <FavoritesProvider>
                <MasterProvider>
                  <AppShell />
                </MasterProvider>
              </FavoritesProvider>
            </AddressProvider>
          </DisputeProvider>
        </AiProvider>
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
