import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { StatusBar } from '@/preview/StatusBar';
import { BottomInset } from '@/screens/_shared/ScreenShell';
import { ORDERS_BY_ID } from '@/mocks/orders';

/**
 * 21 · Xavfsizlik signali — TERMINAL, DEAD-END ekran.
 *
 * Stepper yo'q. Bu ekranda "Qayta qidirish", "Boshqa usta chaqirish",
 * "Bekor qilish", "Ishni baholash" va "Chekni ko'rish" tugmalari YO'Q:
 * buyurtma qaytarib bo'lmas tarzda yopilgan (14.3-band, 15-punkt).
 */
export function SafetyAlertScreen() {
  const order = ORDERS_BY_ID['o-flagged'];

  return (
    <div className="flex h-full min-h-full flex-col bg-surface">
      <StatusBar />

      <main className="flex flex-1 flex-col items-center justify-center px-20">
        <Icon icon={ShieldAlert} size={72} className="text-danger" />

        <h1 className="mt-24 text-center text-h1 text-text-primary">
          Signalingiz qabul qilindi
        </h1>
        <p className="mt-8 text-center text-body text-text-secondary">
          Operatorimiz hoziroq siz bilan bog&apos;lanadi
        </p>

        <div className="mt-24 w-full rounded-sm bg-surface-sunken p-16 text-center">
          <p className="text-caption text-text-secondary">Signal raqami</p>
          <p className="mt-4 text-body-lg text-text-primary tabular tracking-[0.4px]">
            {order.shortId}
          </p>
        </div>
      </main>

      <div className="shrink-0 px-20 pb-12 pt-24">
        <div className="flex flex-col gap-12">
          <Button variant="primary">Qo&apos;llab-quvvatlashga murojaat</Button>
          <Button variant="ghost">Bosh sahifaga</Button>
        </div>
      </div>

      <BottomInset />
    </div>
  );
}
