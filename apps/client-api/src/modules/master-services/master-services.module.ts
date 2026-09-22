import { Module } from '@nestjs/common';
import { MasterServicesController } from './master-services.controller';
import { MasterServicesService } from './master-services.service';

@Module({
  controllers: [MasterServicesController],
  providers: [MasterServicesService],
  exports: [MasterServicesService],
})
export class MasterServicesModule {}
