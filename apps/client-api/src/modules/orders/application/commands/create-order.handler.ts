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
import { toDbPaymentMethod } from '../../domain/payment-method';
import { buildInvoice, type OrderInvoice } from '../../domain/pricing';
import { LevelDiscountService } from '../level-discount.service';
import { CreateOrderCommand } from './create-order.command';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand, OrderView> {
  private readonly logger = new Logger(CreateOrderHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersRepository,
    private readonly matching: MatchingService,
    private readonly events: EventEmitter2,
    private readonly levels: LevelDiscountService,
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

    await this.assertPreferredMasterUsable(command.preferredMasterId);

    // Narx SERVERDA hisoblanadi (TZ 4.1): asosiy narx — katalogdan, chegirma —
    // mijozning darajasidan. Ilova yuborgan hech qanday summa ishlatilmaydi.
    const discountPercent = await this.levels.percentForClient(command.clientId);
    const invoice = buildInvoice({
      base: category.basePrice,
      isUrgent: command.isUrgent,
      discountPercent,
    });

    const order = await this.createOrder(command, invoice);

    this.events.emit(
      ORDER_EVENTS.CREATED,
      new OrderCreatedEvent(order.id, order.clientId, order.categoryId, order.isUrgent),
    );

    await this.startMatching(order.id, order.scheduledAt);

    this.logger.log(
      { orderId: order.id, categoryId: category.id, total: invoice.total },
      'Buyurtma yaratildi',
    );

    return presentOrder(order);
  }

  /**
   * Qidiruv fonda ishlaydi — HTTP javob kutib turmaydi (TZ 9.5).
   *
   * Rejalashtirilgan buyurtmada job KECHIKTIRIB qoʻyiladi: ekranda
   * «Rejalashtirilgan: …» yozilib turganda hozir usta tayinlansa, bu
   * koʻrinadigan yolgʻon boʻlardi.
   *
   * BullMQ ga yozish DB tranzaksiyasidan tashqarida, shu sababli u tushib
   * qolishi mumkin. Bu holat buyurtmani yo'qotmaydi: `MatchingScheduler` har
   * 10 soniyada DB dagi qidiruv kutayotgan buyurtmalarni ham tekshiradi.
   */
  private async startMatching(orderId: string, scheduledAt: Date | null): Promise<void> {
    const delayMs = scheduledAt ? Math.max(0, scheduledAt.getTime() - Date.now()) : 0;

    try {
      await this.matching.requestMatching(orderId, [], delayMs);
    } catch (error) {
      this.logger.error(
        { err: error, orderId },
        "Qidiruv navbatiga yozib boʻlmadi — buyurtma keyingi sweepʼda tiklanadi",
      );
    }
  }

  /**
   * Soʻralgan usta bloklangan yoki umuman yoʻq boʻlsa, soʻrovni jimgina
   * tashlab yuborish mumkin emas: mijoz ekranda "usta soʻraldi" deb koʻrardi.
   */
  private async assertPreferredMasterUsable(preferredMasterId: string | null): Promise<void> {
    if (!preferredMasterId) return;

    const master = await this.prisma.master.findUnique({
      where: { id: preferredMasterId },
      select: { isActive: true },
    });

    if (!master || !master.isActive) {
      throw new DomainException(
        'PREFERRED_MASTER_NOT_AVAILABLE',
        "Tanlangan usta hozir buyurtma qabul qilmaydi",
        HttpStatus.BAD_REQUEST,
        { preferredMasterId },
      );
    }
  }

  /**
   * Idempotentlik (biznes-qoida 5.6): bir xil `Idempotency-Key` bilan takroriy
   * soʻrov kelsa, unique constraint ishga tushadi va mavjud buyurtma qaytariladi.
   */
  private async createOrder(command: CreateOrderCommand, invoice: OrderInvoice) {
    try {
      return await this.prisma.order.create({
        data: {
          clientId: command.clientId,
          categoryId: command.categoryId,
          description: command.description,
          attachmentUrls: command.attachmentUrls,
          isUrgent: command.isUrgent,
          price: invoice.total,
          priceBase: invoice.base,
          priceUrgentFee: invoice.urgentFee,
          discountPercent: invoice.discountPercent,
          discountAmount: invoice.discount,
          paymentMethod: toDbPaymentMethod(command.paymentMethod),
          scheduledAt: command.scheduledAt,
          preferredMasterId: command.preferredMasterId,
          status: OrderStatus.SEARCHING,
          clientAddress: command.clientAddress as unknown as Prisma.InputJsonValue,
          // Koordinata boʻlmasa `null` yoziladi — soxta nuqta hech qachon emas.
          addressLat: command.clientAddress.lat ?? null,
          addressLng: command.clientAddress.lng ?? null,
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
