import { describe, expect, it } from 'vitest';
import { reviveMasterState, serializeMasterState, type MasterState } from './master-persistence';
import { DISTRICTS_MAX, EMPTY_MASTER_PROFILE, TASHKENT_DISTRICTS } from '@/lib/masterProfile';

const NOW = new Date(2026, 8, 12, 14, 30);

function state(extra: Partial<MasterState> = {}): MasterState {
  return {
    profile: {
      profession: 'Smesitel ustasi',
      experienceLevel: 'NEW',
      claimsCertificate: true,
      about: 'Rozetka va lyustra oʻrnataman.',
      districts: ['Chilonzor'],
      workFrom: 8,
      workTo: 20,
      isAvailable: true,
      updatedAt: NOW,
    },
    application: {
      message: 'Hizmat24 — usta boʻlish uchun ariza\n…',
      createdAt: NOW,
      openedChannels: [{ channel: 'telegram', openedAt: NOW }],
    },
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
      profile: { ...stored.profile, profession: 'Kosmonavt', workFrom: 99 },
    });
    // Buzuqlari zaxira qiymatga tushadi, qolgani saqlanadi.
    expect(result?.profile.profession).toBeNull();
    expect(result?.profile.workFrom).toBe(EMPTY_MASTER_PROFILE.workFrom);
    expect(result?.profile.about).toBe('Rozetka va lyustra oʻrnataman.');
    expect(result?.profile.districts).toEqual(['Chilonzor']);
  });

  it('lugʻatda yoʻq tuman tushib qoladi, chegaradan ortigʻi kesiladi', () => {
    const stored = serializeMasterState(state());
    const result = reviveMasterState({
      ...stored,
      profile: { ...stored.profile, districts: ['Marsdagi tuman', ...TASHKENT_DISTRICTS] },
    });
    expect(result?.profile.districts).not.toContain('Marsdagi tuman');
    expect(result?.profile.districts).toHaveLength(DISTRICTS_MAX);
  });

  it('matnsiz ariza null boʻladi, profil esa qoladi', () => {
    const stored = serializeMasterState(state());
    const result = reviveMasterState({ ...stored, application: { message: '', createdAt: 'x' } });
    expect(result?.application).toBeNull();
    expect(result?.profile.profession).toBe('Smesitel ustasi');
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
