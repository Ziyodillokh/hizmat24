import { describe, expect, it } from 'vitest';
import { EMPTY_MASTER_PROFILE, type MasterProfile } from './masterProfile';
import {
  MAX_REQUESTED_CATEGORIES,
  submitBlocker,
  toApplicationView,
  toSubmitPayload,
  VIEW_TITLES,
} from './masterApplication';

function complete(extra: Partial<MasterProfile> = {}): MasterProfile {
  return {
    ...EMPTY_MASTER_PROFILE,
    profession: 'Santexnik',
    experienceLevel: 'EXPERIENCED',
    about: 'Oʻn yildan beri santexnika bilan shugʻullanaman, kran va quvurlar.',
    districts: ['Chilonzor', 'Yunusobod'],
    ...extra,
  };
}

const CATS = ['cat-1', 'cat-2'];

describe('toSubmitPayload', () => {
  it('toʻliq profil va tanlovdan payload yigʻadi', () => {
    const payload = toSubmitPayload({ profile: complete(), fullName: ' Sardor ', requestedCategoryIds: CATS });

    expect(payload).toEqual({
      fullName: 'Sardor',
      profession: 'Santexnik',
      experienceLevel: 'EXPERIENCED',
      claimsCertificate: false,
      about: 'Oʻn yildan beri santexnika bilan shugʻullanaman, kran va quvurlar.',
      districts: ['Chilonzor', 'Yunusobod'],
      workFrom: EMPTY_MASTER_PROFILE.workFrom,
      workTo: EMPTY_MASTER_PROFILE.workTo,
      requestedCategoryIds: CATS,
    });
  });

  it('telefon raqami payloadda YOʻQ — server uni tokendan oladi', () => {
    const payload = toSubmitPayload({ profile: complete(), fullName: 'Sardor', requestedCategoryIds: CATS });
    expect(payload && 'phoneNumber' in payload).toBe(false);
  });

  it('toʻliq boʻlmagan profilda null', () => {
    expect(toSubmitPayload({ profile: complete({ about: '' }), fullName: 'Sardor', requestedCategoryIds: CATS })).toBeNull();
  });

  it('ismsiz null', () => {
    expect(toSubmitPayload({ profile: complete(), fullName: '  ', requestedCategoryIds: CATS })).toBeNull();
  });

  it('xizmat tanlanmagan boʻlsa null', () => {
    expect(toSubmitPayload({ profile: complete(), fullName: 'Sardor', requestedCategoryIds: [] })).toBeNull();
  });

  it('takroriy tanlovni birlashtiradi', () => {
    const payload = toSubmitPayload({ profile: complete(), fullName: 'S', requestedCategoryIds: ['a', 'a', 'b'] });
    expect(payload?.requestedCategoryIds).toEqual(['a', 'b']);
  });

  it('profil obyektini oʻzgartirmaydi', () => {
    const profile = complete();
    const before = JSON.stringify(profile);
    toSubmitPayload({ profile, fullName: 'S', requestedCategoryIds: CATS });
    expect(JSON.stringify(profile)).toBe(before);
  });
});

describe('submitBlocker', () => {
  it('yuborish mumkin boʻlsa null', () => {
    expect(submitBlocker({ profile: complete(), fullName: 'Sardor', requestedCategoryIds: CATS })).toBeNull();
  });

  it('sabablarni tartib bilan aytadi: avval profil, keyin ism, keyin xizmat', () => {
    expect(submitBlocker({ profile: EMPTY_MASTER_PROFILE, fullName: '', requestedCategoryIds: [] })).toContain('profil');
    expect(submitBlocker({ profile: complete(), fullName: '', requestedCategoryIds: [] })).toContain('Ism');
    expect(submitBlocker({ profile: complete(), fullName: 'S', requestedCategoryIds: [] })).toContain('xizmat');
  });

  it('chegaradan koʻp xizmatni rad etadi', () => {
    const many = Array.from({ length: MAX_REQUESTED_CATEGORIES + 1 }, (_, i) => `c${i}`);
    expect(submitBlocker({ profile: complete(), fullName: 'S', requestedCategoryIds: many })).toContain(
      String(MAX_REQUESTED_CATEGORIES),
    );
  });
});

describe('toApplicationView', () => {
  const remote = (status: 'PENDING' | 'APPROVED' | 'REJECTED', extra = {}) => ({
    id: 'a1',
    status,
    rejectionReason: null,
    createdAt: '2026-09-21T08:00:00.000Z',
    reviewedAt: null,
    ...extra,
  });

  it('ariza yoʻq → shakl', () => {
    expect(toApplicationView(null)).toEqual({ kind: 'form' });
  });

  it('kutilmoqda → yuborilgan vaqt bilan', () => {
    expect(toApplicationView(remote('PENDING'))).toEqual({ kind: 'pending', sentAt: '2026-09-21T08:00:00.000Z' });
  });

  it('tasdiqlangan', () => {
    expect(toApplicationView(remote('APPROVED', { reviewedAt: 'x' }))).toEqual({ kind: 'approved', reviewedAt: 'x' });
  });

  it('rad etilgan — sabab soʻzma-soʻz', () => {
    const view = toApplicationView(remote('REJECTED', { rejectionReason: '  Hujjat yetarli emas  ' }));
    expect(view).toEqual({ kind: 'rejected', reason: 'Hujjat yetarli emas', reviewedAt: null });
  });

  it('rad etilgan, lekin sabab boʻsh — toʻqib chiqarmaydi, ochiq aytadi', () => {
    const view = toApplicationView(remote('REJECTED', { rejectionReason: '' }));
    expect(view.kind === 'rejected' && view.reason).toBe('Sabab koʻrsatilmagan.');
  });

  it('har bir koʻrinishning sarlavhasi bor', () => {
    for (const kind of ['form', 'pending', 'approved', 'rejected'] as const) {
      expect(VIEW_TITLES[kind].length).toBeGreaterThan(0);
    }
  });
});
