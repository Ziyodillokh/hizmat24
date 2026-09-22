import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AdminOnly, CurrentAdmin } from '@client/common/decorators/admin.decorator';
import { requestContextOf } from '@client/common/http/request-context';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import type { ServiceAreaRecord } from '@client/modules/service-area/service-area.service';
import { AdminSettingsService } from './admin-settings.service';
import { UpdateServiceAreaDto } from './dto/service-area.dto';

/**
 * Sozlamalar — hozircha bitta narsa: platforma qayerda ishlaydi.
 *
 * `settings` ruxsati faqat SUPERADMIN da: chegarani kengaytirish — ustalar
 * yeta olmaydigan joyga buyurtma ochib yuborish demakdir.
 */
@ApiTags('admin-settings')
@ApiBearerAuth()
@AdminOnly('settings')
@Controller({ path: 'admin/settings', version: '1' })
export class AdminSettingsController {
  constructor(private readonly settings: AdminSettingsService) {}

  @Get('service-areas')
  @ApiOperation({ summary: 'Xizmat hududlari (oʻchirilganlari bilan)' })
  listAreas(): Promise<ServiceAreaRecord[]> {
    return this.settings.listAreas();
  }

  @Patch('service-areas/:areaId')
  @ApiOperation({ summary: 'Hududni yangilash — faqat yuborilgan maydonlar' })
  updateArea(
    @Param('areaId', new ParseUUIDPipe({ version: '4' })) areaId: string,
    @Body() dto: UpdateServiceAreaDto,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<ServiceAreaRecord> {
    return this.settings.updateArea(areaId, dto, admin, requestContextOf(request));
  }
}
