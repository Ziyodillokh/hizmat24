import { describe, expect, it } from 'vitest';
import { buildAcceptPatch, buildStepPatch, DEMO_ETA_MINUTES } from './masterActions';
import { ORDER_STATUS } from '@/lib/orderStateMachine';
import { buildSelfMaster, EMPTY_MASTER_STATS, SELF_MASTER_ID } from '@/lib/masterIdentity';

const self = buildSelfMaster({
  fullName: 'Ziyodullo',
  phoneNumber: '+998901234567',
  profession: 'Santexnik',
  experienceLevel: 'EXPERIENCED',
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
