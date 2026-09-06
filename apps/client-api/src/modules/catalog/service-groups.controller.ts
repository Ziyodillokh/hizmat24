import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@client/common/decorators/public.decorator';
import { ServiceGroupsService, type ServiceGroupView } from './service-groups.service';

@ApiTags('catalog')
@Controller({ path: 'service-groups', version: '1' })
export class ServiceGroupsController {
  constructor(private readonly groups: ServiceGroupsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Xizmat guruhlari va ular ichidagi xizmatlar',
    description:
      "Bosh sahifadagi plitkalar va guruh ekrani uchun bitta so'rov. " +
      "Bo'sh guruhlar qaytarilmaydi.",
  })
  list(): Promise<ServiceGroupView[]> {
    return this.groups.listActive();
  }
}
