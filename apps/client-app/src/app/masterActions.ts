/**
 * Buyurtmaga tushadigan oʻzgarishlarning YAGONA quruvchilari — sof funksiyalar.
 *
 * `store.tsx` faqat «kim, qachon» ni hal qiladi; «nima yoziladi» shu yerda va
 * test bilan qoplanadi. Ikkala aktyorning patchi bir joyda turadi, chunki ular
 * AYNAN bir xil maydonlarni yozadi: taymer `ASSIGNED` ga oʻtkazganda ham,
 * usta qabul qilganda ham `master` va `etaMinutes` toʻldiriladi — farqi faqat
 * kim ekanida va vaqt qayerdan kelganida.
 *
 * Har bir quruvchi kirish obyektini OʻZGARTIRMAYDI: qaytadigan patch yangi
 * obyekt, `master` esa nusxa.
 */
import { ORDER_STATUS, type OrderStatus } from '@/lib/orderStateMachine';
import { ETA_OPTIONS, WORK_NOTE_MAX } from '@/lib/masterJobs';
import { MASTERS, masterById } from '@/mocks/masters';
import type { Master } from '@/mocks/types';
import type { LiveOrder } from './types';

/**
 * Buyurtmaga usta tayinlaydi (demo taymeri yoʻli).
 *
 * Foydalanuvchi sevimli roʻyxatidan usta tanlagan boʻlsa AYNAN shu usta
 * tayinlanadi. Topilmagan `id` zaxira ustaga tushadi: qurilmadagi yozuv
 * eskirgan boʻlsa buyurtma ustasiz qolmasligi kerak.
 */
const assignMaster = (preferredMasterId: string | null): Master => ({
  ...(masterById(preferredMasterId ?? undefined) ?? MASTERS.akmal),
});

/** Demo taymeri belgilaydigan yetib kelish vaqti (daqiqa). */
export const DEMO_ETA_MINUTES = 15;

/**
 * Server oʻtishining buyurtmaga tushadigan oʻzgarishi.
 *
 * `applyServerStep` (taymer) va `advanceOrder` (demo tugmasi) AYNAN bir xil
 * ishni bajaradi. Mantiq ikki joyda takrorlansa, tanlangan ustani faqat
 * bittasiga qoʻshish jimgina nomuvofiqlik berardi.
 */
export function buildStepPatch(
  order: Pick<LiveOrder, 'preferredMasterId'>,
  next: OrderStatus,
  now: Date,
): Partial<LiveOrder> {
  const patch: Partial<LiveOrder> = { status: next };

  if (next === ORDER_STATUS.ASSIGNED) {
    patch.master = assignMaster(order.preferredMasterId);
    patch.etaMinutes = DEMO_ETA_MINUTES;
  }
  if (next === ORDER_STATUS.COMPLETED_BY_MASTER) {
    patch.completedAt = now;
    patch.etaMinutes = null;
  }

  return patch;
}

/**
 * Usta taklifni qabul qildi; `null` — taklif allaqachon yaroqsiz.
 *
 * Qorovul shu yerda, chunki qoida bitta: qabul qilinadigan buyurtma —
 * qidiruvdagi va boshqa usta olmagan buyurtma. `store` uni `setState` ICHIDA
 * chaqiradi, demak taymer bilan poyga xavfsiz.
 *
 * `handledByMaster: true` uchta natijani birdan beradi: taymer buyurtmaga
 * tegmaydi, `advanceOrder` no-op boʻladi, mijozdagi «Demo ·» chip yoʻqoladi.
 *
 * `etaMinutes` USTANING tanlovi. Qattiq yozilgan 15 usta yoʻlida oʻladi:
 * mijoz ekranidagi raqam endi tirik odam aytgan vaqt.
 *
 * `queuePosition` tozalanadi — navbat oʻrni tayinlangan buyurtmada eskirgan
 * maʼlumot boʻlib qolardi.
 */
export function buildAcceptPatch(
  order: Pick<LiveOrder, 'status' | 'handledByMaster'>,
  master: Master,
  etaMinutes: number,
): Partial<LiveOrder> | null {
  const isOffer =
    order.status === ORDER_STATUS.SEARCHING || order.status === ORDER_STATUS.SEARCHING_QUEUED;
  if (!isOffer || order.handledByMaster) return null;
  if (!ETA_OPTIONS.includes(etaMinutes)) return null;

  return {
    status: ORDER_STATUS.ASSIGNED,
    master: { ...master },
    etaMinutes,
    handledByMaster: true,
    queuePosition: null,
  };
}

/**
 * Usta yoʻlga chiqdi; `null` — buyurtma bu holatda emas.
 *
 * ETA qayta tanlanadi: qabul qilishdagi vaqt «hozirdan» emas, «yoʻlga
 * chiqqandan» hisoblanishi kerak. Mijoz ekranidagi raqam shu paytda
 * yangilanadi va u tirik odam aytgan vaqt boʻlib qoladi.
 */
export function buildDepartPatch(
  order: Pick<LiveOrder, 'status' | 'handledByMaster'>,
  etaMinutes: number,
): Partial<LiveOrder> | null {
  if (order.status !== ORDER_STATUS.ASSIGNED || !order.handledByMaster) return null;
  if (!ETA_OPTIONS.includes(etaMinutes)) return null;

  return { status: ORDER_STATUS.MASTER_EN_ROUTE, etaMinutes };
}

/**
 * Usta yetib keldi; keyingi qadam MIJOZNIKI — shaxsni tasdiqlash.
 *
 * `etaMinutes` tozalanadi: usta eshik oldida turganda «~20 daqiqada yetib
 * keladi» qatori mijoz ekranida yolgʻon boʻlib qolardi.
 */
export function buildArrivePatch(
  order: Pick<LiveOrder, 'status' | 'handledByMaster'>,
): Partial<LiveOrder> | null {
  if (order.status !== ORDER_STATUS.MASTER_EN_ROUTE || !order.handledByMaster) return null;

  return { status: ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION, etaMinutes: null };
}

/**
 * Usta ishni bekor qildi — ilovada `cancelledBy: "MASTER"` yoziladigan
 * YAGONA joy. Mijoz ekrani shu maydonga qarab «Usta bekor qildi» deydi.
 */
export function buildMasterCancelPatch(
  order: Pick<LiveOrder, 'status' | 'handledByMaster'>,
  reason: string,
): Partial<LiveOrder> | null {
  const canCancel =
    order.status === ORDER_STATUS.ASSIGNED || order.status === ORDER_STATUS.MASTER_EN_ROUTE;
  if (!canCancel || !order.handledByMaster) return null;

  const text = reason.trim();
  if (text.length === 0) return null;

  return {
    status: ORDER_STATUS.CANCELLED,
    cancelReason: text,
    cancelledBy: 'MASTER',
    etaMinutes: null,
  };
}

/**
 * Usta ishni yakunladi; keyingi qadam MIJOZNIKI — baho.
 *
 * `completedAt` va `etaMinutes` aynan `buildStepPatch` dagidek yoziladi:
 * ikki yoʻl bitta natijani berishi shart, aks holda chek ikki xil boʻlardi.
 *
 * Izoh ixtiyoriy: yozilmagan boʻlsa `null` — mijoz ekranida «usta izoh
 * yozmagan» deb chiziladi, boʻsh satr emas.
 */
export function buildFinishPatch(
  order: Pick<LiveOrder, 'status' | 'handledByMaster'>,
  workNote: string,
  now: Date,
): Partial<LiveOrder> | null {
  if (order.status !== ORDER_STATUS.IN_PROGRESS || !order.handledByMaster) return null;

  const note = workNote.trim().slice(0, WORK_NOTE_MAX);

  return {
    status: ORDER_STATUS.COMPLETED_BY_MASTER,
    completedAt: now,
    etaMinutes: null,
    workNote: note.length > 0 ? note : null,
  };
}
