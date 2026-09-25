import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AdminProfileController } from './admin-profile.controller';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminCatalogController } from './catalog/admin-catalog.controller';
import { AdminCatalogService } from './catalog/admin-catalog.service';
import { MediaStorageService } from './catalog/media-storage.service';
import { CatalogModule } from '../catalog/catalog.module';
import { AdminAuthService } from './auth/admin-auth.service';
import { AdminGuard } from './guards/admin.guard';
import { AdminSettingsController } from './settings/admin-settings.controller';
import {
  AdminOrdersController,
  AdminSafetyController,
} from './operations/admin-operations.controller';
import { AdminOrdersService } from './operations/admin-orders.service';
import {
  AdminPeopleController,
  AdminReportsController,
} from './people/admin-people.controller';
import { AdminMasterDetailService } from './people/admin-master-detail.service';
import { AdminPeopleService } from './people/admin-people.service';
import { AdminReportsService } from './reports/admin-reports.service';
import { AdminSafetyService } from './operations/admin-safety.service';
import { MatchingModule } from '../matching/matching.module';
import { OrdersInfrastructureModule } from '../orders/orders-infrastructure.module';
import { AdminSettingsService } from './settings/admin-settings.service';

/**
 * Admin paneli backendi.
 *
 * `AdminGuard` shu yerda eʼlon qilinadi va EKSPORT qilinadi: keyingi
 * bosqichlarda (A2 arizalar, A3 buyurtmalar) boshqa modullar ham
 * `@AdminOnly()` ishlatadi va qorovul ularga ham kerak boʻladi.
 */
@Module({
  imports: [AuditModule, CatalogModule, MatchingModule, OrdersInfrastructureModule],
  controllers: [
    AdminAuthController,
    AdminProfileController,
    AdminCatalogController,
    AdminSettingsController,
    AdminOrdersController,
    AdminSafetyController,
    AdminPeopleController,
    AdminReportsController,
  ],
  providers: [
    AdminAuthService,
    AdminCatalogService,
    MediaStorageService,
    AdminSettingsService,
    AdminOrdersService,
    AdminSafetyService,
    AdminPeopleService,
    AdminMasterDetailService,
    AdminReportsService,
    AdminGuard,
  ],
  exports: [AdminAuthService, AdminGuard],
})
export class AdminModule {}
