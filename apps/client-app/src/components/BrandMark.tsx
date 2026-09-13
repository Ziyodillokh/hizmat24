import markUrl from '@/assets/brand/hizmat24-mark.png';
import { cn } from '@/lib/cn';

/**
 * Hizmat24 belgisi.
 *
 * Belgi loyiha egasi bergan logodan olingan: oʻzaro kesishgan "H" ustunlari
 * va ular orasidan oʻtuvchi strelka-lenta, pastda "24".
 *
 * Rang — logoning OʻZ koʻk gradienti (ilova 2026-09-13 da koʻkka oʻtdi va
 * asl rang qaytarildi). Belgi plitka ichida kichikroq turadi — ilova
 * ikonkasi bilan bir xil "nafas" (`scripts/build-brand-assets.py`,
 * LEGACY_MARK_SCALE).
 *
 * Rasm ilova ichiga joylangan (tashqi soʻrov yoʻq) — ilova internetsiz
 * ochiladi degan qoidaga muvofiq.
 */
export interface BrandMarkProps {
  className?: string;
  /**
   * Bezak sifatida (masalan, aʼzolik kartasida): `alt=""` — ekran oʻquvchi
   * konteynerning oʻz `aria-label` ini oʻqiydi, "Hizmat24" ikki marta
   * aytilmaydi.
   */
  decorative?: boolean;
}

export function BrandMark({ className, decorative = false }: BrandMarkProps) {
  return (
    <img
      src={markUrl}
      alt={decorative ? '' : 'Hizmat24'}
      aria-hidden={decorative || undefined}
      // `rounded-lg` — ikonka burchaklari: kvadrat rasm ilovadagi boshqa
      // kartalar bilan bir tilda turishi kerak.
      className={cn('block rounded-lg object-contain', className)}
    />
  );
}
