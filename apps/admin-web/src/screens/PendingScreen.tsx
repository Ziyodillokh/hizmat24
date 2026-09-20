import { useLocation } from 'react-router-dom';
import { sectionByPath } from '@/lib/sections';
import { Card, PageTitle } from '@/components/ui';

/**
 * Hali yozilmagan boʻlim.
 *
 * Boʻsh jadval yoki «maʼlumot yoʻq» koʻrsatilmaydi: ikkalasi ham
 * "tekshirildi, hech narsa yoʻq" degan maʼnoni beradi. Bu yerda esa
 * aksincha — hali tekshiradigan narsaning oʻzi yozilmagan.
 */
export function PendingScreen() {
  const { pathname } = useLocation();
  const section = sectionByPath(pathname);

  return (
    <>
      <PageTitle title={section?.title ?? 'Boʻlim'} subtitle={section?.summary} />

      <Card className="p-24">
        <p className="text-body-strong text-text-primary">Bu boʻlim hali tayyor emas</p>
        <p className="mt-8 max-w-[560px] text-body text-text-secondary">
          {section?.stage
            ? `U ${section.stage} bosqichida yoziladi. Shu paytgacha bu yerda hech qanday maʼlumot koʻrsatilmaydi — boʻsh jadval “tekshirildi, hech narsa yoʻq” degan notoʻgʻri tasavvur qoldirardi.`
            : 'Manzil notanish. Chap menyudan boʻlim tanlang.'}
        </p>
      </Card>
    </>
  );
}
