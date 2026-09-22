import { Body, Controller, Get, NotFoundException, Put, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '@client/common/decorators/current-user.decorator';
import { requestContextOf } from '@client/common/http/request-context';
import { MasterServicesService, type MasterServiceView } from './master-services.service';

export class SetMasterServicesDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Kamida bitta xizmat tanlang' })
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  categoryIds!: string[];
}

/** Usta oʻz xizmatlarini boshqaradi — ilovaning usta rejimidan. */
@ApiTags('master-services')
@ApiBearerAuth()
@Controller({ path: 'master/me/services', version: '1' })
export class MasterServicesController {
  constructor(private readonly services: MasterServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Katalog + ustaning javobi (yoqilgan/oʻchirilgan)' })
  async list(@CurrentUser('id') userId: string): Promise<MasterServiceView[]> {
    return this.services.list(await this.requireMaster(userId));
  }

  @Put()
  @ApiOperation({ summary: 'Yoqilgan xizmatlar roʻyxatini almashtirish' })
  async replace(
    @CurrentUser('id') userId: string,
    @Body() dto: SetMasterServicesDto,
    @Req() request: FastifyRequest,
  ): Promise<MasterServiceView[]> {
    const masterId = await this.requireMaster(userId);
    return this.services.replace(masterId, dto.categoryIds, userId, requestContextOf(request));
  }

  private async requireMaster(userId: string): Promise<string> {
    const masterId = await this.services.findMasterId(userId);
    if (!masterId) {
      throw new NotFoundException('Siz hali usta emassiz — arizangiz tasdiqlanishi kerak.');
    }
    return masterId;
  }
}
