import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { AdminOnly, CurrentAdmin } from '@client/common/decorators/admin.decorator';
import { requestContextOf } from '@client/common/http/request-context';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import type { PaginatedResult } from '@client/modules/orders/dto/pagination.dto';
import { AdminApplicationsService, type AssignableCategory } from './admin-applications.service';
import { ListApplicationsQueryDto } from './dto/list-applications.dto';
import { ApproveApplicationDto, RejectApplicationDto } from './dto/review-application.dto';
import type { AdminApplicationDetail, AdminApplicationListItem } from './application.view';

/**
 * Usta arizalari boʻlimi. `applications` ruxsati SUPERADMIN va MODERATOR
 * da — operator bu boʻlimni menyuda ham koʻrmaydi, toʻgʻridan-toʻgʻri URL
 * bilan ham kira olmaydi (qorovul shu dekorator ichida).
 */
@ApiTags('admin-applications')
@ApiBearerAuth()
@AdminOnly('applications')
@Controller({ path: 'admin/applications', version: '1' })
export class AdminApplicationsController {
  constructor(private readonly applications: AdminApplicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Arizalar roʻyxati (holat filtri va qidiruv bilan)' })
  list(
    @Query() query: ListApplicationsQueryDto,
  ): Promise<PaginatedResult<AdminApplicationListItem>> {
    return this.applications.list(query);
  }

  // `:applicationId` dan OLDIN turishi shart — aks holda "categories" soʻzi
  // UUID sifatida tahlil qilinib 400 qaytardi.
  @Get('categories')
  @ApiOperation({ summary: 'Tasdiqlashda biriktirish mumkin boʻlgan faol xizmatlar' })
  listCategories(): Promise<AssignableCategory[]> {
    return this.applications.listAssignableCategories();
  }

  @Get(':applicationId')
  @ApiOperation({ summary: 'Ariza kartasi' })
  findOne(
    @Param('applicationId', new ParseUUIDPipe({ version: '4' })) applicationId: string,
  ): Promise<AdminApplicationDetail> {
    return this.applications.findOne(applicationId);
  }

  @Post(':applicationId/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Tasdiqlash — usta yaratiladi va xizmatlar biriktiriladi' })
  approve(
    @Param('applicationId', new ParseUUIDPipe({ version: '4' })) applicationId: string,
    @Body() dto: ApproveApplicationDto,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<AdminApplicationDetail> {
    return this.applications.approve(applicationId, dto, admin, requestContextOf(request));
  }

  @Post(':applicationId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rad etish — sabab majburiy va ilovada koʻrinadi' })
  reject(
    @Param('applicationId', new ParseUUIDPipe({ version: '4' })) applicationId: string,
    @Body() dto: RejectApplicationDto,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<AdminApplicationDetail> {
    return this.applications.reject(applicationId, dto, admin, requestContextOf(request));
  }
}
