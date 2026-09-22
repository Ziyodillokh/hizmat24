import { describe, expect, it } from 'vitest';
import { reviveMasterState, serializeMasterState, type MasterState } from './master-persistence';
import { EMPTY_MASTER_PROFILE } from '@/lib/masterProfile';

const NOW = new Date(2026, 8, 12, 14, 30);

function state(extra: Partial<MasterState> = {}): MasterState {
  return {
    profile: {
      about: 'Rozetka va lyustra oʻrnataman.',
      isAvailable: true,
      availableSince: NOW,
      updatedAt: NOW,
    },
    application: {
      message: 'Hizmat24 — usta boʻlish uchun ariza\n…',
      createdAt: NOW,
      openedChannels: [{ channel: 'telegram', openedAt: NOW }],
    },
    declinedOrderIds: ['live-104901'],
    ...extra,
  };
}

const roundTrip = (value: MasterState): MasterState | null =>
  reviveMasterState(JSON.parse(JSON.stringify(serializeMasterState(value))));

describe('serializeMasterState / reviveMasterState', () => {
  it('borish va qaytish maʼlumotni yoʻqotmaydi', () => {
    const result = roundTrip(state());
    expect(result?.profile).toEqual(state().profile);
    expect(result?.application?.message).toBe(state().application?.message);
    expect(result?.application?.openedChannels).toHaveLength(1);
  });

  it('`Date` qiymatlari `Date` boʻlib qaytadi — satr emas', () => {
    const result = roundTrip(state());
    expect(result?.profile.updatedAt).toBeInstanceOf(Date);
    expect(result?.application?.createdAt).toBeInstanceOf(Date);
    expect(result?.application?.openedChannels[0].openedAt).toBeInstanceOf(Date);
  });

  it('arizasiz holat arizasiz qaytadi', () => {
    expect(roundTrip(state({ application: null }))?.application).toBeNull();
  });
});

describe('reviveMasterState — buzuq maʼlumot', () => {
  it('obyekt boʻlmasa null', () => {
    expect(reviveMasterState(null)).toBeNull();
    expect(reviveMasterState('{}')).toBeNull();
  });

  it('boʻsh obyektda boʻsh profil — qulamaydi', () => {
    const result = reviveMasterState({});
    expect(result?.profile).toEqual(EMPTY_MASTER_PROFILE);
    expect(result?.application).toBeNull();
  });

  it('bitta buzuq maydon BUTUN profilni tashlamaydi', () => {
    const stored = serializeMasterState(state());
    const result = reviveMasterState({
      ...stored,
      profile: { ...stored.profile, about: 42 },
    });
    // Buzuqlari zaxira qiymatga tushadi, qolgani saqlanadi.
    expect(result?.profile.about).toBe('');
    expect(result?.profile.isAvailable).toBe(true);
  });

  /*
   * Eski qurilmada saqlangan profilda kasb, tajriba, tumanlar va ish vaqti
   * ham bor. Ular endi oʻqilmaydi — lekin smena holati va ariza YOʻQOLMASLIGI
   * kerak, chunki foydalanuvchi uchun bu yangilanish hech narsani buzmasligi
   * lozim.
   */
  it('eski, keng profilda ham smena va ariza saqlanadi', () => {
    const stored = serializeMasterState(state());
    const result = reviveMasterState({
      ...stored,
      profile: {
        ...stored.profile,
        profession: 'Smesitel ustasi',
        experienceLevel: 'NEW',
        claimsCertificate: true,
        districts: ['Chilonzor'],
        workFrom: 8,
        workTo: 20,
      },
    });
    expect(result?.profile).toEqual(state().profile);
    expect(result?.application?.openedChannels).toHaveLength(1);
  });

  it('yopiq smenada boshlanish vaqti majburan tozalanadi', () => {
    const stored = serializeMasterState(state());
    const result = reviveMasterState({
      ...stored,
      profile: { ...stored.profile, isAvailable: false, availableSince: NOW.toISOString() },
    });
    expect(result?.profile.availableSince).toBeNull();
  });

  it('eski yozuvda yangi maydonlar standart qiymat oladi', () => {
    const stored = serializeMasterState(state());
    const withoutDeclined = { ...stored };
    delete (withoutDeclined as Record<string, unknown>).declinedOrderIds;
    const legacyProfile = { ...stored.profile };
    delete (legacyProfile as Record<string, unknown>).availableSince;

    const result = reviveMasterState({ ...withoutDeclined, profile: legacyProfile });
    expect(result?.declinedOrderIds).toEqual([]);
    expect(result?.profile.availableSince).toBeNull();
    expect(result?.profile.about).toBe('Rozetka va lyustra oʻrnataman.');
  });

  it('rad etilganlar roʻyxati tozalanadi: string boʻlmaganlar va dublikatlar', () => {
    const stored = serializeMasterState(state());
    const result = reviveMasterState({
      ...stored,
      declinedOrderIds: ['a', 'a', 7, null, 'b'],
    });
    expect(result?.declinedOrderIds).toEqual(['a', 'b']);
  });

  it('rad etilganlar roʻyxati chegaradan oshmaydi', () => {
    const many = Array.from({ length: 250 }, (_, index) => `o-${index}`);
    const stored = serializeMasterState(state({ declinedOrderIds: many }));
    expect(stored.declinedOrderIds).toHaveLength(200);
    expect(reviveMasterState(stored)?.declinedOrderIds).toHaveLength(200);
  });

  it('matnsiz ariza null boʻladi, profil esa qoladi', () => {
    const stored = serializeMasterState(state());
    const result = reviveMasterState({ ...stored, application: { message: '', createdAt: 'x' } });
    expect(result?.application).toBeNull();
    expect(result?.profile.about).toBe('Rozetka va lyustra oʻrnataman.');
  });

  it('buzuq kanal hodisasi arizani tashlamaydi', () => {
    const stored = serializeMasterState(state());
    const result = reviveMasterState({
      ...stored,
      application: {
        ...stored.application,
        openedChannels: [{ channel: 'pochta', openedAt: NOW.toISOString() }, null],
      },
    });
    expect(result?.application).not.toBeNull();
    expect(result?.application?.openedChannels).toEqual([]);
  });
});
