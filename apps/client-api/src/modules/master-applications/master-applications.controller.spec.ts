import type { FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from '@shared/index';
import { MasterApplicationsController } from './master-applications.controller';
import { AdminApplicationsController } from './admin-applications.controller';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';

const USER: AuthenticatedUser = { id: 'user-1', phoneNumber: '+998901112233' };
const ADMIN = { id: 'admin-1' } as AdminIdentity;
const REQUEST = {
  ip: '10.0.0.5',
  headers: { 'user-agent': 'jest' },
} as unknown as FastifyRequest;
const CONTEXT = { ipAddress: '10.0.0.5', userAgent: 'jest' };

describe('MasterApplicationsController', () => {
  it('arizani soʻrov konteksti bilan birga uzatadi', async () => {
    const submit = jest.fn().mockResolvedValue({ id: 'app-1' });
    const controller = new MasterApplicationsController({ submit } as never);
    const dto = { fullName: 'Alisher Karimov' } as never;

    await controller.submit(USER, dto, REQUEST);

    expect(submit).toHaveBeenCalledWith(USER, dto, CONTEXT);
  });

  it('oʻz arizasini faqat oʻz identifikatori boʻyicha oʻqiydi', async () => {
    const findMine = jest.fn().mockResolvedValue(null);
    const controller = new MasterApplicationsController({ findMine } as never);

    await expect(controller.findMine('user-1')).resolves.toBeNull();
    expect(findMine).toHaveBeenCalledWith('user-1');
  });
});

describe('AdminApplicationsController', () => {
  const build = (service: Record<string, jest.Mock>) =>
    new AdminApplicationsController(service as never);

  it('roʻyxat soʻrovini oʻzgartirmasdan uzatadi', async () => {
    const list = jest.fn().mockResolvedValue({ items: [], meta: {} });
    const query = { page: 1, limit: 20 } as never;

    await build({ list }).list(query);

    expect(list).toHaveBeenCalledWith(query);
  });

  it('kartani identifikator boʻyicha oladi', async () => {
    const findOne = jest.fn().mockResolvedValue({ id: 'app-1' });

    await build({ findOne }).findOne('app-1');

    expect(findOne).toHaveBeenCalledWith('app-1');
  });

  it('tasdiqlashda KIM tasdiqlaganini va kontekstni uzatadi', async () => {
    const approve = jest.fn().mockResolvedValue({ id: 'app-1' });
    const dto = { categoryIds: ['c-1'] } as never;

    await build({ approve }).approve('app-1', dto, ADMIN, REQUEST);

    expect(approve).toHaveBeenCalledWith('app-1', dto, ADMIN, CONTEXT);
  });

  it('rad etishda sabab va kontekst uzatiladi', async () => {
    const reject = jest.fn().mockResolvedValue({ id: 'app-1' });
    const dto = { reason: 'Sertifikat nusxasi oʻqilmadi' } as never;

    await build({ reject }).reject('app-1', dto, ADMIN, REQUEST);

    expect(reject).toHaveBeenCalledWith('app-1', dto, ADMIN, CONTEXT);
  });
});
