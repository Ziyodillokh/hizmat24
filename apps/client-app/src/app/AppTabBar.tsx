import { useNavigate } from 'react-router-dom';
import { BottomNav, type TabKey } from '@/components/BottomNav';
import { useChat } from './chat-store';
import { TAB_ROUTES } from './tabRoutes';

/** Tab bar — marshrutga ulangan; ekranlar uni toʻgʻridan-toʻgʻri chizmaydi. */
export function AppTabBar({ active }: { active: TabKey }) {
  const navigate = useNavigate();
  // `ChatProvider` butun marshrut daraxtini oʻrab turibdi (AppRouter), demak
  // tab bar har doim uning ichida chiziladi.
  const { unreadTotal } = useChat();

  return (
    <BottomNav
      active={active}
      badges={{ chat: unreadTotal }}
      onSelect={(tab) => navigate(TAB_ROUTES[tab])}
    />
  );
}
