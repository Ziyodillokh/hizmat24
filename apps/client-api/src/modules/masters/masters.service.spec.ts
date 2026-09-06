import { MasterExperienceLevel, OrderStatus, Prisma } from '@prisma/client';
import { ForbiddenResourceException } from '@client/common/exceptions/domain.exception';
import { MastersService } from './masters.service';

const MASTER = {
  id: 'master-1',
  fullName: 'Akmal Rahimov',
  photoUrl: null,
  phoneNumber: '+998901112233',
  experienceLevel: MasterExperienceLevel.EXPERIENCED,
  hasGovCertificate: true,
  ratingAvg: new Prisma.Decimal('4.80'),
  completedOrdersCount: 30,
};

describe('MastersService (TZ 2.4, 6.2)', () => {
  let service: MastersService;
  let orderFindFirst: jest.Mock;
  let masterFindUniqueOrThrow: jest.Mock;

  beforeEach(() => {
    orderFindFirst = jest.fn().mockResolvedValue({ status: OrderStatus.IN_PROGRESS });
    masterFindUniqueOrThrow = jest.fn().mockResolvedValue(MASTER);

    service = new MastersService({
      order: { findFirst: orderFindFirst },
      master: { findUniqueOrThrow: masterFindUniqueOrThrow },
    } as never);
  });

  it("aktiv buyurtma davomida telefon raqamini ko'rsatadi", async () => {
    const profile = await service.findProfileForClient('master-1', 'client-1');

    expect(profile.phoneNumber).toBe('+998901112233');
    expect(profile.ratingAvg).toBe(4.8);
  });

  it('buyurtma yopilgandan keyin telefon raqamini yashiradi', async () => {
    orderFindFirst.mockResolvedValue({ status: OrderStatus.CLOSED });

    const profile = await service.findProfileForClient('master-1', 'client-1');

    expect(profile.phoneNumber).toBeNull();
  });

  it("usta bilan bog'liq buyurtmasi yo'q mijozga profilni bermaydi", async () => {
    orderFindFirst.mockResolvedValue(null);

    await expect(service.findProfileForClient('master-1', 'begona')).rejects.toThrow(
      ForbiddenResourceException,
    );
    expect(masterFindUniqueOrThrow).not.toHaveBeenCalled();
  });
});
