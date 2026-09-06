import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '@client/common/decorators/current-user.decorator';
import { CancelOrderCommand } from './application/commands/cancel-order.command';
import { ConfirmMasterCommand } from './application/commands/confirm-master.command';
import { CreateOrderCommand } from './application/commands/create-order.command';
import {
  GetOrderEtaQuery,
  GetOrderQuery,
  GetOrderReceiptQuery,
  ListOrderHistoryQuery,
} from './application/queries/get-order.query';
import type { OrderEtaView, ReceiptView } from './application/queries/get-order.handler';
import type { ConfirmMasterResult } from './application/commands/confirm-master.handler';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { ConfirmMasterDto } from './dto/confirm-master.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationQueryDto, type PaginatedResult } from './dto/pagination.dto';
import type { OrderView } from './infrastructure/order.presenter';

/** Controller — faqat HTTP qobiq: DTO validatsiya + command/query yuborish (9.3). */
@ApiTags('orders')
@ApiBearerAuth()
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Buyurtma yaratish va usta qidiruvini ishga tushirish' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Tarmoq xatosida takroriy yuborishdan himoya (biznes-qoida 5.6)',
  })
  createOrder(
    @CurrentUser('id') clientId: string,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<OrderView> {
    return this.commandBus.execute(
      new CreateOrderCommand(
        clientId,
        dto.categoryId,
        dto.description,
        dto.attachmentUrls ?? [],
        dto.isUrgent ?? false,
        dto.clientAddress,
        idempotencyKey?.trim() || null,
      ),
    );
  }

  @Get('history')
  @ApiOperation({ summary: 'Buyurtmalar tarixi (sahifalash bilan)' })
  listHistory(
    @CurrentUser('id') clientId: string,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<OrderView>> {
    return this.queryBus.execute(
      new ListOrderHistoryQuery(clientId, pagination.page, pagination.limit),
    );
  }

  @Get(':orderId')
  @ApiOperation({ summary: "Buyurtma holati va tayinlangan usta ma'lumotlari" })
  getOrder(
    @CurrentUser('id') clientId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
  ): Promise<OrderView> {
    return this.queryBus.execute(new GetOrderQuery(orderId, clientId));
  }

  @Get(':orderId/eta')
  @ApiOperation({ summary: 'Real-vaqt ETA / navbat pozitsiyasi' })
  getEta(
    @CurrentUser('id') clientId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
  ): Promise<OrderEtaView> {
    return this.queryBus.execute(new GetOrderEtaQuery(orderId, clientId));
  }

  @Get(':orderId/receipt')
  @ApiOperation({ summary: 'Chek' })
  getReceipt(
    @CurrentUser('id') clientId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
  ): Promise<ReceiptView> {
    return this.queryBus.execute(new GetOrderReceiptQuery(orderId, clientId));
  }

  @Post(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buyurtmani bekor qilish (ish boshlanmaguncha)' })
  cancelOrder(
    @CurrentUser('id') clientId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Body() dto: CancelOrderDto,
  ): Promise<OrderView> {
    return this.commandBus.execute(new CancelOrderCommand(orderId, clientId, dto.reason));
  }

  @Post(':orderId/confirm-master')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Kelgan ustani tasdiqlash yoki xavfsizlik signalini yuborish',
    description:
      "confirmed=false bo'lsa buyurtma SAFETY_FLAGGED holatiga o'tadi va admin/support " +
      "navbatiga yuqori ustuvorlikdagi signal yoziladi. Ish IN_PROGRESS ga o'tmaydi.",
  })
  confirmMaster(
    @CurrentUser('id') clientId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Body() dto: ConfirmMasterDto,
    @Req() request: FastifyRequest,
  ): Promise<ConfirmMasterResult> {
    return this.commandBus.execute(
      new ConfirmMasterCommand(
        orderId,
        clientId,
        dto.confirmed,
        dto.note ?? null,
        request.ip ?? null,
        request.headers['user-agent'] ?? null,
      ),
    );
  }
}
