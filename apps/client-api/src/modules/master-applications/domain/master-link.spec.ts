import { decideMasterLink } from './master-link';

const master = (id: string, userId: string | null) => ({ id, userId });

describe('decideMasterLink', () => {
  it('usta yozuvi umuman yoʻq boʻlsa — yangisi yaratiladi', () => {
    expect(decideMasterLink({ byUser: null, byPhone: null })).toEqual({ kind: 'create' });
  });

  it('eski, hisobsiz usta topilsa — unga bogʻlanadi', () => {
    expect(decideMasterLink({ byUser: null, byPhone: master('m-1', null) })).toEqual({
      kind: 'link',
      masterId: 'm-1',
    });
  });

  it('foydalanuvchi allaqachon usta boʻlsa — ikkinchi hisob ochilmaydi', () => {
    expect(
      decideMasterLink({ byUser: master('m-1', 'u-1'), byPhone: master('m-1', 'u-1') }),
    ).toEqual({ kind: 'conflict', code: 'ALREADY_MASTER' });
  });

  it('telefon boshqa odamning hisobida boʻlsa — odam hal qiladi', () => {
    expect(decideMasterLink({ byUser: null, byPhone: master('m-2', 'u-2') })).toEqual({
      kind: 'conflict',
      code: 'PHONE_TAKEN',
    });
  });
});
