import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UsersThree } from '@phosphor-icons/react';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { MasterListCard } from '@/components/MasterListCard';
import { SearchField } from '@/components/SearchField';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { MASTER_LIST } from '@/mocks/masters';
import { AppTabBar } from '../AppTabBar';
import { cn } from '@/lib/cn';

/**
 * Mutaxassislar roʻyxati.
 *
 * Backend ulanmagunicha maʼlumot `MASTER_LIST` dan keladi va reyting boʻyicha
 * tartiblangan. Kasb filtri ham shu roʻyxatdan hosil qilinadi — qoʻlda yozilgan
 * roʻyxat emas, aks holda yangi kasb qoʻshilganda filtr eskirib qolardi.
 *
 * DIQQAT: bu yerda usta TANLANMAYDI. Kartani bosish uning profilini ochadi,
 * buyurtma esa odatdagi oqim orqali beriladi va ustani tizim tayinlaydi
 * (1-boʻlim, 14.1-band). Roʻyxat ishonch uchun: mijoz kim kelishini oldindan
 * koʻra oladi.
 */
const ALL = 'Barchasi';

export function MastersTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [profession, setProfession] = useState(ALL);

  const professions = useMemo(
    () => [ALL, ...Array.from(new Set(MASTER_LIST.map((master) => master.profession)))],
    [],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return MASTER_LIST.filter((master) => {
      const matchesProfession = profession === ALL || master.profession === profession;
      const matchesQuery =
        needle === '' ||
        master.fullName.toLowerCase().includes(needle) ||
        master.profession.toLowerCase().includes(needle);
      return matchesProfession && matchesQuery;
    });
  }, [query, profession]);

  return (
    <ScreenShell
      header={<Header variant="inner" title="Mutaxassislar" />}
      footer={<AppTabBar active="masters" />}
    >
      <SearchField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Usta yoki kasb boʻyicha qidirish"
        className="mt-4"
      />

      {/*
        Kasb filtri gorizontal scroll qiladi: kasblar soni serverdan keladi va
        ularni bir qatorga sigʻdirish kafolatlanmaydi. Scroll paneli
        koʻrsatilmaydi — u sahifa ritmini buzadi.
      */}
      <div className="-mx-20 mt-12 flex gap-8 overflow-x-auto px-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {professions.map((item) => {
          const isSelected = item === profession;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setProfession(item)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-full px-16 py-8 text-body-sm',
                'transition-colors duration-state ease-std',
                isSelected
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-sunken text-text-secondary',
              )}
            >
              {item}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={UsersThree}
          title="Mutaxassis topilmadi"
          description="Boshqa kasb yoki nomni sinab koʻring"
          className="mt-24"
          inline
        />
      ) : (
        <>
          <p className="mt-16 px-4 text-overline uppercase text-text-secondary">
            {visible.length} ta mutaxassis
          </p>
          <ul className="mt-8 flex flex-col gap-8">
            {visible.map((master) => (
              <li key={master.id}>
                <MasterListCard
                  name={master.fullName}
                  profession={master.profession}
                  rating={master.ratingAvg}
                  completedOrders={master.completedOrdersCount}
                  photoUrl={master.photoUrl}
                  isCertified={master.hasGovCertificate}
                  isNew={master.experienceLevel === 'NEW'}
                  onOpen={() => navigate(`/app/master/${master.id}`)}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
