import { useNavigate } from 'react-router-dom';
import { BottomNav, type TabKey } from '@/components/BottomNav';

const ROUTES: Record<TabKey, string> = {
  home: '/app/home',
  orders: '/app/orders',
  masters: '/app/masters',
  profile: '/app/profile',
};

/** Tab bar — marshrutga ulangan; ekranlar uni toʻgʻridan-toʻgʻri chizmaydi. */
export function AppTabBar({ active }: { active: TabKey }) {
  const navigate = useNavigate();
  return <BottomNav active={active} onSelect={(tab) => navigate(ROUTES[tab])} />;
}
