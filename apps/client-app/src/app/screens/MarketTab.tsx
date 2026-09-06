import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Storefront } from '@phosphor-icons/react';
import { EmptyState } from '@/components/EmptyState';
import { Header } from '@/components/Header';
import { SearchField } from '@/components/SearchField';
import { ShopCard } from '@/components/ShopCard';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { SHOP_LIST, type ShopCategory } from '@/mocks/shops';
import { isOpenNow } from '@/lib/shopHours';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { AppTabBar } from '../AppTabBar';
import { cn } from '@/lib/cn';

/**
 * Market — qurilish va taʼmir mollari doʻkonlari roʻyxati.
 *
 * Backend ulanmagunicha maʼlumot `SHOP_LIST` dan keladi. Kategoriya filtri
 * roʻyxatning OʻZIDAN hosil qilinadi, shuning uchun yangi kategoriya
 * qoʻshilganda filtr avtomatik paydo boʻladi.
 *
 * "Ochiq/Yopiq" holati har renderda joriy soatdan hisoblanadi — mockda
 * qatʼiy yozib qoʻyilsa, u tunda ham "Ochiq" deb turaverardi.
 */
const ALL = 'Barchasi';

export function MarketTab() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ShopCategory | typeof ALL>(ALL);

  /*
   * Soat har daqiqada yangilanadi: "Ochiq/Yopiq" render paytidagi vaqtdan
   * hisoblanadi va bir marta olingan vaqt bilan ekran ochiq turganda doʻkon
   * yopilgan boʻlsa ham "Ochiq" deb turaverardi.
   */
  const now = useMinuteClock();

  const categories = useMemo<(ShopCategory | typeof ALL)[]>(
    () => [ALL, ...Array.from(new Set(SHOP_LIST.map((shop) => shop.category)))],
    [],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SHOP_LIST.filter((shop) => {
      const matchesCategory = category === ALL || shop.category === category;
      const matchesQuery =
        needle === '' ||
        shop.name.toLowerCase().includes(needle) ||
        shop.district.toLowerCase().includes(needle) ||
        shop.address.toLowerCase().includes(needle) ||
        shop.category.toLowerCase().includes(needle);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <ScreenShell header={<Header variant="inner" title="Market" />} footer={<AppTabBar active="market" />}>
      <SearchField
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Doʻkon yoki tuman boʻyicha qidirish"
        className="mt-4"
      />

      {/* Kategoriyalar soni serverdan keladi — bir qatorga sigʻishi
          kafolatlanmaydi, shuning uchun qator gorizontal scroll qiladi. */}
      <div className="-mx-20 mt-12 flex gap-8 overflow-x-auto px-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((item) => {
          const isSelected = item === category;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-full px-16 py-8 text-body-sm',
                'transition-colors duration-state ease-std',
                isSelected
                  ? 'bg-primary font-semibold text-on-primary'
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
          icon={Storefront}
          title="Doʻkon topilmadi"
          description="Boshqa kategoriya yoki nomni sinab koʻring"
          className="mt-24"
          inline
        />
      ) : (
        <>
          <p className="mt-16 px-4 text-overline uppercase text-text-secondary">
            {visible.length} ta doʻkon
          </p>
          <ul className="mt-8 flex flex-col gap-8">
            {visible.map((shop) => (
              <li key={shop.id}>
                <ShopCard
                  name={shop.name}
                  category={shop.category}
                  district={shop.district}
                  rating={shop.ratingAvg}
                  reviews={shop.reviewsCount}
                  isOpen={isOpenNow(shop, now)}
                  hasDelivery={shop.hasDelivery}
                  onOpen={() => navigate(`/app/market/${shop.id}`)}
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
