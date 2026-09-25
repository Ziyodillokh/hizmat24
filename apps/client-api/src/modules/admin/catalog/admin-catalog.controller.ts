import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { AdminOnly, CurrentAdmin } from '@client/common/decorators/admin.decorator';
import { requestContextOf } from '@client/common/http/request-context';
import type { AdminIdentity } from '@client/modules/admin/auth/admin-auth.service';
import { checkMedia } from './domain/media-rules';
import {
  AdminCatalogService,
  type AdminCategoryView,
  type AdminGroupView,
} from './admin-catalog.service';
import {
  ReorderMediaDto,
  UpdateMediaDto,
  UpsertCategoryDto,
  UpsertGroupDto,
} from './dto/catalog.dto';

/**
 * Katalog boʻlimi — xizmat kartalarini yaratish va tahrirlash.
 *
 * `catalog` ruxsati faqat SUPERADMIN da: narx — pul bilan bogʻliq yagona
 * sozlama va uni oʻzgartirish huquqi eng tor doirada qoladi.
 */
@ApiTags('admin-catalog')
@ApiBearerAuth()
@AdminOnly('catalog')
@Controller({ path: 'admin/catalog', version: '1' })
export class AdminCatalogController {
  constructor(private readonly catalog: AdminCatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Barcha xizmatlar (oʻchirilganlari bilan)' })
  listCategories(): Promise<AdminCategoryView[]> {
    return this.catalog.listCategories();
  }

  @Get('groups')
  @ApiOperation({ summary: 'Guruhlar' })
  listGroups(): Promise<AdminGroupView[]> {
    return this.catalog.listGroups();
  }

  @Post('groups')
  @ApiOperation({ summary: 'Guruh yaratish' })
  createGroup(@Body() dto: UpsertGroupDto): Promise<AdminGroupView> {
    return this.catalog.createGroup(dto);
  }

  @Patch('groups/:groupId')
  @ApiOperation({ summary: 'Guruhni tahrirlash' })
  updateGroup(
    @Param('groupId', new ParseUUIDPipe({ version: '4' })) groupId: string,
    @Body() dto: UpsertGroupDto,
  ): Promise<AdminGroupView> {
    return this.catalog.updateGroup(groupId, dto);
  }

  @Get('categories/:categoryId')
  @ApiOperation({ summary: 'Xizmat kartasi' })
  findCategory(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
  ): Promise<AdminCategoryView> {
    return this.catalog.findCategory(categoryId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Xizmat yaratish' })
  createCategory(
    @Body() dto: UpsertCategoryDto,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<AdminCategoryView> {
    return this.catalog.createCategory(dto, admin, requestContextOf(request));
  }

  @Patch('categories/:categoryId')
  @ApiOperation({ summary: 'Xizmatni tahrirlash (narx oʻzgarsa auditga tushadi)' })
  updateCategory(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
    @Body() dto: UpsertCategoryDto,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<AdminCategoryView> {
    return this.catalog.updateCategory(categoryId, dto, admin, requestContextOf(request));
  }

  @Post('categories/:categoryId/activate')
  @ApiOperation({ summary: 'Xizmatni yoqish' })
  activate(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<AdminCategoryView> {
    return this.catalog.setCategoryActive(categoryId, true, admin, requestContextOf(request));
  }

  @Post('categories/:categoryId/deactivate')
  @ApiOperation({ summary: 'Xizmatni oʻchirish (eski buyurtmalarda nomi qoladi)' })
  deactivate(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<AdminCategoryView> {
    return this.catalog.setCategoryActive(categoryId, false, admin, requestContextOf(request));
  }

  /**
   * Rasm yoki video yuklash.
   *
   * Fayl BUTUNLAY xotiraga oʻqiladi va shundan keyin tekshiriladi —
   * `@fastify/multipart` chegarasi hajmni allaqachon cheklaydi, qolgan
   * qoidalar (tur, oʻlcham) `checkMedia` da.
   */
  @Post('categories/:categoryId/media')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Xizmatga rasm yoki video qoʻshish' })
  async addMedia(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
    @CurrentAdmin() admin: AdminIdentity,
    @Req() request: FastifyRequest,
  ): Promise<AdminCategoryView> {
    // `@fastify/multipart` turlarini kengaytirish global deklaratsiya
    // talab qiladi; bu yerda bitta joyda aniq tur beriladi.
    const withFile = request as FastifyRequest & {
      file: () => Promise<MultipartFile | undefined>;
    };
    const file = await withFile.file();
    if (!file) throw new BadRequestException('Fayl yuborilmadi');

    const buffer = await file.toBuffer();
    const verdict = checkMedia({ mimeType: file.mimetype, byteSize: buffer.byteLength });
    if (!verdict.ok) throw new BadRequestException(verdict.problem);

    return this.catalog.addMedia(
      categoryId,
      buffer,
      verdict.verdict.kind,
      admin,
      requestContextOf(request),
    );
  }

  @Post('media/:mediaId/cover')
  @ApiOperation({ summary: 'Muqova rasmi qilib belgilash' })
  setCover(
    @Param('mediaId', new ParseUUIDPipe({ version: '4' })) mediaId: string,
  ): Promise<AdminCategoryView> {
    return this.catalog.setCover(mediaId);
  }

  @Patch('media/:mediaId')
  @ApiOperation({ summary: 'Rasmning sahifadagi oʻrni va yorligʻi' })
  updateMedia(
    @Param('mediaId', new ParseUUIDPipe({ version: '4' })) mediaId: string,
    @Body() dto: UpdateMediaDto,
  ): Promise<AdminCategoryView> {
    return this.catalog.updateMedia(mediaId, dto);
  }

  @Delete('media/:mediaId')
  @ApiOperation({ summary: 'Faylni oʻchirish' })
  removeMedia(
    @Param('mediaId', new ParseUUIDPipe({ version: '4' })) mediaId: string,
  ): Promise<AdminCategoryView> {
    return this.catalog.removeMedia(mediaId);
  }

  @Patch('categories/:categoryId/media/order')
  @ApiOperation({ summary: 'Fayllar tartibini oʻzgartirish' })
  reorderMedia(
    @Param('categoryId', new ParseUUIDPipe({ version: '4' })) categoryId: string,
    @Body() dto: ReorderMediaDto,
  ): Promise<AdminCategoryView> {
    return this.catalog.reorderMedia(categoryId, dto.mediaIds);
  }
}
