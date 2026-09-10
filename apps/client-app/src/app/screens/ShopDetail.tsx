import { Clock, MapPin, Star, Truck } from '@phosphor-icons/react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { ProductCard } from '@/components/ProductCard';
import { ScreenShell } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { formatRating } from '@/lib/formatters';
import { shopCover, productImage } from '@/lib/marketImages';
import { formatOpenHours, isOpenNow } from '@/lib/shopHours';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { SHOPS } from '@/mocks/shops';
import { shopProducts } from '@/mocks/products';

/**
 * Doʻkon sahifasi: muqova, maʼlumot bloki va ikki ustunli mahsulotlar.
 *
 * Toʻliq manzil va ish vaqti aynan shu yerda koʻrsatiladi — roʻyxatdagi
 * kartada ular sigʻmasdi va kesilardi.
 */
export function ShopDetail() {
  const navigate = useNavigate();
  const { shopId } = useParams<{ shopId: string }>();
  const now = useMinuteClock();

  const shop = SHOPS.find((item) => item.id === shopId);
  if (!shop) return <Navigate to="/app/market" replace />;

  const products = shopProducts(shop.id, shop.category);
  const isOpen = isOpenNow(shop, now);

  return (
    <ScreenShell
      header={<Header variant="inner" title={shop.name} onBack={() => navigate(-1)} />}
    >
      <img
        src={shopCover(shop.category)}
        alt=""
        aria-hidden
        className="-mx-20 h-[160px] w-[calc(100%+40px)] max-w-none object-cover"
      />

      <div className="mt-16 flex items-start justify-between gap-12">
        <div className="min-w-0 flex-1">
          <h1 className="text-h2 text-text-primary">{shop.name}</h1>
          <p className="mt-2 text-body-sm text-text-secondary">{shop.category}</p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-12 py-4 text-badge',
            isOpen ? 'bg-success-surface text-success' : 'bg-neutral-surface text-text-secondary',
          )}
        >
          {isOpen ? 'Ochiq' : 'Yopiq'}
        </span>
      </div>

      <div
        className={cn(
          'mt-12 rounded-lg border border-transparent bg-surface-elevated p-12 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <p className="flex items-center gap-8">
          <Icon icon={Star} size={16} weight="fill" className="shrink-0 text-star" aria-hidden />
          <span className="tabular text-numeric-sm text-text-primary">
            {formatRating(shop.ratingAvg)}
          </span>
          <span className="text-caption text-text-secondary">· {shop.reviewsCount} ta sharh</span>
        </p>

        <span className="-mx-12 my-12 block h-px bg-border" aria-hidden />

        <p className="flex items-start gap-8 text-body-sm text-text-secondary">
          <Icon icon={MapPin} size={16} className="mt-2 shrink-0" aria-hidden />
          <span className="min-w-0">
            {shop.district} tumani, {shop.address}
          </span>
        </p>

        <p className="mt-8 flex items-center gap-8 text-body-sm text-text-secondary">
          <Icon icon={Clock} size={16} className="shrink-0" aria-hidden />
          <span>Har kuni {formatOpenHours(shop)}</span>
        </p>

        {shop.hasDelivery && (
          <p className="mt-8 flex items-center gap-8 text-body-sm text-text-secondary">
            <Icon icon={Truck} size={16} className="shrink-0" aria-hidden />
            <span>Yetkazib berish mavjud</span>
          </p>
        )}
      </div>

      <h2 className="pt-20 text-h3 text-text-primary">Mahsulotlar</h2>
      <p className="mt-2 text-body-sm text-text-secondary">{products.length} ta mahsulot</p>

      <ul className="mt-12 grid grid-cols-2 items-stretch gap-12">
        {products.map((product, index) => (
          <li key={product.id} className="min-w-0">
            <ProductCard
              name={product.name}
              price={product.price}
              unit={product.unit}
              imageUrl={productImage(shop.category, index)}
              onSelect={() => navigate(`/app/market/${shop.id}/${product.id}`)}
            />
          </li>
        ))}
      </ul>

      <div className="h-24" aria-hidden />
    </ScreenShell>
  );
}
