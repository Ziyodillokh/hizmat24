import { describe, expect, it } from 'vitest';
import { EMPTY_MASTER_PROFILE, type MasterProfile } from './masterProfile';
import {
  MAX_REQUESTED_CATEGORIES,
  submitBlocker,
  toApplicationView,
  toSubmitPayload,
  VIEW_TITLES,
} from './masterApplication';

const ABOUT = 'Oʻn yildan beri santexnika bilan shugʻullanaman, kran va quvurlar.';

const profileWith = (about = ''): MasterProfile => ({ ...EMPTY_MASTER_PROFILE, about });

const CATS = ['cat-1', 'cat-2'];

const NAME = 'Sardor Ibragimov';

describe('toSubmitPayload', () => {
  it('ism va tanlovdan payload yigʻadi', () => {
    const payload = toSubmitPayload({
      profile: profileWith(ABOUT),
      fullName: `  ${NAME}  `,
      requestedCategoryIds: CATS,
    });

    expect(payload).toEqual({
      fullName: NAME,
      requestedCategoryIds: CATS,
      about: ABOUT,
    });
  });

  /*
   * Eng muhim oʻzgarish: kasb, tajriba, sertifikat, tuman va ish vaqti
   * serverga YUBORILMAYDI. Ular ustadan soʻralmaydi, demak ilova ular
   * haqida hech narsa «bilmaydi» va toʻqib yubormaydi.
   */
  it('soʻralmaydigan maydonlar payloadda YOʻQ', () => {
    const payload = toSubmitPayload({
      profile: profileWith(ABOUT),
      fullName: NAME,
      requestedCategoryIds: CATS,
    });

    for (const key of [
      'phoneNumber',
      'profession',
      'experienceLevel',
      'claimsCertificate',
      'districts',
      'workFrom',
      'workTo',
    ]) {
      expect(payload && key in payload).toBe(false);
    }
  });

  it('tanishtiruvsiz ham yuboriladi — maydon umuman qoʻshilmaydi', () => {
    const payload = toSubmitPayload({
      profile: profileWith('   '),
      fullName: NAME,
      requestedCategoryIds: CATS,
    });

    expect(payload).not.toBeNull();
    expect(payload && 'about' in payload).toBe(false);
  });

  it('yarim yozilgan tanishtiruvda null', () => {
    expect(
      toSubmitPayload({
        profile: profileWith('qisqa'),
        fullName: NAME,
        requestedCategoryIds: CATS,
      }),
    ).toBeNull();
  });

  it('ismsiz yoki bitta soʻzli ismda null', () => {
    expect(
      toSubmitPayload({ profile: profileWith(), fullName: '  ', requestedCategoryIds: CATS }),
    ).toBeNull();
    expect(
      toSubmitPayload({ profile: profileWith(), fullName: 'Sardor', requestedCategoryIds: CATS }),
    ).toBeNull();
  });

  it('xizmat tanlanmagan boʻlsa null', () => {
    expect(
      toSubmitPayload({ profile: profileWith(), fullName: NAME, requestedCategoryIds: [] }),
    ).toBeNull();
  });

  it('takroriy tanlovni birlashtiradi va ortiqcha boʻshliqni yigʻishtiradi', () => {
    const payload = toSubmitPayload({
      profile: profileWith(),
      fullName: 'Sardor   Ibragimov',
      requestedCategoryIds: ['a', 'a', 'b'],
    });
    expect(payload?.requestedCategoryIds).toEqual(['a', 'b']);
    expect(payload?.fullName).toBe(NAME);
  });

  it('profil obyektini oʻzgartirmaydi', () => {
    const profile = profileWith(ABOUT);
    const before = JSON.stringify(profile);
    toSubmitPayload({ profile, fullName: NAME, requestedCategoryIds: CATS });
    expect(JSON.stringify(profile)).toBe(before);
  });
});

describe('submitBlocker', () => {
  it('ism va xizmat boʻlsa — boshqa hech narsa soʻralmaydi', () => {
    expect(
      submitBlocker({ profile: EMPTY_MASTER_PROFILE, fullName: NAME, requestedCategoryIds: CATS }),
    ).toBeNull();
  });

  it('sabablarni tartib bilan aytadi: avval ism, keyin xizmat', () => {
    expect(
      submitBlocker({ profile: profileWith(), fullName: '', requestedCategoryIds: [] }),
    ).toContain('Ism');
    expect(
      submitBlocker({ profile: profileWith(), fullName: NAME, requestedCategoryIds: [] }),
    ).toContain('xizmat');
  });

  it('yarim yozilgan tanishtiruvni tugma bosilgunicha aytadi', () => {
    expect(
      submitBlocker({ profile: profileWith('qisqa'), fullName: NAME, requestedCategoryIds: CATS }),
    ).not.toBeNull();
  });

  it('chegaradan koʻp xizmatni rad etadi', () => {
    const many = Array.from({ length: MAX_REQUESTED_CATEGORIES + 1 }, (_, i) => `c${i}`);
    expect(
      submitBlocker({ profile: profileWith(), fullName: NAME, requestedCategoryIds: many }),
    ).toContain(String(MAX_REQUESTED_CATEGORIES));
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
