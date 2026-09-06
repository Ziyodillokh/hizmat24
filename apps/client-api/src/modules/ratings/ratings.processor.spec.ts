import { JOB_RECALCULATE_MASTER_RATING } from '@shared/index';
import { RatingsProcessor } from './ratings.processor';

describe('RatingsProcessor (TZ 3.8)', () => {
  let processor: RatingsProcessor;
  let recalculateMasterRating: jest.Mock;

  beforeEach(() => {
    recalculateMasterRating = jest.fn().mockResolvedValue(undefined);
    processor = new RatingsProcessor({ recalculateMasterRating } as never);
  });

  it('reyting qayta hisoblash jobini bajaradi', async () => {
    await processor.process({
      name: JOB_RECALCULATE_MASTER_RATING,
      data: { masterId: 'master-1' },
    } as never);

    expect(recalculateMasterRating).toHaveBeenCalledWith('master-1');
  });

  it('boshqa job turlariga aralashmaydi', async () => {
    await processor.process({ name: 'other', data: { masterId: 'master-1' } } as never);

    expect(recalculateMasterRating).not.toHaveBeenCalled();
  });
});
