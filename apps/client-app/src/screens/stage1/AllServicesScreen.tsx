import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { Header } from '@/components/Header';
import { SearchField } from '@/components/SearchField';
import { ServiceCard } from '@/components/ServiceCard';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton, SkeletonCircle } from '@/components/Skeleton';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { serviceIcon } from '@/lib/serviceIcons';
import { ALL_CATEGORIES } from '@/mocks/serviceGroups';

/**
 * 07 · Barcha xizmatlar.
 * Tekis ro'yxat, guruhga bo'linmasdan. Qidiruv — SERVER qidiruvi emas,
 * bir marta yuklangan ro'yxat ustidan MAHALLIY filtr (06/07-ekran izohi).
 */
export type AllServicesState = 'ready' | 'loading' | 'no-results';

export interface AllServicesScreenProps {
  initialState?: AllServicesState;
}

function ServicesSkeleton() {
  return (
    <ul className="mt-16 flex flex-col gap-12">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index} className="flex items-center gap-12 rounded-lg bg-surface-elevated p-16">
          <SkeletonCircle size={44} />
          <div className="flex-1">
            <Skeleton width="60%" height={18} />
            <Skeleton width="40%" height={14} className="mt-8" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AllServicesScreen({ initialState = 'ready' }: AllServicesScreenProps) {
  const [query, setQuery] = useState(initialState === 'no-results' ? 'kompyuter' : '');

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ALL_CATEGORIES;
    return ALL_CATEGORIES.filter((category) => category.name.toLowerCase().includes(needle));
  }, [query]);

  return (
    <ScreenShell header={<Header variant="inner" title="Barcha xizmatlar" />}>
      <SearchField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Xizmat qidirish"
      />

      {initialState === 'loading' ? (
        <ServicesSkeleton />
      ) : results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Hech narsa topilmadi"
          action={{ label: "Barcha xizmatlarni ko'rish", onClick: () => setQuery('') }}
          inline
        />
      ) : (
        <ul className="mt-16 flex flex-col gap-12 pb-bottom-reserve">
          {results.map((category) => (
            <li key={category.id}>
              <ServiceCard
                name={category.name}
                description={category.description}
                price={category.basePrice}
                icon={serviceIcon(category.iconKey)}
                onSelect={() => undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </ScreenShell>
  );
}
