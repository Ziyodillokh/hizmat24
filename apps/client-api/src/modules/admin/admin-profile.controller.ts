import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminOnly, CurrentAdmin } from '@client/common/decorators/admin.decorator';
import type { AdminIdentity } from './auth/admin-auth.service';

/**
 * Panel har yuklanganda shu yerdan boshlaydi: kimligini, rolini va
 * KOʻRADIGAN boʻlimlarini bitta javobda oladi. Menyu shu roʻyxatdan
 * chiziladi — frontend ruxsatlarni oʻzi takrorlamaydi, aks holda menyuda
 * koʻringan boʻlim ochilganda 403 beradigan holat paydo boʻlardi.
 */
@ApiTags('admin')
@ApiBearerAuth()
@AdminOnly()
@Controller({ path: 'admin', version: '1' })
export class AdminProfileController {
  @Get('me')
  @ApiOperation({ summary: 'Joriy admin va uning boʻlimlari' })
  me(@CurrentAdmin() admin: AdminIdentity): AdminIdentity {
    return admin;
  }
}
