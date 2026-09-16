import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/BottomNav';
import { MASTER_TABS, MASTER_TAB_ROUTES, type MasterTabKey } from './masterTabRoutes';

/**
 * Usta paneli — `AppTabBar` ning aynan nusxasi, faqat boshqa jadval ustida.
 *
 * Ikki panel bitta komponentga birlashtirilmaydi: mijoz ekranlariga `role`
 * shoxi qoʻshilishi bitta faylni ikki rejimning chalkash tuguniga aylantirardi.
 */
export function MasterTabBar({
  active,
  badges,
}: {
  active: MasterTabKey;
  badges?: Partial<Record<MasterTabKey, number>>;
}) {
  const navigate = useNavigate();

  return (
    <BottomNav
      items={MASTER_TABS}
      active={active}
      badges={badges}
      onSelect={(tab) => navigate(MASTER_TAB_ROUTES[tab])}
    />
  );
}
