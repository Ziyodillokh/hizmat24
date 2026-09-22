import { CheckCircle, Clock, XCircle } from '@phosphor-icons/react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '@/api/client';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Header } from '@/components/Header';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { formatPrice } from '@/lib/formatters';
import { serviceIcon } from '@/lib/serviceIcons';
import { SERVICE_IMAGES } from '@/mocks/serviceImages';
import {
  buildGallery,
  durationLabel,
  mediaSrc,
  priceLabel,
} from '@/lib/servicePresentation';
import type { ServiceCategory } from '@/mocks/types';
import { useCatalog } from '../catalog-store';
import { useSelectService } from '../useSelectService';

/**
 * Xizmat sahifasi — mijoz buyurtma berishdan oldin nimani olayotganini
 * koʻradi.
 *
 * Har bir blok FAQAT maʼlumot boʻlsa chiziladi: vaqt aytilmagan boʻlsa
 * qator umuman yoʻq, «Narx ichiga kiradi» boʻsh boʻlsa sarlavha ham
 * yoʻq. Boʻsh sarlavha «bu yerda hech narsa yoʻq» degan taassurot
 * qoldiradi va kartani yarim tayyor koʻrsatadi.
 */
export function ServiceDetailScreen() {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const { findCategory } = useCatalog();
  const select = useSelectService();

  const category = findCategory(categoryId ?? null);
  if (!category) return <Navigate to="/app/services" replace />;

  const duration = durationLabel(category.durationMinutes);

  return (
    <ScreenShell
      header={<Header variant="inner" title={category.name} onBack={() => navigate(-1)} />}
      footer={
        <StickyFooter>
          <div className="flex items-center justify-between gap-12">
            <div className="min-w-0">
              <p className="text-caption text-text-secondary">Narx</p>
              <p className="truncate text-h3 text-text-primary">
                {priceLabel(formatPrice(category.basePrice), category.priceKind)}
              </p>
            </div>
            <Button variant="primary" fullWidth={false} className="px-24" onClick={() => select(category.id)}>
              Buyurtma berish
            </Button>
          </div>
        </StickyFooter>
      }
    >
      <Gallery category={category} />

      <h1 className="mt-16 text-h1 text-text-primary">{category.name}</h1>
      {category.description && (
        <p className="mt-8 text-body text-text-secondary">{category.description}</p>
      )}

      {duration && (
        <p className="mt-12 flex items-center gap-8 text-body-sm text-text-secondary">
          <Clock size={18} weight="regular" aria-hidden />
          Taxminan {duration}
        </p>
      )}

      {category.details?.trim() && (
        <section className="mt-24">
          <h2 className="px-4 text-overline uppercase text-text-secondary">Ish qanday bajariladi</h2>
          <p className="mt-8 whitespace-pre-line px-4 text-body text-text-primary">
            {category.details}
          </p>
        </section>
      )}

      <PointList
        title="Narx ichiga kiradi"
        items={category.includes ?? []}
        icon={<CheckCircle size={18} weight="fill" className="mt-2 shrink-0 text-success" aria-hidden />}
      />
      <PointList
        title="Narx ichiga kirmaydi"
        items={category.excludes ?? []}
        icon={<XCircle size={18} weight="fill" className="mt-2 shrink-0 text-text-disabled" aria-hidden />}
      />

      <p className="mt-24 px-4 text-caption text-text-secondary">
        Yakuniy summa ish hajmiga qarab oʻzgarishi mumkin — usta joyida aytadi.
      </p>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}

function PointList({
  title,
  items,
  icon,
}: {
  title: string;
  items: readonly string[];
  icon: React.ReactNode;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-24">
      <h2 className="px-4 text-overline uppercase text-text-secondary">{title}</h2>
      <Card className="mt-8">
        <ul className="flex flex-col gap-12">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-8 text-body text-text-primary">
              {icon}
              <span className="min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

/**
 * Rasm va videolar.
 *
 * Server rasmi boʻlmasa ilova ichidagi zaxira rasmga tushadi, u ham
 * boʻlmasa — ikonka. Boʻsh kulrang toʻrtburchak qolmaydi.
 */
function Gallery({ category }: { category: ServiceCategory }) {
  const gallery = buildGallery(category);
  const [active, setActive] = useState(0);
  // Kategoriya kaliti boʻlmasa `serviceIcon` oʻzi zaxira ikonkaga tushadi.
  const Icon = serviceIcon(category.iconKey ?? '');
  const fallback = category.iconKey ? SERVICE_IMAGES[category.iconKey] : undefined;

  if (gallery.items.length === 0) {
    return (
      <div className="mt-4 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-lg bg-surface-sunken">
        {fallback ? (
          <img src={fallback} alt="" className="h-full w-full object-cover" />
        ) : (
          <Icon size={48} weight="duotone" className="text-accent-water" aria-hidden />
        )}
      </div>
    );
  }

  const current = gallery.items[Math.min(active, gallery.items.length - 1)];

  return (
    <div className="mt-4">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-surface-sunken">
        {current.kind === 'IMAGE' ? (
          <img
            src={mediaSrc(API_BASE_URL, current.url)}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            src={mediaSrc(API_BASE_URL, current.url)}
            controls
            playsInline
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {gallery.items.length > 1 && (
        <div className="-mx-20 mt-8 flex gap-8 overflow-x-auto px-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {gallery.items.map((item, index) => (
            <button
              key={item.url}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`${index + 1}-fayl`}
              aria-current={index === active}
              className={[
                'h-48 w-64 shrink-0 overflow-hidden rounded-md border-2',
                index === active ? 'border-primary' : 'border-transparent',
              ].join(' ')}
            >
              {item.kind === 'IMAGE' ? (
                <img src={mediaSrc(API_BASE_URL, item.url)} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-surface-sunken text-caption text-text-secondary">
                  video
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
