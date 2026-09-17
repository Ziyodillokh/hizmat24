import { FileMagnifyingGlass } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { SearchField } from '@/components/SearchField';
import { SelectableChip } from '@/components/SelectableChip';
import { ServicePhotoCard } from '@/components/ServicePhotoCard';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { serviceIcon } from '@/lib/serviceIcons';
import type { FlatServiceCategory } from '@/mocks/serviceGroups';
import { SERVICE_IMAGES } from '@/mocks/serviceImages';
import { useCatalog } from '../catalog-store';
import { useSelectService } from '../useSelectService';

/** "Barchasi" chipining kaliti — hech bir guruh id si bilan toʻqnashmaydi. */
const ALL_GROUPS = 'all';

/** Ikki ustunli foto-kartalar panjarasi — ikkala katalog ekrani uchun bitta. */
function ServiceGrid({
  items,
  onSelect,
}: {
  items: readonly FlatServiceCategory[];
  onSelect: (categoryId: string) => void;
}) {
  return (
    <ul className="grid grid-cols-2 gap-8">
      {items.map((category) => (
        <li key={category.id} className="min-w-0">
          <ServicePhotoCard
            name={category.name}
            description={category.description}
            price={category.basePrice}
            icon={serviceIcon(category.iconKey)}
            imageUrl={SERVICE_IMAGES[category.iconKey]}
            onSelect={() => onSelect(category.id)}
          />
        </li>
      ))}
    </ul>
  );
}

/** 07a · Guruh xizmatlari. */
export function GroupServicesTab() {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const select = useSelectService();

  const { groups, categories } = useCatalog();
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const items = categories.filter((item) => item.groupId === group?.id);

  return (
    <ScreenShell header={<Header variant="inner" title={group.name} onBack={() => navigate(-1)} />}>
      <p className="mt-4 text-body-sm text-text-secondary">
        {items.length} ta xizmat · narxlar taxminiy, yakuniy summa buyurtmada hisoblanadi
      </p>
      <div className="mt-12 pb-bottom-reserve">
        <ServiceGrid items={items} onSelect={select} />
      </div>
    </ScreenShell>
  );
}

/**
 * 07 · Barcha xizmatlar.
 *
 * Qidiruv + guruh chiplari + guruhlar boʻyicha boʻlimlar. Qidiruv yozilganda
 * boʻlimlar yoʻqoladi va natijalar bitta panjarada chiqadi — foydalanuvchi
 * qaysi guruhda ekanini emas, nima topilganini koʻrishi kerak.
 */
export function AllServicesTab() {
  const navigate = useNavigate();
  const select = useSelectService();
  const { groups, categories } = useCatalog();
  const [query, setQuery] = useState('');
  const [groupId, setGroupId] = useState(ALL_GROUPS);

  const needle = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!needle) return null;
    return categories.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        (item.description ?? '').toLowerCase().includes(needle),
    );
  }, [categories, needle]);

  const sections = useMemo(
    () =>
      groups
        .filter((group) => groupId === ALL_GROUPS || group.id === groupId)
        .map((group) => ({
          group,
          items: categories.filter((item) => item.groupId === group.id),
        })),
    [categories, groupId, groups],
  );

  return (
    <ScreenShell
      header={<Header variant="inner" title="Barcha xizmatlar" onBack={() => navigate(-1)} />}
    >
      <SearchField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Xizmat qidirish"
      />

      {/* Guruh chiplari — qidiruv paytida yashirin: ikkita filtr bir vaqtda
          chalgʻitadi va natija qaysi biriga tegishli ekani noaniq qoladi.
          Bitta guruh boʻlsa (hozir faqat santexnika) chiplar umuman
          chizilmaydi — tanlaydigan narsa yoʻq. */}
      {!results && groups.length > 1 && (
        <div className="-mx-20 mt-12 flex gap-8 overflow-x-auto px-20 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <SelectableChip
            selected={groupId === ALL_GROUPS}
            onSelect={() => setGroupId(ALL_GROUPS)}
            className="shrink-0"
          >
            Barchasi
          </SelectableChip>
          {groups.map((group) => (
            <SelectableChip
              key={group.id}
              selected={groupId === group.id}
              onSelect={() => setGroupId(group.id)}
              className="shrink-0"
            >
              {group.name}
            </SelectableChip>
          ))}
        </div>
      )}

      {results ? (
        results.length === 0 ? (
          <EmptyState
            icon={FileMagnifyingGlass}
            title="Hech narsa topilmadi"
            description="Boshqa soʻz bilan urinib koʻring yoki roʻyxatdan tanlang"
            action={{ label: 'Barcha xizmatlarni koʻrish', onClick: () => setQuery('') }}
            inline
            className="mt-24"
          />
        ) : (
          <div className="mt-12 pb-bottom-reserve">
            <p className="mb-12 text-body-sm text-text-secondary">{results.length} ta natija</p>
            <ServiceGrid items={results} onSelect={select} />
          </div>
        )
      ) : (
        <div className="pb-bottom-reserve">
          {sections.map(({ group, items }) => (
            <section key={group.id}>
              <div className="mt-16 flex items-baseline justify-between gap-8 px-4">
                <h2 className="min-w-0 truncate text-h3 text-text-primary">{group.name}</h2>
                <span className="shrink-0 text-caption text-text-secondary">{items.length} ta</span>
              </div>
              <div className="mt-8">
                <ServiceGrid items={items} onSelect={select} />
              </div>
            </section>
          ))}
        </div>
      )}
    </ScreenShell>
  );
}
