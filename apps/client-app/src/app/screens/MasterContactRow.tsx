import { ChatCircleDots, Phone } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { isMasterPhoneVisible } from '@/lib/orderStateMachine';
import { useChat } from '../chat-store';
import type { LiveOrder } from '../types';

/**
 * Usta bilan bogʻlanish qatori — `tel:` havolasi va "Yozish".
 *
 * Yangi dizayn komponenti EMAS: buyurtma kuzatuvi va "Usta yoʻlda"
 * ekranlarida bir xil markup kerak, shuning uchun u bitta joyga koʻchirildi.
 * Xatti-harakat AYNAN saqlangan.
 *
 * Qoʻngʻiroq tugmasi faqat usta raqami koʻrinadigan holatlarda chiziladi;
 * raqam yoʻq boʻlsa "Yozish" toʻliq kenglikni oladi.
 */
export function MasterContactRow({ order }: { order: LiveOrder }) {
  const navigate = useNavigate();
  const { openThread } = useChat();

  if (!order.master) return null;
  const master = order.master;

  return (
    <div className="flex gap-12">
      {isMasterPhoneVisible(order.status) && master.phoneNumber && (
        <a
          href={`tel:${master.phoneNumber}`}
          className="flex h-[52px] flex-1 items-center justify-center gap-8 rounded-md bg-primary px-16 text-button text-on-primary shadow-primary-lift"
        >
          <Icon icon={Phone} size={20} weight="fill" />
          Qoʻngʻiroq
        </a>
      )}
      <Button
        variant="secondary"
        leadingIcon={ChatCircleDots}
        className="flex-1"
        onClick={() => navigate(`/app/chat/${openThread(master.id, order.categoryName)}`)}
      >
        Yozish
      </Button>
    </div>
  );
}
