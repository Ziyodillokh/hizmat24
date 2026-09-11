import markUrl from '@/assets/brand/hizmat24-mark.png';
import { cn } from '@/lib/cn';

/**
 * Hizmat24 belgisi.
 *
 * Belgi loyiha egasi bergan logodan olingan: oʻzaro kesishgan "H" ustunlari
 * va ular orasidan oʻtuvchi strelka-lenta, pastda "24".
 *
 * Manba koʻk edi, bu yerda esa ilovaning turkuaz gradienti ustida chiziladi:
 * koʻk belgi turkuaz ilovada begona koʻrinardi. Shakl aynan saqlangan —
 * `scripts/build-brand-assets.py` faqat rangni almashtiradi.
 *
 * Rasm ilova ichiga joylangan (tashqi soʻrov yoʻq) — ilova internetsiz
 * ochiladi degan qoidaga muvofiq.
 */
export interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <img
      src={markUrl}
      alt="Hizmat24"
      // `rounded-lg` — ikonka burchaklari: kvadrat rasm ilovadagi boshqa
      // kartalar bilan bir tilda turishi kerak.
      className={cn('block rounded-lg object-contain', className)}
    />
  );
}
