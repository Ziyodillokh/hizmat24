import { describe, expect, it } from 'vitest';
import {
  buildAcceptPatch,
  buildArrivePatch,
  buildDepartPatch,
  buildFinishPatch,
  buildMasterCancelPatch,
  buildStepPatch,
  DEMO_ETA_MINUTES,
} from './masterActions';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { buildSelfMaster, EMPTY_MASTER_STATS, SELF_MASTER_ID } from '@/lib/masterIdentity';

const self = buildSelfMaster({
  fullName: 'Ziyodullo',
  phoneNumber: '+998901234567',
  profession: 'Santexnik',
  stats: EMPTY_MASTER_STATS,
});

const offer = (patch: Partial<{ status: typeof ORDER_STATUS[keyof typeof ORDER_STATUS]; handledByMaster: boolean }> = {}) => ({
  status: ORDER_STATUS.SEARCHING,
  handledByMaster: false,
  ...patch,
});

describe('buildStepPatch', () => {
  it('tayinlashda demo usta va demo vaqt', () => {
    const patch = buildStepPatch({ preferredMasterId: null }, ORDER_STATUS.ASSIGNED, new Date());
    expect(patch.status).toBe(ORDER_STATUS.ASSIGNED);
    expect(patch.etaMinutes).toBe(DEMO_ETA_MINUTES);
    expect(patch.master).toBeTruthy();
  });

  it('yakunlashda vaqt yoziladi va ETA tozalanadi', () => {
    const now = new Date(2026, 8, 16, 12, 0);
    const patch = buildStepPatch({ preferredMasterId: null }, ORDER_STATUS.COMPLETED_BY_MASTER, now);
    expect(patch.completedAt).toBe(now);
    expect(patch.etaMinutes).toBeNull();
  });
});

describe('buildAcceptPatch', () => {
  it('qidiruvdagi buyurtmani qabul qiladi', () => {
    const patch = buildAcceptPatch(offer(), self, 20);
    expect(patch).toMatchObject({
      status: ORDER_STATUS.ASSIGNED,
      etaMinutes: 20,
      handledByMaster: true,
      queuePosition: null,
    });
    expect(patch?.master?.id).toBe(SELF_MASTER_ID);
  });

  it('navbatdagi taklif ham qabul qilinadi', () => {
    expect(buildAcceptPatch(offer({ status: ORDER_STATUS.SEARCHING_QUEUED }), self, 15)).not.toBeNull();
  });

  it('demo vaqt 15 majburlanmaydi — ustaning tanlovi yoziladi', () => {
    expect(buildAcceptPatch(offer(), self, 45)?.etaMinutes).toBe(45);
  });

  it('roʻyxatda yoʻq vaqt rad etiladi', () => {
    expect(buildAcceptPatch(offer(), self, 7)).toBeNull();
    expect(buildAcceptPatch(offer(), self, 0)).toBeNull();
  });

  it('qidiruvda boʻlmagan buyurtma qabul qilinmaydi', () => {
    [ORDER_STATUS.ASSIGNED, ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CLOSED, ORDER_STATUS.CANCELLED].forEach(
      (status) => expect(buildAcceptPatch(offer({ status }), self, 20)).toBeNull(),
    );
  });

  it('allaqachon usta olgan buyurtma ikkinchi marta olinmaydi', () => {
    expect(buildAcceptPatch(offer({ handledByMaster: true }), self, 20)).toBeNull();
  });

  it('usta nusxa boʻlib yoziladi — kirish obyekti oʻzgarmaydi', () => {
    const patch = buildAcceptPatch(offer(), self, 20);
    expect(patch?.master).not.toBe(self);
    expect(patch?.master).toEqual(self);
  });

  it('sertifikat belgisi qabul qilishda ham yolgʻon boʻlmaydi', () => {
    expect(buildAcceptPatch(offer(), self, 20)?.master?.hasGovCertificate).toBe(false);
  });
});

describe('buildDepartPatch', () => {
  it('qabul qilingan ishda yoʻlga chiqish va yangi ETA', () => {
    const patch = buildDepartPatch({ status: ORDER_STATUS.ASSIGNED, handledByMaster: true }, 30);
    expect(patch).toEqual({ status: ORDER_STATUS.MASTER_EN_ROUTE, etaMinutes: 30 });
  });

  it('usta olmagan buyurtmada ishlamaydi', () => {
    expect(buildDepartPatch({ status: ORDER_STATUS.ASSIGNED, handledByMaster: false }, 30)).toBeNull();
  });

  it('boshqa holatda va notoʻgʻri vaqtda null', () => {
    expect(buildDepartPatch({ status: ORDER_STATUS.IN_PROGRESS, handledByMaster: true }, 30)).toBeNull();
    expect(buildDepartPatch({ status: ORDER_STATUS.ASSIGNED, handledByMaster: true }, 7)).toBeNull();
  });
});

describe('buildArrivePatch', () => {
  it('yoʻldagi ishda tasdiq kutishga oʻtadi va ETA tozalanadi', () => {
    expect(buildArrivePatch({ status: ORDER_STATUS.MASTER_EN_ROUTE, handledByMaster: true })).toEqual({
      status: ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION,
      etaMinutes: null,
    });
  });

  it('boshqa holatda null', () => {
    expect(buildArrivePatch({ status: ORDER_STATUS.ASSIGNED, handledByMaster: true })).toBeNull();
    expect(buildArrivePatch({ status: ORDER_STATUS.MASTER_EN_ROUTE, handledByMaster: false })).toBeNull();
  });
});

describe('buildMasterCancelPatch', () => {
  it('cancelledBy MASTER yoziladi', () => {
    const patch = buildMasterCancelPatch(
      { status: ORDER_STATUS.ASSIGNED, handledByMaster: true },
      'Mijoz javob bermadi',
    );
    expect(patch).toEqual({
      status: ORDER_STATUS.CANCELLED,
      cancelReason: 'Mijoz javob bermadi',
      cancelledBy: 'MASTER',
      etaMinutes: null,
    });
  });

  it('yoʻlda ham bekor qilinadi, ish boshlangach — yoʻq', () => {
    expect(
      buildMasterCancelPatch({ status: ORDER_STATUS.MASTER_EN_ROUTE, handledByMaster: true }, 'Sabab'),
    ).not.toBeNull();
    expect(
      buildMasterCancelPatch({ status: ORDER_STATUS.IN_PROGRESS, handledByMaster: true }, 'Sabab'),
    ).toBeNull();
    expect(
      buildMasterCancelPatch(
        { status: ORDER_STATUS.ARRIVED_PENDING_CONFIRMATION, handledByMaster: true },
        'Sabab',
      ),
    ).toBeNull();
  });

  it('boʻsh sabab qabul qilinmaydi', () => {
    expect(buildMasterCancelPatch({ status: ORDER_STATUS.ASSIGNED, handledByMaster: true }, '   ')).toBeNull();
  });
});

describe('buildFinishPatch', () => {
  const now = new Date(2026, 8, 16, 15, 0);

  it('ish jarayonidan baho kutishga oʻtadi', () => {
    const patch = buildFinishPatch(
      { status: ORDER_STATUS.IN_PROGRESS, handledByMaster: true },
      '  Sifon almashtirildi  ',
      now,
    );
    expect(patch).toEqual({
      status: ORDER_STATUS.COMPLETED_BY_MASTER,
      completedAt: now,
      etaMinutes: null,
      workNote: 'Sifon almashtirildi',
    });
  });

  it('izohsiz yakunlansa workNote null', () => {
    expect(
      buildFinishPatch({ status: ORDER_STATUS.IN_PROGRESS, handledByMaster: true }, '   ', now)?.workNote,
    ).toBeNull();
  });

  it('uzun izoh 300 belgiga kesiladi', () => {
    const patch = buildFinishPatch(
      { status: ORDER_STATUS.IN_PROGRESS, handledByMaster: true },
      'a'.repeat(600),
      now,
    );
    expect(patch?.workNote).toHaveLength(300);
  });

  it('boshqa holatda null', () => {
    expect(buildFinishPatch({ status: ORDER_STATUS.ASSIGNED, handledByMaster: true }, 'x', now)).toBeNull();
    expect(buildFinishPatch({ status: ORDER_STATUS.IN_PROGRESS, handledByMaster: false }, 'x', now)).toBeNull();
  });
});
