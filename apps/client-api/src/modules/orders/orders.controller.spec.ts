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

const address = { label: 'Chilonzor 9-kvartal', lat: 41.3, lng: 69.2 };

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
    await controller.createOrder(
      'client-1',
      { categoryId: 'category-1', description: 'Kran oqmoqda', clientAddress: address },
      ' key-1 ',
    );

    // Assert
    expect(commandExecute).toHaveBeenCalledWith(
      new CreateOrderCommand('client-1', 'category-1', 'Kran oqmoqda', [], false, address, 'key-1'),
    );
  });

  it("idempotency kaliti bo'sh bo'lsa null uzatadi", async () => {
    await controller.createOrder(
      'client-1',
      { categoryId: 'category-1', description: 'Kran oqmoqda', clientAddress: address },
      '   ',
    );

    expect((commandExecute.mock.calls[0][0] as CreateOrderCommand).idempotencyKey).toBeNull();
  });

  it("autentifikatsiya qilingan foydalanuvchi id sini so'rovdan olmaydi (body dan emas)", async () => {
    await controller.getOrder('client-1', 'order-1');

    expect(queryExecute).toHaveBeenCalledWith(new GetOrderQuery('order-1', 'client-1'));
  });

  it("ETA so'rovini query bus ga yuboradi", async () => {
    await controller.getEta('client-1', 'order-1');

    expect(queryExecute).toHaveBeenCalledWith(new GetOrderEtaQuery('order-1', 'client-1'));
  });

  it("chek so'rovini query bus ga yuboradi", async () => {
    await controller.getReceipt('client-1', 'order-1');

    expect(queryExecute).toHaveBeenCalledWith(new GetOrderReceiptQuery('order-1', 'client-1'));
  });

  it("tarixni sahifalash parametrlari bilan so'raydi", async () => {
    await controller.listHistory('client-1', { page: 2, limit: 50 });

    expect(queryExecute).toHaveBeenCalledWith(new ListOrderHistoryQuery('client-1', 2, 50));
  });

  it('bekor qilish sababini command ga uzatadi', async () => {
    await controller.cancelOrder('client-1', 'order-1', { reason: "fikrim o'zgardi" });

    expect(commandExecute).toHaveBeenCalledWith(
      new CancelOrderCommand('order-1', 'client-1', "fikrim o'zgardi"),
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
