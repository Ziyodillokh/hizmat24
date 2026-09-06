import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@client/common/decorators/public.decorator';
import { ServiceCategoriesService, type ServiceCategoryView } from './service-categories.service';

@ApiTags('catalog')
@Controller({ path: 'service-categories', version: '1' })
export class ServiceCategoriesController {
  constructor(private readonly categories: ServiceCategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: "Faol xizmat turlarining tekis ro'yxati (narxlar so'mda)",
    description: 'Qidiruv va "Barchasi" ekrani uchun. Guruhlangan ko\'rinish — /service-groups.',
  })
  list(): Promise<ServiceCategoryView[]> {
    return this.categories.listActive();
  }
}
