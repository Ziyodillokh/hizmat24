import { Module } from '@nestjs/common';
import { AdminModule } from '@client/modules/admin/admin.module';
import { AuditModule } from '@client/modules/audit/audit.module';
import { AdminApplicationsController } from './admin-applications.controller';
import { AdminApplicationsService } from './admin-applications.service';
import { MasterApplicationsController } from './master-applications.controller';
import { MasterApplicationsService } from './master-applications.service';

/**
 * Usta arizalari — bitta modulda ikki tomon: ilova ariza yuboradi, panel
 * uni koʻrib chiqadi. Ular bir xil jadval va bir xil qoidalar ustida
 * ishlagani uchun ajratilmagan.
 *
 * `AdminModule` import qilinadi: `@AdminOnly()` oʻzi bilan `AdminGuard`
 * ni olib keladi va qorovul shu modul kontekstida hal qilinishi kerak.
 */
@Module({
  imports: [AdminModule, AuditModule],
  controllers: [MasterApplicationsController, AdminApplicationsController],
  providers: [MasterApplicationsService, AdminApplicationsService],
})
export class MasterApplicationsModule {}
