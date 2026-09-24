import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { landingPath, ALL_SECTIONS } from '@/lib/sections';
import { LoginScreen } from '@/screens/LoginScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { CatalogScreen } from '@/screens/CatalogScreen';
import { ApplicationsScreen } from '@/screens/ApplicationsScreen';
import { ApplicationDetailScreen } from '@/screens/ApplicationDetailScreen';
import { CategoryEditScreen } from '@/screens/CategoryEditScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { OrdersScreen } from '@/screens/OrdersScreen';
import { OrderDetailScreen } from '@/screens/OrderDetailScreen';
import { SafetyScreen } from '@/screens/SafetyScreen';
import { UsersScreen } from '@/screens/UsersScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { PendingScreen } from '@/screens/PendingScreen';
import { useAuth } from './AuthProvider';
import { Shell } from './Shell';

/** Boʻlim kaliti → sahifa. Bu yerda yoʻqi hali yozilmagan. */
const SCREENS: Record<string, JSX.Element> = {
  dashboard: <DashboardScreen />,
  applications: <ApplicationsScreen />,
  catalog: <CatalogScreen />,
  orders: <OrdersScreen />,
  safety: <SafetyScreen />,
  users: <UsersScreen />,
  reports: <ReportsScreen />,
  settings: <SettingsScreen />,
};

export function AdminApp() {
  const { admin, isRestoring } = useAuth();
  const location = useLocation();

  // Saqlangan token tekshirilayotganda hech narsa chizilmaydi: panelni
  // koʻrsatib, keyin login ekraniga sakrash — eng bezovta qiluvchi holat.
  if (isRestoring) {
    return (
      <div className="flex min-h-full items-center justify-center text-body text-text-secondary">
        Tekshirilmoqda…
      </div>
    );
  }

  if (!admin) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
      </Routes>
    );
  }

  const home = landingPath(admin.sections);
  const allowed = new Set(admin.sections);

  return (
    <Routes>
      <Route element={<Shell />}>
        {ALL_SECTIONS.map((section) => (
          <Route
            key={section.key}
            path={section.path}
            element={
              // Ruxsat serverda ham tekshiriladi; bu yerdagisi faqat
              // manzilni qoʻlda yozgan odamni toʻgʻri joyga qaytarish uchun.
              allowed.has(section.key)
                ? (SCREENS[section.key] ?? <PendingScreen />)
                : <Navigate to={home} replace />
            }
          />
        ))}
        {/* Ichki sahifalar — boʻlim ruxsati bilan bir xil qoida. */}
        {allowed.has('applications') && (
          <Route path="/applications/:id" element={<ApplicationDetailScreen />} />
        )}
        {allowed.has('catalog') && (
          <Route path="/catalog/:id" element={<CategoryEditScreen />} />
        )}
        {allowed.has('orders') && <Route path="/orders/:id" element={<OrderDetailScreen />} />}
        <Route path="*" element={<Navigate to={home} replace />} />
      </Route>
    </Routes>
  );
}
