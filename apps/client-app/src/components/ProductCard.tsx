import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/cn';
import { splitFormattedPrice } from '@/lib/formatters';
import { Card } from './Card';

/**
 * Mahsulot kartasi — doʻkon sahifasidagi ikki ustunli katakcha.
 *
 * Tepada kvadrat rasm maydoni, ostida nom va narx. Rasm maydoni AYNAN
 * kvadrat: katakchalar bir xil balandlikda boʻlishi uchun, aks holda nomi
 * ikki satrga chiqqan mahsulot qatorni surib yuborardi.
 *
 * Nom ikki satrgacha oʻsadi va uch nuqta bilan kesiladi — mahsulot nomining
 * boshi ("Mis kabel VVG…") uni tanib olish uchun yetarli, narx esa hech
 * qachon kesilmaydi: u qaror qabul qilinadigan raqam.
 */
export interface ProductCardProps {
  name: string;
  price: number;
  unit: string;
  /** Ilova ichiga joylangan rasm. */
  imageUrl: string;
  onSelect?: () => void;
  className?: string;
}

export function ProductCard({ name, price, unit, imageUrl, onSelect, className }: ProductCardProps) {
  const isInteractive = Boolean(onSelect);

  const { value: amount, currency } = splitFormattedPrice(price);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onSelect();
  };

  return (
    <Card
      interactive={isInteractive}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      className={cn('flex h-full flex-col overflow-hidden p-0', className)}
    >
      <div className="aspect-square bg-surface-sunken">
        <img src={imageUrl} alt="" aria-hidden className="h-full w-full object-cover" />
      </div>

      <div className="flex flex-1 flex-col p-12">
        <p className="line-clamp-2 text-body-sm font-semibold leading-tight text-text-primary">
          {name}
        </p>

        {/*
          Narx va oʻlchov birligi ALOHIDA qatorlarda: "1 493 500 soʻm / dona"
          bitta qatorda 160px lik katakchaga sigʻmay, "dona" pastga tushib
          ketardi va karta balandligi qoʻshnisidan farq qilardi.
        */}
        <p className="mt-auto whitespace-nowrap pt-8">
          <span className="tabular text-price text-text-primary">{amount}</span>{' '}
          <span className="text-currency text-text-secondary">{currency}</span>
        </p>
        <p className="text-caption text-text-secondary">{unit} uchun</p>
      </div>
    </Card>
  );
}
