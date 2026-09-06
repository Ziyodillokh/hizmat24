import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@client/common/decorators/current-user.decorator';
import { MastersService, type MasterProfileView } from './masters.service';

@ApiTags('masters')
@ApiBearerAuth()
@Controller({ path: 'masters', version: '1' })
export class MastersController {
  constructor(private readonly masters: MastersService) {}

  @Get(':masterId')
  @ApiOperation({ summary: 'Tayinlangan usta profili (read-only)' })
  getProfile(
    @CurrentUser('id') clientId: string,
    @Param('masterId', new ParseUUIDPipe({ version: '4' })) masterId: string,
  ): Promise<MasterProfileView> {
    return this.masters.findProfileForClient(masterId, clientId);
  }
}
