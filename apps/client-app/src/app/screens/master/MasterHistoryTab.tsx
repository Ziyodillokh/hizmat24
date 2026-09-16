import { ClockCounterClockwise } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { MASTER_TAB_ROUTES } from '../../masterTabRoutes';
import { MasterTabBar } from '../../MasterTabBar';

/**
 * «Tarix» — usta OʻZI qabul qilgan ishlar.
 *
 * Roʻyxat shu bosqichda boʻsh va bu toʻqilgan holat emas: ishni qabul qilish
 * hali yoʻq, demak yakunlangan ish ham yoʻq. Boʻsh holat aynan shuni aytadi
 * va soxta yozuv bilan toʻldirilmaydi (6-boʻlim, 1-qoida).
 */
export function MasterHistoryTab() {
  const navigate = useNavigate();

  return (
    <ScreenShell
      header={<Header variant="inner" title="Tarix" />}
      footer={<MasterTabBar active="history" />}
    >
      <EmptyState
        inline
        icon={ClockCounterClockwise}
        title="Yakunlangan ish yoʻq"
        description="Siz bajargan ishlar shu yerda va Daromad boʻlimida koʻrinadi."
        action={{ label: 'Ishlarga oʻtish', onClick: () => navigate(MASTER_TAB_ROUTES.jobs) }}
      />

      <p className="px-4 text-center text-caption text-text-secondary">
        Roʻyxatda faqat siz qabul qilgan ishlar boʻladi. Demo taymer mock ustaga bergan
        buyurtmalar bu yerga tushmaydi.
      </p>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
