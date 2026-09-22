import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { DeviceView } from '@/preview/DeviceView';
import { AppLaunch } from './AppLaunch';
import { PageTransition } from './PageTransition';
import { ToastHost } from './ToastHost';
import { useBackButton } from './useBackButton';
import { useServerSync } from './useServerSync';
import { useSessionRestore } from './useSessionRestore';
import { SessionReadyProvider } from './session-ready';
import { PROTECTED_ROUTES } from './appRoutes';
import { landingRoute, modeRouteFor } from '@/lib/appMode';
import type { UserRole } from './types';
import { LoginScreen } from './screens/LoginScreen';
import { OtpScreen } from './screens/OtpScreen';
import { syncStatusBar } from './native';
import { ThemeProvider, useTheme } from './theme-context';
import { AppProvider, useApp } from './store';
import { CatalogProvider } from './catalog-store';
import { ServiceAreaProvider } from './service-area-store';
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

/**
 * Rejim gvardiyasi.
 *
 * Boshqa rejimdagi foydalanuvchini `/app/mode` ga tushiradi va u yerga IKKI
 * narsani olib ketadi: nega tushgani (`?kerak=`) va qayerga qaytishi
 * (`?keyin=`). Shu tufayli rejim almashtirilgan zahoti aynan soʻralgan sahifa
 * ochiladi — foydalanuvchi yoʻlni qaytadan qidirmaydi.
 */
function RequireRole({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const { role: current } = useApp();
  const location = useLocation();

  if (current === role) return <>{children}</>;

  return <Navigate to={modeRouteFor(role, `${location.pathname}${location.search}`)} replace />;
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
  const { isAuthenticated, hasOnboarded, role } = useApp();
  useBackButton();
  // Saqlangan `refresh` tokendan yangi `access` olinadi. Natija B3 da kerak
  // boʻladi (buyurtmalar serverdan kelganda) — hozir faqat tiklanadi.
  const isSessionReady = useSessionRestore();
  // Sessiya tiklangach buyurtmalar serverdan oʻqiladi va jonli yangilanish
  // ulanadi. Mock rejimda ikkalasi ham hech narsa qilmaydi.
  useServerSync(isSessionReady === true);

  // Rolsiz sessiya "mijoz" deb TAXMIN QILINMAYDI — u rejim tanlashga tushadi.
  const landing = landingRoute({ isAuthenticated, hasOnboarded, role });

  return (
    <SessionReadyProvider value={isSessionReady}>
      <ScrollToTop />
      <PageTransition>
        <Routes>
          {/*
            Kirmagan foydalanuvchi — kirish ekrani. Kirgan, lekin tanishtiruvni
            koʻrmagan boʻlsa — tanishtiruv; rolsiz boʻlsa — rejim tanlash;
            aks holda oʻsha rejimning uyi.
          */}
          <Route
            index
            element={landing === null ? <LoginScreen /> : <Navigate to={landing} replace />}
          />
          <Route path="auth/otp" element={<OtpScreen />} />

          {PROTECTED_ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                <RequireAuth>
                  {route.role ? (
                    <RequireRole role={route.role}>{route.element}</RequireRole>
                  ) : (
                    route.element
                  )}
                </RequireAuth>
              }
            />
          ))}

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </PageTransition>
    </SessionReadyProvider>
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
        <CatalogProvider>
        <ServiceAreaProvider>
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
        </ServiceAreaProvider>
        </CatalogProvider>
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
