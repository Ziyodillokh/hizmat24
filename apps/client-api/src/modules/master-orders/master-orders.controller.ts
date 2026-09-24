import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '@client/common/decorators/current-user.decorator';
import { requestContextOf } from '@client/common/http/request-context';
import { MasterOrdersService, type MasterOrderView } from './master-orders.service';
import { MasterShiftService, type ShiftView } from './master-shift.service';
import { DeclineDto, DepartDto, FinishDto, MasterCancelDto } from './dto/master-order.dto';

class SetShiftDto {
  @IsBoolean()
  isOpen!: boolean;
}

/**
 * Usta ilovasining server tomoni (B5).
 *
 * Har amal ikki tekshiruvdan oʻtadi: buyurtma SHU ustaniki ekanmi va
 * amal joriy holatda mumkinmi. Ikkalasi ham sof qoidalar faylida
 * (`master-order-rules.ts`) va ular xatoni ANIQ sabab bilan qaytaradi —
 * «topilmadi» degan javob ustaga hech narsa tushuntirmaydi.
 */
@ApiTags('master-orders')
@ApiBearerAuth()
@Controller({ path: 'master', version: '1' })
export class MasterOrdersController {
  constructor(
    private readonly orders: MasterOrdersService,
    private readonly shift: MasterShiftService,
  ) {}

  @Get('shift')
  @ApiOperation({ summary: 'Smena holati' })
  async readShift(@CurrentUser('id') userId: string): Promise<ShiftView> {
    return this.shift.read(await this.orders.requireMasterId(userId));
  }

  @Put('shift')
  @ApiOperation({ summary: 'Smenani ochish yoki yopish' })
  async setShift(
    @CurrentUser('id') userId: string,
    @Body() dto: SetShiftDto,
    @Req() request: FastifyRequest,
  ): Promise<ShiftView> {
    const masterId = await this.orders.requireMasterId(userId);
    return this.shift.set(masterId, userId, dto.isOpen, requestContextOf(request));
  }

  @Get('orders')
  @ApiOperation({ summary: 'Takliflar, faol ish va yaqin tarix' })
  async list(@CurrentUser('id') userId: string): Promise<MasterOrderView[]> {
    return this.orders.list(await this.orders.requireMasterId(userId));
  }

  @Post('orders/:orderId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Taklifni qabul qilish' })
  async accept(
    @CurrentUser('id') userId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Req() request: FastifyRequest,
  ): Promise<MasterOrderView> {
    return this.run(userId, orderId, 'accept', {}, request);
  }

  @Post('orders/:orderId/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Taklifni rad etish — buyurtma boshqa ustaga ketadi' })
  async decline(
    @CurrentUser('id') userId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Body() dto: DeclineDto,
    @Req() request: FastifyRequest,
  ): Promise<MasterOrderView> {
    return this.run(userId, orderId, 'decline', { reason: dto.reason }, request);
  }

  @Post('orders/:orderId/depart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yoʻlga chiqdim — mijoz shu vaqtni koʻradi' })
  async depart(
    @CurrentUser('id') userId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Body() dto: DepartDto,
    @Req() request: FastifyRequest,
  ): Promise<MasterOrderView> {
    return this.run(userId, orderId, 'depart', { etaMinutes: dto.etaMinutes }, request);
  }

  @Post('orders/:orderId/arrive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Yetib keldim — mijoz meni tasdiqlaydi' })
  async arrive(
    @CurrentUser('id') userId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Req() request: FastifyRequest,
  ): Promise<MasterOrderView> {
    return this.run(userId, orderId, 'arrive', {}, request);
  }

  @Post('orders/:orderId/finish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ishni yakunlash' })
  async finish(
    @CurrentUser('id') userId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Body() dto: FinishDto,
    @Req() request: FastifyRequest,
  ): Promise<MasterOrderView> {
    return this.run(userId, orderId, 'finish', { workNote: dto.workNote }, request);
  }

  @Post('orders/:orderId/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ishni bekor qilish — sabab mijozga koʻrinadi' })
  async cancel(
    @CurrentUser('id') userId: string,
    @Param('orderId', new ParseUUIDPipe({ version: '4' })) orderId: string,
    @Body() dto: MasterCancelDto,
    @Req() request: FastifyRequest,
  ): Promise<MasterOrderView> {
    return this.run(userId, orderId, 'cancel', { reason: dto.reason }, request);
  }

  private async run(
    userId: string,
    orderId: string,
    action: Parameters<MasterOrdersService['act']>[3],
    payload: Parameters<MasterOrdersService['act']>[4],
    request: FastifyRequest,
  ): Promise<MasterOrderView> {
    const masterId = await this.orders.requireMasterId(userId);
    return this.orders.act(masterId, userId, orderId, action, payload, requestContextOf(request));
  }
}
