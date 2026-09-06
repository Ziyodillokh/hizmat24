import { HttpStatus } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';
import { OrderStatus } from '@prisma/client';
import { CURRENCY, type Currency } from '@shared/index';
import {
  DomainException,
  ForbiddenResourceException,
  OrderNotFoundException,
} from '@client/common/exceptions/domain.exception';
import { toClientZone } from '@client/common/utils/datetime.util';
import { QueuePositionService } from '@client/modules/matching/queue-position.service';
import { OrdersRepository } from '../../infrastructure/orders.repository';
import { presentOrder, type OrderView } from '../../infrastructure/order.presenter';
import {
  GetOrderEtaQuery,
  GetOrderQuery,
  GetOrderReceiptQuery,
  ListOrderHistoryQuery,
} from './get-order.query';
import type { PaginatedResult } from '../../dto/pagination.dto';

export interface OrderEtaView {
  orderId: string;
  status: OrderStatus;
  etaMinutes: number | null;
  queuePosition: number | null;
}

export interface ReceiptView {
  orderId: string;
  serviceName: string;
  price: number;
  currency: Currency;
  masterName: string | null;
  rating: number | null;
  completedAt: string | null;
}

@QueryHandler(GetOrderQuery)
export class GetOrderHandler implements IQueryHandler<GetOrderQuery, OrderView> {
  constructor(private readonly orders: OrdersRepository) {}

  async execute(query: GetOrderQuery): Promise<OrderView> {
    const order = await this.orders.findById(query.orderId);
    if (!order) throw new OrderNotFoundException(query.orderId);
    if (order.clientId !== query.clientId) throw new ForbiddenResourceException();

    // Biznes-qoida 5.2: javobda faqat bitta `master` obyekti — nomzodlar ro'yxati emas.
    return presentOrder(order);
  }
}

@QueryHandler(GetOrderEtaQuery)
export class GetOrderEtaHandler implements IQueryHandler<GetOrderEtaQuery, OrderEtaView> {
  constructor(
    private readonly orders: OrdersRepository,
    private readonly queuePosition: QueuePositionService,
  ) {}

  async execute(query: GetOrderEtaQuery): Promise<OrderEtaView> {
    const order = await this.orders.findById(query.orderId);
    if (!order) throw new OrderNotFoundException(query.orderId);
    if (order.clientId !== query.clientId) throw new ForbiddenResourceException();

    const position =
      order.status === OrderStatus.SEARCHING_QUEUED
        ? await this.queuePosition.positionOf(order.id)
        : null;

    return {
      orderId: order.id,
      status: order.status,
      etaMinutes: order.etaMinutes,
      queuePosition: position === 0 ? order.queuePosition : position,
    };
  }
}

@QueryHandler(GetOrderReceiptQuery)
export class GetOrderReceiptHandler implements IQueryHandler<GetOrderReceiptQuery, ReceiptView> {
  constructor(private readonly orders: OrdersRepository) {}

  async execute(query: GetOrderReceiptQuery): Promise<ReceiptView> {
    const order = await this.orders.findById(query.orderId);
    if (!order) throw new OrderNotFoundException(query.orderId);
    if (order.clientId !== query.clientId) throw new ForbiddenResourceException();

    const receiptable: OrderStatus[] = [
      OrderStatus.COMPLETED_BY_MASTER,
      OrderStatus.RATED,
      OrderStatus.CLOSED,
    ];

    if (!receiptable.includes(order.status)) {
      throw new DomainException(
        'RECEIPT_NOT_AVAILABLE',
        "Chek faqat ish yakunlangandan keyin mavjud bo'ladi",
        HttpStatus.CONFLICT,
        { status: order.status },
      );
    }

    return {
      orderId: order.id,
      serviceName: order.category?.name ?? '',
      price: order.price,
      currency: CURRENCY,
      masterName: order.master?.fullName ?? null,
      rating: order.rating?.stars ?? null,
      completedAt: toClientZone(order.completedAt),
    };
  }
}

@QueryHandler(ListOrderHistoryQuery)
export class ListOrderHistoryHandler implements IQueryHandler<
  ListOrderHistoryQuery,
  PaginatedResult<OrderView>
> {
  constructor(private readonly orders: OrdersRepository) {}

  async execute(query: ListOrderHistoryQuery): Promise<PaginatedResult<OrderView>> {
    const { items, total } = await this.orders.listHistory(query.clientId, query.page, query.limit);

    return {
      items: items.map(presentOrder),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }
}
