import { NotFoundException } from '@nestjs/common';
import { AdminMasterDetailService } from './admin-master-detail.service';

const row = {
  id: 'm-1',
  fullName: 'Akmal Rahimov',
  phoneNumber: '+998901234567',
  photoUrl: null,
  experienceLevel: 'EXPERIENCED',
  hasGovCertificate: true,
  ratingAvg: 4.8,
  ratingCount: 12,
  completedOrdersCount: 9,
  status: 'AVAILABLE',
  isActive: true,
  userId: 'u-1',
  createdAt: new Date('2026-09-01T10:00:00.000Z'),
  profile: {
    about: 'Oʻn yillik tajriba',
    districts: ['Namangan shahri'],
    workFrom: 8,
    workTo: 20,
    claimsCertificate: true,
    availableSince: new Date('2026-09-25T06:00:00.000Z'),
  },
  categories: [{ category: { name: 'Kran taʼmirlash' } }],
  orders: [
    {
      id: 'o-1',
      shortId: 'HZ-104901',
      status: 'RATED',
      price: 137_600,
      createdAt: new Date('2026-09-20T10:00:00.000Z'),
      category: { name: 'Kran taʼmirlash' },
    },
  ],
  ratings: [
    {
      stars: 5,
      comment: 'Tez keldi',
      tags: ['tez'],
      createdAt: new Date('2026-09-20T12:00:00.000Z'),
      order: { shortId: 'HZ-104901' },
    },
  ],
};

const service = (found: unknown, cancelled = 3) =>
  new AdminMasterDetailService({
    master: { findUnique: () => Promise.resolve(found) },
    order: { count: () => Promise.resolve(cancelled) },
  } as never);

describe('AdminMasterDetailService', () => {
  it('ustaning toʻliq kartasini yigʻadi', async () => {
    // Act
    const detail = await service(row).read('m-1');

    // Assert
    expect(detail.fullName).toBe('Akmal Rahimov');
    expect(detail.categories).toEqual(['Kran taʼmirlash']);
    expect(detail.orders).toHaveLength(1);
    expect(detail.reviews[0]).toMatchObject({ orderShortId: 'HZ-104901', stars: 5 });
  });

  /*
   * Telefon raqami tafsilotda ham MASKALANGAN: toʻliq koʻrish alohida
   * amal va u auditga yoziladi. Tafsilot sahifasi buni chetlab oʻtmasin.
   */
  it('telefon raqami maskalangan holda qaytadi', async () => {
    const detail = await service(row).read('m-1');

    expect(detail.phoneMasked).not.toContain('9012345');
    expect(detail.phoneMasked).toContain('*');
  });

  /*
   * Platforma tasdiqlagan sertifikat ustaning DAʼVOSIDAN ajratilgan —
   * panelda bu farq koʻrinishi kerak, aks holda daʼvo tasdiq kabi
   * oʻqilardi.
   */
  it('tasdiqlangan sertifikat va daʼvo alohida qaytadi', async () => {
    const detail = await service(row).read('m-1');

    expect(detail.hasGovCertificate).toBe(true);
    expect(detail.profile?.claimsCertificate).toBe(true);
  });

  it('bekor qilish ulushi bajarilgan va bekor qilingan ishdan hisoblanadi', async () => {
    const detail = await service(row, 3).read('m-1');

    // 3 / (9 + 3) = 25%
    expect(detail.cancelledByMasterCount).toBe(3);
    expect(detail.cancelRatePercent).toBe(25);
  });

  /* Hech qachon ishlamagan ustada nol foiz «hech bekor qilmagan» degan yolgʻon boʻlardi. */
  it('ishlamagan ustada ulush `null`', async () => {
    const detail = await service({ ...row, completedOrdersCount: 0 }, 0).read('m-1');

    expect(detail.cancelRatePercent).toBeNull();
  });

  it('profil toʻldirilmagan boʻlsa smena yopiq deb qaraladi', async () => {
    const detail = await service({ ...row, profile: null }).read('m-1');

    expect(detail.profile).toBeNull();
    expect(detail.isOnShift).toBe(false);
  });

  it('usta topilmasa 404', async () => {
    await expect(service(null).read('yoʻq')).rejects.toBeInstanceOf(NotFoundException);
  });
});
