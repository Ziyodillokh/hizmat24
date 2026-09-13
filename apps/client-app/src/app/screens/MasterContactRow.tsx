import { Phone } from '@phosphor-icons/react';
import { Icon } from '@/components/Icon';
import { isMasterPhoneVisible } from '@/lib/orderStateMachine';
import type { LiveOrder } from '../types';

/**
 * Usta bilan bogʻlanish qatori — `tel:` havolasi.
 *
 * Buyurtma kuzatuvi va "Usta yoʻlda" ekranlarida bir xil markup kerak,
 * shuning uchun u bitta joyga koʻchirilgan. "Yozish" tugmasi Chat boʻlimi
 * bilan birga olib tashlandi (2026-09-13) — usta bilan aloqa faqat
 * qoʻngʻiroq orqali.
 *
 * Qator FAQAT usta raqami koʻrinadigan holatlarda chiziladi; aks holda
 * hech narsa chizilmaydi — boʻsh qator ishlamaydigan tugmadan yaxshi emas.
 */
export function MasterContactRow({ order }: { order: LiveOrder }) {
  const master = order.master;
  if (!master || !isMasterPhoneVisible(order.status) || !master.phoneNumber) return null;

  return (
    <a
      href={`tel:${master.phoneNumber}`}
      className="flex h-[52px] w-full items-center justify-center gap-8 rounded-md bg-primary px-16 text-button text-on-primary shadow-primary-lift"
    >
      <Icon icon={Phone} size={20} weight="fill" />
      Qoʻngʻiroq
    </a>
  );
}
