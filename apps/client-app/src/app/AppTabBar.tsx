import { useNavigate } from 'react-router-dom';
import { BottomNav, CLIENT_TABS, type TabKey } from '@/components/BottomNav';
import { TAB_ROUTES } from './tabRoutes';

/** Tab bar — marshrutga ulangan; ekranlar uni toʻgʻridan-toʻgʻri chizmaydi. */
export function AppTabBar({ active }: { active: TabKey }) {
  const navigate = useNavigate();
  return (
    <BottomNav
      items={CLIENT_TABS}
      active={active}
      onSelect={(tab) => navigate(TAB_ROUTES[tab])}
    />
  );
}
