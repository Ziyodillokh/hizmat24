import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AdminOnly, CurrentAdmin } from '@client/common/decorators/admin.decorator';
import { RawResponse } from '@client/common/decorators/raw-response.decorator';
import { requestContextOf } from '@client/common/http/request-context';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import { AdminSafetyService } from '@client/modules/admin/operations/admin-safety.service';
import {
  AdminReportsService,
  type AdminStats,
  type AuditRow,
} from '@client/modules/admin/reports/admin-reports.service';
import {
  AdminPeopleService,
  type AdminMasterRow,
  type AdminUserDetail,
  type AdminUserRow,
} from './admin-people.service';
import { AuditQueryDto, BlockDto, SearchQueryDto, StatsQueryDto } from './dto/people.dto';

/**
 * Foydalanuvchilar va ustalar (A5).
 *
 * Telefon raqami roʻyxatda DOIM maskalangan. Toʻliq raqamni ochish —
 * alohida amal va u auditga yoziladi: panelga kirgan odam minglab
 * raqamni jimgina koʻchirib ololmasligi kerak.
 */
@ApiTags('admin-users')
@ApiBearerAuth()
@AdminOnly('users')
@Controller({ path: 'admin', version: '1' })
export class AdminPeopleController {
  constructor(
    private readonly people: AdminPeopleService,
    private readonly safety: AdminSafetyService,
  ) {}

  @Get('users')
  @ApiOperation({ summary: 'Foydalanuvchilar — telefon yoki ism boʻyicha qidiruv' })
  listUsers(@Query() query: SearchQueryDto): Promise<AdminUserRow[]> {
    return this.people.listUsers(query.search, query.limit);
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Foydalanuvchi kartasi — buyurtmalar tarixi bilan' })
  userDetail(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ): Promise<AdminUserDetail> {
    return this.people.userDetail(userId);
  }

  @Post('users/:userId/reveal-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toʻliq telefon raqami — audit yozuvi bilan' })
  revealUserPhone(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<{ phoneNumber: string }> {
    return this.people.revealPhone('user', userId, admin, requestContextOf(request));
  }

  @Post('users/:userId/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bloklash — ilovaga kira olmaydi' })
  blockUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: BlockDto,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<AdminUserRow> {
    return this.people.setUserBlocked(userId, true, dto.reason, admin, requestContextOf(request));
  }

  @Post('users/:userId/unblock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Blokdan chiqarish' })
  unblockUser(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: BlockDto,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<AdminUserRow> {
    return this.people.setUserBlocked(userId, false, dto.reason, admin, requestContextOf(request));
  }

  @Get('masters')
  @ApiOperation({ summary: 'Ustalar — reyting, bajarilgan ish va bekor qilish ulushi' })
  listMasters(@Query() query: SearchQueryDto): Promise<AdminMasterRow[]> {
    return this.people.listMasters(query.search, query.limit);
  }

  @Post('masters/:masterId/reveal-phone')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ustaning toʻliq telefon raqami — audit yozuvi bilan' })
  revealMasterPhone(
    @Param('masterId', new ParseUUIDPipe({ version: '4' })) masterId: string,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<{ phoneNumber: string }> {
    return this.people.revealPhone('master', masterId, admin, requestContextOf(request));
  }

  /**
   * Usta bloklash — YAGONA yoʻl.
   *
   * Xavfsizlik boʻlimi ham shu servisni chaqiradi: ikkita endpoint
   * bir xil ishni qilsa, ular bir kun kelib ajralib ketardi.
   */
  @Post('masters/:masterId/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ustani bloklash — yangi taklif olmaydi' })
  blockMaster(
    @Param('masterId', new ParseUUIDPipe({ version: '4' })) masterId: string,
    @Body() dto: BlockDto,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ) {
    return this.safety.setMasterActive(masterId, false, dto.reason, admin, requestContextOf(request));
  }

  @Post('masters/:masterId/unblock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ustani blokdan chiqarish' })
  unblockMaster(
    @Param('masterId', new ParseUUIDPipe({ version: '4' })) masterId: string,
    @Body() dto: BlockDto,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ) {
    return this.safety.setMasterActive(masterId, true, dto.reason, admin, requestContextOf(request));
  }
}

/**
 * Hisobotlar va audit (A7).
 *
 * «Bugun nima boʻldi» degan savolga bir ekranda javob. Raqamlar
 * KESHSIZ: eskirgan son bu ekranda eng yomon xato boʻlardi.
 */
@ApiTags('admin-reports')
@ApiBearerAuth()
@AdminOnly('reports')
@Controller({ path: 'admin', version: '1' })
export class AdminReportsController {
  constructor(private readonly reports: AdminReportsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Davr boʻyicha raqamlar va ochiq muammolar' })
  stats(@Query() query: StatsQueryDto): Promise<AdminStats> {
    return this.reports.stats(query.from, query.to);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Audit yozuvlari — filtr bilan' })
  audit(@Query() query: AuditQueryDto): Promise<{ items: AuditRow[]; total: number }> {
    return this.reports.audit(query);
  }

  @Get('audit.csv')
  // Konvertdan chetlab oʻtadi: CSV satri obyekt ichiga tushsa, brauzer
  // uni fayl sifatida ocha olmaydi.
  @RawResponse()
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="audit.csv"')
  @ApiOperation({ summary: 'Audit yozuvlari — CSV' })
  auditCsv(@Query() query: AuditQueryDto): Promise<string> {
    return this.reports.auditCsv(query);
  }
}
