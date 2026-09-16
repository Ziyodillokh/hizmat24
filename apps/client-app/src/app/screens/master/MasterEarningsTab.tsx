import { Info, Money } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { MASTER_TAB_ROUTES } from '../../masterTabRoutes';
import { MasterTabBar } from '../../MasterTabBar';

/**
 * «Daromad» — naqd qoʻlga tekkan summa.
 *
 * Bu bosqichda yopilgan ish yoʻq, shuning uchun bitta ham raqam chizilmaydi:
 * «0 soʻm» ham, «balans» ham yozilmaydi. Komissiya foizi esa hali
 * belgilanmagan va ekran buni birinchi qatorda aytadi (6-boʻlim, 2-qoida).
 */
export function MasterEarningsTab() {
  const navigate = useNavigate();

  return (
    <ScreenShell
      header={<Header variant="inner" title="Daromad" />}
      footer={<MasterTabBar active="earnings" />}
    >
      <Banner variant="info" icon={Info} className="mt-4">
        Bu — mijozlar sizga naqd bergan summa. Ilova pulni saqlamaydi va oʻtkazmaydi. Platforma
        komissiyasi foizi hali belgilanmagan, shuning uchun sof daromad hisoblanmaydi.
      </Banner>

      <EmptyState
        inline
        icon={Money}
        title="Hali daromad yoʻq"
        description="Ish yakunlanib, mijoz uni baholagach summa shu yerda koʻrinadi."
        action={{ label: 'Ishlarga oʻtish', onClick: () => navigate(MASTER_TAB_ROUTES.jobs) }}
      />

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
