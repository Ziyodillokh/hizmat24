import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notifications: {
    list: jest.Mock;
    markAsRead: jest.Mock;
    markAllAsRead: jest.Mock;
    registerDeviceToken: jest.Mock;
  };

  beforeEach(() => {
    notifications = {
      list: jest.fn().mockResolvedValue({ items: [], meta: {} }),
      markAsRead: jest.fn().mockResolvedValue(undefined),
      markAllAsRead: jest.fn().mockResolvedValue(undefined),
      registerDeviceToken: jest.fn().mockResolvedValue(undefined),
    };
    controller = new NotificationsController(notifications as never);
  });

  it("faqat oʻz bildirishnomalarini soʻraydi", async () => {
    await controller.list('user-1', { page: 1, limit: 20 });

    expect(notifications.list).toHaveBeenCalledWith('user-1', 1, 20);
  });

  it("oʻqilgan deb belgilashda foydalanuvchi id sini ham uzatadi (6.1)", async () => {
    await controller.markRead('user-1', 'notification-1');

    expect(notifications.markAsRead).toHaveBeenCalledWith('user-1', 'notification-1');
  });

  it("barchasini oʻqilgan deb belgilaydi", async () => {
    await controller.markAllRead('user-1');

    expect(notifications.markAllAsRead).toHaveBeenCalledWith('user-1');
  });

  it("qurilma tokenini roʻyxatdan oʻtkazadi", async () => {
    await controller.registerDevice('user-1', { token: 'device-token', platform: 'android' });

    expect(notifications.registerDeviceToken).toHaveBeenCalledWith(
      'user-1',
      'device-token',
      'android',
    );
  });
});
