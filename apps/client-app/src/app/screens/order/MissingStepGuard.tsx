import { Warning } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { Header } from '@/components/Header';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import type { MissingStepInfo } from '@/lib/orderFlow';

/** Qoralama toʻliq boʻlmaganda: sabab + haqiqiy tugma. Boshi berk holat qolmaydi. */
export function MissingStepGuard({ title, missing }: { title: string; missing: MissingStepInfo }) {
  const navigate = useNavigate();
  return (
    <ScreenShell header={<Header variant="inner" title={title} onBack={() => navigate('/app/home')} />}>
      <Banner variant="warning" icon={Warning} className="mt-16">{missing.title}</Banner>
      <Button variant="secondary" className="mt-16" onClick={() => navigate(missing.route)}>{missing.cta}</Button>
      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
