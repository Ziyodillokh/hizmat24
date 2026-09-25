import type { ServiceGroup } from '@/mocks/types';

/**
 * Bosh ekrandagi YOʻNALISH kartalari.
 *
 * Ilgari bosh ekranda beshta alohida xizmat va «Barcha xizmatlar»
 * katagi turardi. Yoʻnalish ikkitaga (santexnika, elektrik) ajratilgach
 * bu roʻyxat chalgʻitardi: mijoz nima izlayotganini bilmasdan turib
 * beshta nomni oʻqishga majbur edi.
 */
export const LOCKED_BADGE = 'Tez kunda';

export const lockedMessage = (name: string): string => `${name} tez kunda ishga tushadi.`;

export interface DirectionCard {
  id: string;
  name: string;
  iconKey: string;
  /** Guruhdagi faol xizmatlar soni. */
  serviceCount: number;
  /** Xizmat yoʻq — karta qulflangan va ochilmaydi. */
  isLocked: boolean;
}

/**
 * Guruhlardan yoʻnalish kartalarini yigʻadi.
 *
 * Xizmati yoʻq guruh QULFLANADI: uni ochsa mijoz boʻsh ekranga
 * tushardi. Qulf — yashirish emas: yoʻnalish rejada borligi ochiq
 * aytiladi va mijoz keyin qaytib kelishini biladi.
 */
export const toDirectionCards = (groups: readonly ServiceGroup[]): DirectionCard[] =>
  groups.map((group) => {
    const serviceCount = group.categories.length;

    return {
      id: group.id,
      name: group.name,
      iconKey: group.iconKey,
      serviceCount,
      isLocked: serviceCount === 0,
    };
  });

/** Karta ostidagi bir qatorli izoh. */
export const directionHint = (card: DirectionCard): string =>
  card.isLocked ? LOCKED_BADGE : `${card.serviceCount} ta xizmat`;
