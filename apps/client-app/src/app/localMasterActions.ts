import type { Dispatch, SetStateAction } from 'react';
import {
  buildAcceptPatch,
  buildArrivePatch,
  buildDepartPatch,
  buildFinishPatch,
  buildMasterCancelPatch,
} from './masterActions';
import type { LiveOrder } from './types';
import type { Master } from '@/mocks/types';

/**
 * Usta rejimidagi amallar — hozircha SHU QURILMADA.
 *
 * `store.tsx` dan ajratildi: fayl 500 qator chegarasiga tiralgan edi va bu
 * beshta amalning oʻz savoli bor. Ular server ulanganda (B5 bosqichi)
 * `serverOrderActions.ts` kabi API chaqiruvlariga almashadi — shuning uchun
 * ular alohida turgani qulay.
 *
 * Har bir amal quruvchini `setState` ICHIDA chaqiradi: karta chizilgandan
 * keyin holat oʻzgargan boʻlishi mumkin va quruvchi `null` qaytarsa hech
 * narsa yozilmaydi.
 */
interface StateWithOrders {
  orders: LiveOrder[];
}

type Setter<S extends StateWithOrders> = Dispatch<SetStateAction<S>>;

export interface LocalMasterActions {
  masterAcceptOrder: (orderId: string, input: { master: Master; etaMinutes: number }) => boolean;
  masterDepart: (orderId: string, etaMinutes: number) => void;
  masterArrive: (orderId: string) => void;
  masterCancelOrder: (orderId: string, reason: string) => void;
  masterFinish: (orderId: string, workNote: string) => void;
}

export function buildLocalMasterActions<S extends StateWithOrders>(
  setState: Setter<S>,
): LocalMasterActions {
  const patchByBuilder = (
    orderId: string,
    build: (order: LiveOrder) => Partial<LiveOrder> | null,
  ): boolean => {
    let applied = false;

    setState((prev) => {
      const order = prev.orders.find((item) => item.id === orderId);
      if (!order) return prev;

      const patch = build(order);
      if (!patch) return prev;

      applied = true;
      return {
        ...prev,
        orders: prev.orders.map((item) => (item.id === orderId ? { ...item, ...patch } : item)),
      };
    });

    return applied;
  };

  return {
    masterAcceptOrder: (orderId, input) =>
      patchByBuilder(orderId, (order) => buildAcceptPatch(order, input.master, input.etaMinutes)),

    masterDepart: (orderId, etaMinutes) => {
      patchByBuilder(orderId, (order) => buildDepartPatch(order, etaMinutes));
    },

    masterArrive: (orderId) => {
      patchByBuilder(orderId, buildArrivePatch);
    },

    masterCancelOrder: (orderId, reason) => {
      patchByBuilder(orderId, (order) => buildMasterCancelPatch(order, reason));
    },

    masterFinish: (orderId, workNote) => {
      patchByBuilder(orderId, (order) => buildFinishPatch(order, workNote, new Date()));
    },
  };
}
