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

/**
 * Admin paneli backendi.
 *
 * `AdminGuard` shu yerda eʼlon qilinadi va EKSPORT qilinadi: keyingi
 * bosqichlarda (A2 arizalar, A3 buyurtmalar) boshqa modullar ham
 * `@AdminOnly()` ishlatadi va qorovul ularga ham kerak boʻladi.
 */
@Module({
  imports: [AuditModule, CatalogModule],
  controllers: [AdminAuthController, AdminProfileController, AdminCatalogController],
  providers: [AdminAuthService, AdminCatalogService, MediaStorageService, AdminGuard],
  exports: [AdminAuthService, AdminGuard],
})
export class AdminModule {}
