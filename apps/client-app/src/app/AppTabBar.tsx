import { useNavigate } from 'react-router-dom';
import { BottomNav, type TabKey } from '@/components/BottomNav';
import { useApp } from './store';

const ROUTES: Record<TabKey, string> = {
  home: '/app/home',
  orders: '/app/orders',
  notifications: '/app/notifications',
  profile: '/app/profile',
};

/** Tab bar — marshrutga ulangan; ekranlar uni toʻgʻridan-toʻgʻri chizmaydi. */
export function AppTabBar({ active }: { active: TabKey }) {
  const navigate = useNavigate();
  const { unreadCount } = useApp();

  return (
    <BottomNav
      active={active}
      unreadCount={unreadCount}
      onSelect={(tab) => navigate(ROUTES[tab])}
    />
  );
}
