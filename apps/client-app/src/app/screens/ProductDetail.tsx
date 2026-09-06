import { MapPin, Storefront } from '@phosphor-icons/react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Icon } from '@/components/Icon';
import { ScreenShell, StickyFooter } from '@/screens/_shared/ScreenShell';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/formatters';
import { productIcon } from '@/lib/productIcons';
import { formatOpenHours, isOpenNow } from '@/lib/shopHours';
import { useMinuteClock } from '@/lib/useMinuteClock';
import { SHOPS } from '@/mocks/shops';
import { findProduct } from '@/mocks/products';

/**
 * Mahsulot sahifasi.
 *
 * Pastdagi qadalgan blokda narx va amal birga turadi: foydalanuvchi
 * tavsifni oxirigacha oʻqib chiqqanda ham narx koʻrinib turishi kerak —
 * u sahifa tepasida qolib ketsa, qaror qabul qilish uchun tepaga qaytish
 * kerak boʻlardi.
 *
 * Amal — doʻkonga qoʻngʻiroq. Savat va onlayn buyurtma hali yoʻq, shuning
 * uchun "Sotib olish" tugmasi yozilmaydi: ishlamaydigan tugma buzuq
 * ilova taassurotini beradi.
 */
export function ProductDetail() {
  const navigate = useNavigate();
  const { shopId, productId } = useParams<{ shopId: string; productId: string }>();
  const now = useMinuteClock();

  const shop = SHOPS.find((item) => item.id === shopId);
  if (!shop) return <Navigate to="/app/market" replace />;

  const product = productId ? findProduct(shop.id, shop.category, productId) : undefined;
  if (!product) return <Navigate to={`/app/market/${shop.id}`} replace />;

  const isOpen = isOpenNow(shop, now);

  return (
    <ScreenShell
      header={
        <Header variant="inner" title="Mahsulot" onBack={() => navigate(`/app/market/${shop.id}`)} />
      }
      footer={
        <StickyFooter>
          <div className="flex items-center gap-12">
            <div className="min-w-0 flex-1">
              <p className="text-caption text-text-secondary">Narxi</p>
              <p className="tabular truncate text-h3 text-text-primary">
                {formatPrice(product.price)}
              </p>
            </div>
            <a
              href={`tel:${shop.phone}`}
              className={cn(
                'flex min-h-[52px] shrink-0 items-center justify-center rounded-md px-20',
                'bg-primary text-button text-on-primary shadow-primary-lift',
                'transition-[transform,background-color,box-shadow] duration-press ease-emphasized',
                'active:scale-[0.97] active:bg-primary-pressed active:text-on-primary-deep',
              )}
            >
              Doʻkonga qoʻngʻiroq
            </a>
          </div>
        </StickyFooter>
      }
    >
      <div className="-mx-20 flex h-[200px] items-center justify-center bg-surface-sunken">
        <Icon
          icon={productIcon(product.iconKey)}
          size={96}
          weight="duotone"
          className="text-primary/[0.5]"
          aria-hidden
        />
      </div>

      <h1 className="mt-16 text-h2 text-text-primary">{product.name}</h1>
      {/*
        Narx bu yerda TAKRORLANMAYDI: u pastdagi qadalgan blokda doim
        koʻrinib turadi. Ikkala joyda ham chizilsa, foydalanuvchi ikkita
        boshqa-boshqa raqam bormi deb ikkilanadi.
      */}
      <p className="mt-4 text-body text-text-secondary">Oʻlchov birligi: {product.unit}</p>

      <div
        className={cn(
          'mt-16 rounded-lg border border-transparent bg-surface-elevated p-12 shadow-e1',
          "[[data-theme='dark']_&]:border-border",
        )}
      >
        <h2 className="text-overline uppercase text-text-secondary">Tavsif</h2>
        <p className="mt-8 text-body text-text-primary">{product.description}</p>
      </div>

      <h2 className="pt-20 text-h3 text-text-primary">Doʻkon</h2>

      <button
        type="button"
        onClick={() => navigate(`/app/market/${shop.id}`)}
        className={cn(
          'mt-12 flex w-full items-start gap-12 rounded-lg border border-transparent bg-surface-elevated p-12 text-left shadow-e1',
          "[[data-theme='dark']_&]:border-border",
          'transition-transform duration-press ease-std active:scale-[0.995]',
        )}
      >
        <span
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md bg-primary-surface"
          aria-hidden
        >
          <Icon icon={Storefront} size={24} weight="duotone" className="text-primary-pressed" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-8">
            <span className="min-w-0 flex-1 truncate text-title text-text-primary">{shop.name}</span>
            <span
              className={cn(
                'shrink-0 rounded-full px-8 py-2 text-badge',
                isOpen
                  ? 'bg-success-surface text-success'
                  : 'bg-neutral-surface text-text-secondary',
              )}
            >
              {isOpen ? 'Ochiq' : 'Yopiq'}
            </span>
          </span>
          <span className="mt-2 flex items-center gap-4 text-body-sm text-text-secondary">
            <Icon icon={MapPin} size={14} className="shrink-0" aria-hidden />
            <span className="truncate">
              {shop.district} · {formatOpenHours(shop)}
            </span>
          </span>
        </span>
      </button>

      <div className="h-bottom-reserve" aria-hidden />
    </ScreenShell>
  );
}
