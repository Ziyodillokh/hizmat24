import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@client/common/decorators/public.decorator';
import type { ServiceAreaView } from './domain/service-area-rules';
import { ServiceAreaService } from './service-area.service';

@ApiTags('catalog')
@Controller({ path: 'service-area', version: '1' })
export class ServiceAreaController {
  constructor(private readonly areas: ServiceAreaService) {}

  /**
   * Ilova «Namangan shahri» deb yozishi uchun.
   *
   * Shahar nomi ilovaga KODDA yozilmaydi: chegara paneldan oʻzgarganda
   * ilova ham, panel ham bitta manbadan oʻqishi kerak — aks holda ilova
   * eski shaharni aytib turardi.
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Platforma ishlaydigan hududlar' })
  list(): Promise<ServiceAreaView[]> {
    return this.areas.listActive();
  }
}
