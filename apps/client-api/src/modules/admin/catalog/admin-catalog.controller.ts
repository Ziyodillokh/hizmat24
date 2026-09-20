import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly } from '@client/common/decorators/admin.decorator';
import { AdminCatalogService, type AdminCategoryView } from './admin-catalog.service';

/**
 * Katalog boʻlimi — hozircha faqat oʻqish.
 *
 * Tahrirlash A6 bosqichida qoʻshiladi. Roʻyxat shu yerda tursin: boʻlim
 * ruxsati (`catalog` — faqat SUPERADMIN) aynan shu marshrutda tekshiriladi
 * va uni isbotlash uchun haqiqiy endpoint kerak.
 */
@ApiTags('admin-catalog')
@ApiBearerAuth()
@AdminOnly('catalog')
@Controller({ path: 'admin/catalog', version: '1' })
export class AdminCatalogController {
  constructor(private readonly catalog: AdminCatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Barcha xizmatlar (oʻchirilganlari bilan)' })
  listCategories(): Promise<AdminCategoryView[]> {
    return this.catalog.listCategories();
  }
}
