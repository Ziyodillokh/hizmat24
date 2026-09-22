import { Module } from '@nestjs/common';
import { ServiceAreaController } from './service-area.controller';
import { ServiceAreaService } from './service-area.service';

/** Platforma ishlaydigan hudud: markaz + radius (hozir faqat Namangan). */
@Module({
  controllers: [ServiceAreaController],
  providers: [ServiceAreaService],
  exports: [ServiceAreaService],
})
export class ServiceAreaModule {}
