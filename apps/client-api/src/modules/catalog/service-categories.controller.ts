import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@client/common/decorators/public.decorator';
import { ServiceCategoriesService, type ServiceCategoryView } from './service-categories.service';
import { ServicePageService, type ServicePageView } from './service-page.service';

@ApiTags('catalog')
@Controller({ path: 'service-categories', version: '1' })
export class ServiceCategoriesController {
  constructor(
    private readonly categories: ServiceCategoriesService,
    private readonly page: ServicePageService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: "Faol xizmat turlarining tekis roʻyxati (narxlar soʻmda)",
    description: 'Qidiruv va "Barchasi" ekrani uchun. Guruhlangan ko\'rinish — /service-groups.',
  })
  list(): Promise<ServiceCategoryView[]> {
    return this.categories.listActive();
  }

  @Public()
  @Get(':categoryId/page')
  @ApiOperation({
    summary: 'Xizmat sahifasining toʻliq mazmuni',
    description:
      'Jarayon bosqichlari, FAQ, uskunalar, tayyorgarlik va kafolat. Karta ' +
      'maydonlari roʻyxatdan keladi — bu yerda takrorlanmaydi.',
  })
  readPage(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
  ): Promise<ServicePageView> {
    return this.page.read(categoryId);
  }
}
