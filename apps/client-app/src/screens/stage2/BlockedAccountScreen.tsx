import { ShieldWarning } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';

/**
 * 05 · Hisob bloklangan.
 *
 * Terminal ekran: yagona amal — qoʻllab-quvvatlash xizmati. "Qayta urinish"
 * tugmasi yoʻq, chunki qayta urinish holatni oʻzgartirmaydi (11-boʻlim, A qism).
 * Matn serverdan keladi va oʻzgartirilmaydi (12.3-band, A).
 */
const SERVER_MESSAGE = "Hisobingiz bloklangan, qoʻllab-quvvatlash xizmatiga murojaat qiling";

export function BlockedAccountScreen() {
  return (
    <ScreenShell
      className="flex flex-col items-center justify-center text-center"
      footer={
        <StickyFooter>
          <Button variant="secondary">Qoʻllab-quvvatlashga murojaat</Button>
        </StickyFooter>
      }
    >
      <Icon icon={ShieldWarning} size={64} className="text-danger" aria-hidden />
      <h1 className="mt-20 text-h1 text-text-primary">Hisobingiz bloklangan</h1>
      {/* Server matni 2 satrgacha blok sifatida joylashadi (12.3-band, A). */}
      <p className="mt-12 text-body text-text-secondary">{SERVER_MESSAGE}</p>
    </ScreenShell>
  );
}
