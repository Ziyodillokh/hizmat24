import { HttpStatus, Logger } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderStatus, Prisma } from '@prisma/client';
import { ORDER_EVENTS, OrderCreatedEvent } from '@shared/index';
import { PrismaService } from '@client/infra/prisma/prisma.service';
import { DomainException } from '@client/common/exceptions/domain.exception';
import { MatchingService } from '@client/modules/matching/matching.service';
import { ORDER_RELATIONS, OrdersRepository } from '../../infrastructure/orders.repository';
import { presentOrder, type OrderView } from '../../infrastructure/order.presenter';
import { CreateOrderCommand } from './create-order.command';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand, OrderView> {
  private readonly logger = new Logger(CreateOrderHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly matching: MatchingService,
    private readonly events: EventEmitter2,
  ) {}

  async execute(command: CreateOrderCommand): Promise<OrderView> {
    if (command.idempotencyKey) {
      const existing = await this.orders.findByIdempotencyKey(
        command.clientId,
        command.idempotencyKey,
      );
      if (existing) return presentOrder(existing);
    }

    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: command.categoryId },
    });

    if (!category || !category.isActive) {
      throw new DomainException(
        'CATEGORY_NOT_AVAILABLE',
        'Tanlangan xizmat turi mavjud emas yoki faol emas',
        HttpStatus.BAD_REQUEST,
        { categoryId: command.categoryId },
      );
    }

    const order = await this.createOrder(command, category.basePrice);

    this.events.emit(
      ORDER_EVENTS.CREATED,
      new OrderCreatedEvent(order.id, order.clientId, order.categoryId, order.isUrgent),
    );

    // Qidiruv fonda ishlaydi — HTTP javob kutib turmaydi (TZ 9.5).
    //
    // BullMQ ga yozish DB tranzaksiyasidan tashqarida, shu sababli u tushib
    // qolishi mumkin. Bu holat buyurtmani yo'qotmaydi: `MatchingScheduler` har
    // 10 soniyada DB dagi qidiruv kutayotgan buyurtmalarni ham tekshiradi.
    try {
      await this.matching.requestMatching(order.id);
    } catch (error) {
      this.logger.error(
        { err: error, orderId: order.id },
        "Qidiruv navbatiga yozib bo'lmadi — buyurtma keyingi sweep'da tiklanadi",
      );
    }

    this.logger.log({ orderId: order.id, categoryId: category.id }, 'Buyurtma yaratildi');

    return presentOrder(order);
  }

  /**
   * Idempotentlik (biznes-qoida 5.6): bir xil `Idempotency-Key` bilan takroriy
   * so'rov kelsa, unique constraint ishga tushadi va mavjud buyurtma qaytariladi.
   */
  private async createOrder(command: CreateOrderCommand, price: number) {
    try {
      return await this.prisma.order.create({
        data: {
          clientId: command.clientId,
          categoryId: command.categoryId,
          description: command.description,
          attachmentUrls: command.attachmentUrls,
          isUrgent: command.isUrgent,
          price,
          status: OrderStatus.SEARCHING,
          clientAddress: command.clientAddress as unknown as Prisma.InputJsonValue,
          addressLat: command.clientAddress.lat,
          addressLng: command.clientAddress.lng,
          idempotencyKey: command.idempotencyKey,
        },
        include: ORDER_RELATIONS,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002' &&
        command.idempotencyKey
      ) {
        const existing = await this.orders.findByIdempotencyKey(
          command.clientId,
          command.idempotencyKey,
        );
        if (existing) return existing;
      }
      throw error;
    }
  }
}
