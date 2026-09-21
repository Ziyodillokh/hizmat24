import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { AuthenticatedUser } from '@shared/index';
import { CurrentUser } from '@client/common/decorators/current-user.decorator';
import { requestContextOf } from '@client/common/http/request-context';
import { MasterApplicationsService } from './master-applications.service';
import { SubmitApplicationDto } from './dto/submit-application.dto';
import type { MyApplicationView } from './application.view';

/**
 * Usta boʻlish arizasi — mijoz ilovasidan.
 *
 * Marshrut `master/...` ostida, lekin kirish oddiy foydalanuvchi tokeni
 * bilan: ariza bergan odam hali usta EMAS, aynan usta boʻlish uchun
 * murojaat qilmoqda.
 */
@ApiTags('master-applications')
@ApiBearerAuth()
@Controller({ path: 'master/applications', version: '1' })
export class MasterApplicationsController {
  constructor(private readonly applications: MasterApplicationsService) {}

  /**
   * Cheklov global throttlerdan qattiqroq: rad javobidan keyin qaytadan
   * ariza berish mumkin, demak «bitta kutayotgan ariza» indeksi takroriy
   * yuborishni toʻliq toʻxtatmaydi.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({ summary: 'Usta boʻlish uchun ariza yuborish' })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitApplicationDto,
    @Req() request: FastifyRequest,
  ): Promise<MyApplicationView> {
    return this.applications.submit(user, dto, requestContextOf(request));
  }

  /**
   * Oʻz arizasining holati. Ariza umuman boʻlmasa `null` qaytadi — bu
   * xato emas, «hali yubormagansiz» degani va ilova aynan shuni koʻrsatadi.
   */
  @Get('me')
  @ApiOperation({ summary: 'Oʻz arizamning holati va rad sababi' })
  findMine(@CurrentUser('id') userId: string): Promise<MyApplicationView | null> {
    return this.applications.findMine(userId);
  }
}
