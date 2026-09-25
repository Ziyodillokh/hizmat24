import { CancelOrderCommand } from './application/commands/cancel-order.command';
import { ConfirmMasterCommand } from './application/commands/confirm-master.command';
import { CreateOrderCommand } from './application/commands/create-order.command';
import {
  GetOrderEtaQuery,
  GetOrderQuery,
  GetOrderReceiptQuery,
  ListOrderHistoryQuery,
} from './application/queries/get-order.query';
import { OrdersController } from './orders.controller';

import type { CreateOrderDto } from './dto/create-order.dto';

const address = { label: 'Chilonzor 9-kvartal', lat: 41.3, lng: 69.2 };

const buildDto = (overrides: Partial<CreateOrderDto> = {}): CreateOrderDto => ({
  categoryId: 'category-1',
  description: 'Kran oqmoqda',
  clientAddress: address,
  paymentMethod: 'cash',
  ...overrides,
});

describe('OrdersController (HTTP qobiq)', () => {
  let controller: OrdersController;
  let commandExecute: jest.Mock;
  let queryExecute: jest.Mock;

  beforeEach(() => {
    commandExecute = jest.fn().mockResolvedValue({ id: 'order-1' });
    queryExecute = jest.fn().mockResolvedValue({ id: 'order-1' });
    controller = new OrdersController(
      { execute: commandExecute } as never,
      { execute: queryExecute } as never,
    );
  });

  it('buyurtma yaratishda idempotency kalitini command ga uzatadi', async () => {
    // Act
    await controller.createOrder('client-1', buildDto(), ' key-1 ');

    // Assert
    expect(commandExecute).toHaveBeenCalledWith(
      new CreateOrderCommand(
        'client-1',
        'category-1',
        'Kran oqmoqda',
        1,
        [],
        false,
        address,
        'key-1',
        'cash',
        null,
        null,
      ),
    );
  });

  it('rejalashtirilgan vaqt va soʻralgan ustani command ga uzatadi', async () => {
    // Act
    await controller.createOrder(
      'client-1',
      buildDto({
        scheduledAt: '2026-09-21T09:00:00+05:00',
        preferredMasterId: '11111111-1111-4111-8111-111111111111',
      }),
    );

    // Assert
    const command = commandExecute.mock.calls[0][0] as CreateOrderCommand;
    expect(command.scheduledAt).toEqual(new Date('2026-09-21T09:00:00+05:00'));
    expect(command.preferredMasterId).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('ilova yuborgan narxni umuman oʻqimaydi (TZ 4.1)', async () => {
    // Arrange: DTO da `price` maydoni yoʻq, lekin body bilan kelishi mumkin.
    await controller.createOrder(
      'client-1',
      buildDto({ price: 1 } as unknown as Partial<CreateOrderDto>),
    );

    // Assert
    expect(JSON.stringify(commandExecute.mock.calls[0][0])).not.toContain('"price"');
  });

  it("idempotency kaliti boʻsh boʻlsa null uzatadi", async () => {
    await controller.createOrder('client-1', buildDto(), '   ');

    expect((commandExecute.mock.calls[0][0] as CreateOrderCommand).idempotencyKey).toBeNull();
  });

  it("autentifikatsiya qilingan foydalanuvchi id sini soʻrovdan olmaydi (body dan emas)", async () => {
    await controller.getOrder('client-1', 'order-1');

    expect(queryExecute).toHaveBeenCalledWith(new GetOrderQuery('order-1', 'client-1'));
  });

  it("ETA soʻrovini query bus ga yuboradi", async () => {
    await controller.getEta('client-1', 'order-1');

    expect(queryExecute).toHaveBeenCalledWith(new GetOrderEtaQuery('order-1', 'client-1'));
  });

  it("chek soʻrovini query bus ga yuboradi", async () => {
    await controller.getReceipt('client-1', 'order-1');

    expect(queryExecute).toHaveBeenCalledWith(new GetOrderReceiptQuery('order-1', 'client-1'));
  });

  it("tarixni sahifalash parametrlari bilan soʻraydi", async () => {
    await controller.listHistory('client-1', { page: 2, limit: 50 });

    expect(queryExecute).toHaveBeenCalledWith(new ListOrderHistoryQuery('client-1', 2, 50));
  });

  it('bekor qilish sababini command ga uzatadi', async () => {
    await controller.cancelOrder('client-1', 'order-1', { reason: "fikrim oʻzgardi" });

    expect(commandExecute).toHaveBeenCalledWith(
      new CancelOrderCommand('order-1', 'client-1', "fikrim oʻzgardi"),
    );
  });

  it('usta tasdiqlashda IP va User-Agent ni audit uchun uzatadi', async () => {
    // Arrange
    const request = { ip: '10.0.0.1', headers: { 'user-agent': 'Hizmat24/1.0' } };

    // Act
    await controller.confirmMaster(
      'client-1',
      'order-1',
      { confirmed: false, note: 'boshqa odam' },
      request as never,
    );

    // Assert
    expect(commandExecute).toHaveBeenCalledWith(
      new ConfirmMasterCommand(
        'order-1',
        'client-1',
        false,
        'boshqa odam',
        '10.0.0.1',
        'Hizmat24/1.0',
      ),
    );
  });
});
