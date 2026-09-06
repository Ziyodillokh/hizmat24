import { useState } from 'react';
import { BellOff, ClipboardList, SearchX, WifiOff } from 'lucide-react';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/Skeleton';
import { Toast } from '@/components/Toast';
import { ScreenShell } from '@/screens/_shared/ScreenShell';

/**
 * 12-bo'lim · Universal holat naqshlari.
 *
 * Bu MAHSULOT ekrani emas — 12-bo'limdagi skeleton, bo'sh holat, xato va
 * banner naqshlarini bitta joyda ko'rsatadigan ma'lumotnoma. Shu sababli
 * ekranlar ro'yxatida alohida bosqichda turadi.
 */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-24 first:mt-8">
      <h3 className="text-h3 text-text-primary">{title}</h3>
      <div className="mt-12 flex flex-col gap-12">{children}</div>
    </section>
  );
}

export function StatePatternsScreen() {
  const [toastVisible, setToastVisible] = useState(true);

  return (
    <ScreenShell header={<Header variant="inner" title="Holat naqshlari" />}>
      <Section title="12.1 · Skeleton">
        <div className="flex items-center gap-12 rounded-lg bg-surface-elevated p-16">
          <SkeletonCircle size={44} />
          <div className="flex-1">
            <Skeleton width="60%" height={18} />
            <Skeleton width="40%" height={14} className="mt-8" />
          </div>
        </div>
        <SkeletonText lines={3} />
      </Section>

      <Section title="12.2 · Bo'sh holatlar">
        <EmptyState
          icon={ClipboardList}
          title="Hozircha buyurtmalaringiz yo'q"
          description="Birinchi buyurtmangizni bering"
          action={{ label: 'Ustani chaqirish', onClick: () => undefined }}
        />
        {/* Tugmasiz variant: bildirishnomalar bo'sh bo'lganda CTA qo'yilmaydi. */}
        <EmptyState
          icon={BellOff}
          title="Bildirishnomalar yo'q"
          description="Buyurtma bergach, holat o'zgarishlari shu yerda ko'rinadi"
        />
        <EmptyState icon={SearchX} title="Hech narsa topilmadi" />
      </Section>

      <Section title="12.3 · Xato holatlari">
        <Banner variant="danger">Kod noto&apos;g&apos;ri</Banner>
        <Banner variant="warning">
          SMS yuborishda xatolik. Kod kelmasa, taymer tugagach qayta so&apos;rang.
        </Banner>
        <Banner variant="info">Usta ishni boshladi</Banner>
        <EmptyState
          icon={WifiOff}
          title="Internetga ulanish yo'q"
          action={{ label: 'Qayta urinish', onClick: () => undefined }}
        />
      </Section>

      <Section title="12.4 · Real-vaqt aloqa banneri">
        <div className="relative h-[36px]">
          <ConnectionBanner state="reconnecting" />
        </div>
        <div className="relative h-[36px]">
          <ConnectionBanner state="stalled" onRefresh={() => undefined} />
        </div>
      </Section>

      <Section title="9.25 · Toast">
        <div className="relative h-[48px]">
          {toastVisible && (
            <Toast message="Buyurtma holati yangilandi" onDismiss={() => setToastVisible(false)} />
          )}
        </div>
        <Button variant="ghost" onClick={() => setToastVisible(true)}>
          Toastni qayta ko&apos;rsatish
        </Button>
      </Section>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
