import { CloudSlash, CloudCheck, Plugs } from '@phosphor-icons/react';
import { Icon } from '@/components/Icon';
import { cn } from '@/lib/cn';
import type { HealthState } from '@/api/health';

/**
 * «Server: …» qatori — ilova hozir qayerdan maʼlumot olayotganini aytadi.
 *
 * Bu texnik tafsilot emas, HALOLLIK qatori: ulanmagan holatda ekrandagi
 * hamma narsa shu qurilmada yashaydi va foydalanuvchi buni bilishi kerak.
 */
const VIEWS: Record<HealthState['status'], { icon: typeof CloudCheck; text: string; tone: string }> = {
  ok: { icon: CloudCheck, text: 'Server: ulangan', tone: 'text-success' },
  offline: { icon: CloudSlash, text: 'Server: javob bermadi', tone: 'text-warning' },
  'not-configured': {
    icon: Plugs,
    text: 'Server ulanmagan — maʼlumot shu qurilmada saqlanadi',
    tone: 'text-text-secondary',
  },
};

export interface ServerStatusRowProps {
  /** `null` — tekshiruv hali tugamagan; qator umuman chizilmaydi. */
  state: HealthState | null;
  className?: string;
}

export function ServerStatusRow({ state, className }: ServerStatusRowProps) {
  if (!state) return null;
  const view = VIEWS[state.status];

  return (
    <p className={cn('flex items-center justify-center gap-8 text-caption', view.tone, className)}>
      <Icon icon={view.icon} size={16} aria-hidden />
      {view.text}
    </p>
  );
}
