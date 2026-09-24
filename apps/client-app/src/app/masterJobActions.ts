import type { Master } from '@/mocks/types';
import type { LocalMasterActions } from './localMasterActions';
import type { MasterActionResult, ServerMasterActions } from './serverMasterActions';

/**
 * Usta amallarining YAGONA shakli — ekran qaysi rejimda ekanini bilmaydi.
 *
 * Ikki dunyo bir xil savolga javob beradi («qabul qildim», «yoʻldaman»),
 * lekin ular boshqacha ishlaydi: mahalliy oqim darhol yozadi, server esa
 * javob kutadi va rad etishi mumkin. Ekranda ikki xil kod boʻlmasligi
 * uchun ikkalasi ham `Promise<MasterActionResult>` qaytaradi.
 *
 * MUHIM FARQ: serverda «qabul qilish» va «yoʻlga chiqish» — IKKI amal.
 * Usta ishni olib, keyinroq yoʻlga chiqishi mumkin va mijoz ekranida
 * «usta yoʻlda» degan yozuv faqat u haqiqatan yoʻlga chiqqanda paydo
 * boʻladi. Mahalliy oqimda ikkalasi bitta qadam edi, shuning uchun
 * `accept` u yerda ETA ni ham oladi.
 */
export interface MasterJobActions {
  accept: (orderId: string, local: LocalAcceptInput) => Promise<MasterActionResult>;
  decline: (orderId: string, reason?: string) => Promise<MasterActionResult>;
  depart: (orderId: string, etaMinutes: number) => Promise<MasterActionResult>;
  arrive: (orderId: string) => Promise<MasterActionResult>;
  finish: (orderId: string, workNote: string) => Promise<MasterActionResult>;
  cancel: (orderId: string, reason: string) => Promise<MasterActionResult>;
  /** Serverda qabul qilish ETA soʻramaydi — ekran shunga qarab oqimni tanlaydi. */
  asksEtaOnAccept: boolean;
}

export interface LocalAcceptInput {
  master: Master;
  etaMinutes: number;
}

const OK: MasterActionResult = { ok: true, message: null };
const LOCAL_FAILED: MasterActionResult = {
  ok: false,
  message: 'Bu ishni endi oʻzgartirib boʻlmaydi',
};

/** Mahalliy amallarni yagona shaklga oʻraydi — hech qanday tarmoq yoʻq. */
export function toMasterJobActions(local: LocalMasterActions): MasterJobActions {
  const done = (): Promise<MasterActionResult> => Promise.resolve(OK);

  return {
    accept: (orderId, input) =>
      Promise.resolve(local.masterAcceptOrder(orderId, input) ? OK : LOCAL_FAILED),
    // Mahalliy oqimda rad etish buyurtmani qurilmada qoldiradi va uni
    // `declinedOrderIds` yashiradi — bu ish `master-store` da bajariladi.
    decline: done,
    depart: (orderId, etaMinutes) => {
      local.masterDepart(orderId, etaMinutes);
      return done();
    },
    arrive: (orderId) => {
      local.masterArrive(orderId);
      return done();
    },
    finish: (orderId, workNote) => {
      local.masterFinish(orderId, workNote);
      return done();
    },
    cancel: (orderId, reason) => {
      local.masterCancelOrder(orderId, reason);
      return done();
    },
    asksEtaOnAccept: true,
  };
}

export const fromServerMasterActions = (server: ServerMasterActions): MasterJobActions => ({
  accept: (orderId) => server.masterAccept(orderId),
  decline: (orderId, reason) => server.masterDecline(orderId, reason),
  depart: (orderId, etaMinutes) => server.masterDepart(orderId, etaMinutes),
  arrive: (orderId) => server.masterArrive(orderId),
  finish: (orderId, workNote) => server.masterFinish(orderId, workNote),
  cancel: (orderId, reason) => server.masterCancelOrder(orderId, reason),
  asksEtaOnAccept: false,
});
