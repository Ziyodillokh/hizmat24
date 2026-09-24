import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AdminOnly, CurrentAdmin } from '@client/common/decorators/admin.decorator';
import { requestContextOf } from '@client/common/http/request-context';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import {
  AdminOrdersService,
  type AdminOrderDetail,
  type AdminOrderRow,
  type AdminOrdersPage,
} from './admin-orders.service';
import { AdminSafetyService, type SafetyAlertView, type SafetyAlertsPage } from './admin-safety.service';
import {
  AdminCancelOrderDto,
  ListAlertsQueryDto,
  ListOrdersQueryDto,
  ResolveAlertDto,
} from './dto/operations.dto';

/**
 * Buyurtmalar monitoringi (A3).
 *
 * `orders` ruxsati OPERATOR va SUPERADMIN da: bu kundalik ish va uni
 * moderatorga ochish kerak emas.
 */
@ApiTags('admin-orders')
@ApiBearerAuth()
@AdminOnly('orders')
@Controller({ path: 'admin/orders', version: '1' })
export class AdminOrdersController {
  constructor(private readonly orders: AdminOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Buyurtmalar roʻyxati — filtr va sahifalash bilan' })
  list(@Query() query: ListOrdersQueryDto): Promise<AdminOrdersPage> {
    return this.orders.list(query);
  }

  @Get('escalated')
  @ApiOperation({ summary: 'Usta topilmagan buyurtmalar navbati' })
  listEscalated(): Promise<AdminOrderRow[]> {
    return this.orders.listEscalated();
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Buyurtma kartasi — holatlar tarixi bilan' })
  detail(
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
  ): Promise<AdminOrderDetail> {
    return this.orders.detail(orderId);
  }

  @Post(':orderId/requeue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Qayta qidiruvga qoʻyish' })
  requeue(
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<AdminOrderDetail> {
    return this.orders.requeue(orderId, admin, requestContextOf(request));
  }

  @Post(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bekor qilish — sabab mijozga koʻrinadi' })
  cancel(
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Body() dto: AdminCancelOrderDto,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<AdminOrderDetail> {
    return this.orders.cancel(orderId, dto.reason, admin, requestContextOf(request));
  }
}

/**
 * Xavfsizlik signallari (A4).
 *
 * Buyurtma holati bu yerdan OʻZGARTIRILMAYDI: `SAFETY_FLAGGED` terminal
 * holat va hodisa tarixda oʻz holicha qolishi kerak. Operator faqat
 * xulosa yozadi.
 *
 * Ustani bloklash bu yerda EMAS — u `/admin/masters/:id/block` da
 * (A5). Ikkita endpoint bir xil ishni qilsa, ular bir kun kelib
 * ajralib ketardi.
 */
@ApiTags('admin-safety')
@ApiBearerAuth()
@AdminOnly('safety')
@Controller({ path: 'admin/safety-alerts', version: '1' })
export class AdminSafetyController {
  constructor(private readonly safety: AdminSafetyService) {}

  @Get()
  @ApiOperation({ summary: 'Signallar roʻyxati va ochiqlari soni' })
  list(@Query() query: ListAlertsQueryDto): Promise<SafetyAlertsPage> {
    return this.safety.list(query.status);
  }

  @Post(':alertId/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Signalni yopish — natija va izoh bilan' })
  resolve(
    @Param('alertId', new ParseUUIDPipe({ version: '4' })) alertId: string,
    @Body() dto: ResolveAlertDto,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<SafetyAlertView> {
    return this.safety.resolve(alertId, dto.resolution, dto.note, admin, requestContextOf(request));
  }

}
