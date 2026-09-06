import { Module } from '@nestjs/common';
import { CatalogCacheService } from './catalog-cache.service';
import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceCategoriesService } from './service-categories.service';
import { ServiceGroupsController } from './service-groups.controller';
import { ServiceGroupsService } from './service-groups.service';

/** Xizmatlar katalogi: guruhlar + kategoriyalar, umumiy cache bilan. */
@Module({
  controllers: [ServiceGroupsController, ServiceCategoriesController],
  providers: [CatalogCacheService, ServiceGroupsService, ServiceCategoriesService],
  exports: [CatalogCacheService, ServiceGroupsService, ServiceCategoriesService],
})
export class CatalogModule {}
