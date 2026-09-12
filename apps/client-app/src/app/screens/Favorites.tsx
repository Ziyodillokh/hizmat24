import { ChatCircleDots, Heart, Info, Wrench } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@/components/Banner';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { MasterListCard } from '@/components/MasterListCard';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { useChat } from '../chat-store';
import { useFavorites } from '../favorites-store';
import { useApp } from '../store';
import { useToast } from '../ToastHost';
import { tapFeedback } from '../native';

/**
 * Sevimli ustalar.
 *
 * Har bir qatorda UCHTA amal bor va uchalasi ham haqiqatan ishlaydi:
 * profilni ochish, yozishish va keyingi buyurtmada shu ustani soʻrash.
 *
 * Bandlik, narx, ish jadvali va masofa YOZILMAYDI: `Master` tipida bu
 * maydonlar yoʻq va har qanday qiymat oʻylab chiqarilgan boʻlardi.
 */
export function FavoritesScreen() {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();
  const { setDraftMaster, draft } = useApp();
  const { openThread } = useChat();
  const showToast = useToast();

  const requestMaster = (masterId: string, name: string) => {
    setDraftMaster(masterId);
    void tapFeedback();
    showToast(`${name} tanlandi`, 'success');
    // Kategoriya allaqachon tanlangan boʻlsa oqimni buzmaymiz.
    navigate(draft.categoryId ? '/app/new/details' : '/app/services');
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Sevimli ustalar" onBack={() => navigate(-1)} />}
    >
      {favorites.length === 0 ? (
        <>
          <EmptyState
            inline
            className="mt-24"
            icon={Heart}
            title="Sevimli usta yoʻq"
            description="Usta profilidagi yurak belgisi uni shu roʻyxatga qoʻshadi"
            action={{
              label: 'Ustalarni koʻrish',
              variant: 'secondary',
              onClick: () => navigate('/app/masters'),
            }}
          />
          {/* Uzun tushuntirish `description` da emas: u ikki satrdan keyin kesiladi. */}
          <Banner variant="info" icon={Info} className="mt-20">
            Sevimli roʻyxat ustani keyin qidirib oʻtirmaslik uchun. Roʻyxatdan ustani ochasiz,
            unga yozasiz yoki keyingi buyurtmada aynan uni soʻraysiz.
          </Banner>
        </>
      ) : (
        <>
          <p className="mt-4 text-body text-text-secondary">
            Buyurtma berganda shu ustani soʻrashingiz mumkin. Usta band boʻlsa nima boʻlishini
            backend hal qiladi — hozircha bu tekshiruv yoʻq.
          </p>

          <ul className="mt-20 flex flex-col gap-20">
            {favorites.map(({ master }) => (
              <li key={master.id}>
                <MasterListCard
                  name={master.fullName}
                  profession={master.profession}
                  rating={master.ratingAvg}
                  completedOrders={master.completedOrdersCount}
                  photoUrl={master.photoUrl}
                  isCertified={master.hasGovCertificate}
                  isNew={master.experienceLevel !== 'EXPERIENCED'}
                  onOpen={() => navigate(`/app/master/${master.id}`)}
                />

                <div className="mt-8 flex gap-8">
                  <Button
                    variant="secondary"
                    leadingIcon={Wrench}
                    className="flex-1"
                    onClick={() => requestMaster(master.id, master.fullName)}
                  >
                    Chaqirish
                  </Button>
                  <Button
                    variant="secondary"
                    leadingIcon={ChatCircleDots}
                    className="flex-1"
                    onClick={() => navigate(`/app/chat/${openThread(master.id, 'Savol-javob')}`)}
                  >
                    Yozish
                  </Button>
                  <button
                    type="button"
                    aria-label={`${master.fullName} — sevimlilardan olib tashlash`}
                    onClick={() => {
                      toggleFavorite(master.id);
                      showToast('Sevimlilardan olib tashlandi');
                    }}
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md border border-border bg-surface-elevated"
                  >
                    <Icon icon={Heart} size={20} weight="fill" className="text-danger" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-20 px-4 text-caption text-text-secondary">
            Roʻyxat faqat shu qurilmada saqlanadi. Ilovadan chiqsangiz oʻchiriladi.
          </p>
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
