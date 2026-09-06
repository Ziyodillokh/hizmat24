import { Warning } from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { InProgressScreen } from '@/screens/stage3/InProgressScreen';

/**
 * 29 · Bekor qilib boʻlmaydi (modal).
 *
 * Matn SERVERdan keladi va oʻzgartirilmaydi (12.3-band, A qism) — shuning uchun
 * u konstanta sifatida ajratilgan, ekran mantigʻiga aralashtirilmagan.
 */
const SERVER_MESSAGE =
  "Ish boshlangandan keyin buyurtmani ilova orqali bekor qilib boʻlmaydi — " +
  "iltimos, qoʻllab-quvvatlash xizmatiga murojaat qiling";

export function CancelBlockedModal() {
  return (
    <div className="relative h-full">
      <InProgressScreen />

      <Modal open>
        <div className="flex flex-col items-center">
          <Icon icon={Warning} size={48} className="text-warning" />
          <h3 className="mt-16 text-center text-h3 text-text-primary">
            Bekor qilib boʻlmaydi
          </h3>
          <p className="mt-8 text-center text-body text-text-secondary">{SERVER_MESSAGE}</p>
        </div>

        <div className="mt-20 flex flex-col gap-12">
          <Button variant="primary">Qoʻllab-quvvatlashga murojaat</Button>
          <Button variant="ghost">Yopish</Button>
        </div>
      </Modal>
    </div>
  );
}
