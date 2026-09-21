import { ApiPropertyOptional } from '@nestjs/swagger';
import { MasterApplicationStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '@client/modules/orders/dto/pagination.dto';

export const MIN_SEARCH_LENGTH = 2;
export const MAX_SEARCH_LENGTH = 120;

export class ListApplicationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: MasterApplicationStatus })
  @IsOptional()
  @IsEnum(MasterApplicationStatus)
  status?: MasterApplicationStatus;

  /** Ism yoki telefon boʻyicha qidiruv — moderator odam nomi bilan qidiradi. */
  @ApiPropertyOptional({ example: 'Alisher' })
  @IsOptional()
  @IsString()
  @Length(MIN_SEARCH_LENGTH, MAX_SEARCH_LENGTH)
  search?: string;
}
