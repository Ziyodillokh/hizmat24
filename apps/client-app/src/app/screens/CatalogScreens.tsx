import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { SearchField } from '@/components/SearchField';
import { ServiceCard } from '@/components/ServiceCard';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { serviceIcon } from '@/lib/serviceIcons';
import { ALL_CATEGORIES, SERVICE_GROUPS } from '@/mocks/serviceGroups';
import { useApp } from '../store';

/** 07a · Guruh xizmatlari. */
export function GroupServicesTab() {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { setDraftCategory } = useApp();

  const group = SERVICE_GROUPS.find((item) => item.id === groupId) ?? SERVICE_GROUPS[0];
  
  const select = (categoryId: string) => {
    setDraftCategory(categoryId);
    navigate('/app/new/details');
  };

  return (
    <ScreenShell header={<Header variant="inner" title={group.name} onBack={() => navigate(-1)} />}>
      <ul className="mt-4 flex flex-col gap-12 pb-bottom-reserve">
        {group.categories.map((category) => (
          <li key={category.id}>
            <ServiceCard
              name={category.name}
              description={category.description}
              price={category.basePrice}
              icon={serviceIcon(category.iconKey ?? group.iconKey)}
              onSelect={() => select(category.id)}
            />
          </li>
        ))}
      </ul>
    </ScreenShell>
  );
}

/** 07 · Barcha xizmatlar — mahalliy filtr. */
export function AllServicesTab() {
  const navigate = useNavigate();
  const { setDraftCategory } = useApp();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ALL_CATEGORIES;
    return ALL_CATEGORIES.filter((item) => item.name.toLowerCase().includes(needle));
  }, [query]);

  const select = (categoryId: string) => {
    setDraftCategory(categoryId);
    navigate('/app/new/details');
  };

  return (
    <ScreenShell
      header={<Header variant="inner" title="Barcha xizmatlar" onBack={() => navigate(-1)} />}
    >
      <SearchField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Xizmat qidirish"
      />

      {results.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Hech narsa topilmadi"
          action={{ label: "Barcha xizmatlarni koʻrish", onClick: () => setQuery('') }}
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
                onSelect={() => select(category.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </ScreenShell>
  );
}
