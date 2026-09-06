import { ActorType, AuditAction, Prisma } from '@prisma/client';
import { AuditService } from './audit.service';

describe('AuditService (TZ 6.4)', () => {
  let service: AuditService;
  let create: jest.Mock;

  beforeEach(() => {
    create = jest.fn().mockResolvedValue({});
    service = new AuditService({ auditLog: { create } } as never);
  });

  it('audit yozuvini yaratadi', async () => {
    await service.record({
      action: AuditAction.SAFETY_FLAG_RAISED,
      orderId: 'order-1',
      actorType: ActorType.CLIENT,
      actorId: 'client-1',
      ipAddress: '10.0.0.1',
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: AuditAction.SAFETY_FLAG_RAISED,
        orderId: 'order-1',
        actorId: 'client-1',
        ipAddress: '10.0.0.1',
      }),
    });
  });

  it("metadata bo'lmasa JSON null yozadi", async () => {
    await service.record({ action: AuditAction.ORDER_CANCELLED, actorType: ActorType.SYSTEM });

    expect(create.mock.calls[0][0].data.metadata).toBe(Prisma.JsonNull);
  });

  it("tranzaksiya klienti berilsa o'sha klientdan foydalanadi", async () => {
    // Arrange
    const txCreate = jest.fn().mockResolvedValue({});

    // Act
    await service.record({ action: AuditAction.MASTER_ASSIGNED, actorType: ActorType.SYSTEM }, {
      auditLog: { create: txCreate },
    } as never);

    // Assert
    expect(txCreate).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it("faqat create amali mavjud — yozuvni o'zgartirish/o'chirish API si yo'q", () => {
    const methods = Object.getOwnPropertyNames(AuditService.prototype);

    expect(methods).toEqual(['constructor', 'record']);
  });
});
