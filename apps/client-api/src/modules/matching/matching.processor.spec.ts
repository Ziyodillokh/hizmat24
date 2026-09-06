import { JOB_MASTER_ACK_TIMEOUT, JOB_MATCH_ORDER } from '@shared/index';
import { MatchingProcessor } from './matching.processor';

describe('MatchingProcessor', () => {
  let processor: MatchingProcessor;
  let matchOrder: jest.Mock;
  let handleAckTimeout: jest.Mock;

  beforeEach(() => {
    matchOrder = jest.fn().mockResolvedValue({ kind: 'assigned' });
    handleAckTimeout = jest.fn().mockResolvedValue(undefined);
    processor = new MatchingProcessor({ matchOrder, handleAckTimeout } as never);
  });

  it('qidiruv jobini bajaradi', async () => {
    await processor.process({
      name: JOB_MATCH_ORDER,
      data: { orderId: 'order-1', excludeMasterIds: ['master-1'] },
    } as never);

    expect(matchOrder).toHaveBeenCalledWith('order-1', ['master-1']);
  });

  it("chetlatilgan ustalar berilmasa bo'sh ro'yxat uzatadi", async () => {
    await processor.process({ name: JOB_MATCH_ORDER, data: { orderId: 'order-1' } } as never);

    expect(matchOrder).toHaveBeenCalledWith('order-1', []);
  });

  it('javob taymeri jobini bajaradi', async () => {
    await processor.process({
      name: JOB_MASTER_ACK_TIMEOUT,
      data: { orderId: 'order-1', attempt: 1 },
    } as never);

    expect(handleAckTimeout).toHaveBeenCalledWith('order-1');
  });

  it("noma'lum job turida hech narsa qilmaydi", async () => {
    await processor.process({ name: 'unknown', data: {} } as never);

    expect(matchOrder).not.toHaveBeenCalled();
    expect(handleAckTimeout).not.toHaveBeenCalled();
  });
});
