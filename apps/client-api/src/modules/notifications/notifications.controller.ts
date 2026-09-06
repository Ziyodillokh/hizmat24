import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@client/common/decorators/current-user.decorator';
import { PaginationQueryDto } from '@client/modules/orders/dto/pagination.dto';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: "Bildirishnomalar ro'yxati",
    description:
      "Push yetkazilmagan bo'lsa ham (foydalanuvchi offline edi) xabar shu yerda ko'rinadi (TZ 4).",
  })
  list(@CurrentUser('id') userId: string, @Query() pagination: PaginationQueryDto) {
    return this.notifications.list(userId, pagination.page, pagination.limit);
  }

  @Post(':notificationId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Bildirishnomani o'qilgan deb belgilash" })
  async markRead(
    @CurrentUser('id') userId: string,
    @Param('notificationId', new ParseUUIDPipe({ version: '4' })) notificationId: string,
  ): Promise<void> {
    await this.notifications.markAsRead(userId, notificationId);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Barchasini o'qilgan deb belgilash" })
  async markAllRead(@CurrentUser('id') userId: string): Promise<void> {
    await this.notifications.markAllAsRead(userId);
  }

  @Post('device-tokens')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Push uchun qurilma tokenini ro'yxatdan o'tkazish" })
  async registerDevice(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceDto,
  ): Promise<void> {
    await this.notifications.registerDeviceToken(userId, dto.token, dto.platform);
  }
}
