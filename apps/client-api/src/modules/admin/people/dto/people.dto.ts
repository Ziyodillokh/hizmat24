import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActorType, AuditAction } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { BLOCK_REASON_MAX, BLOCK_REASON_MIN } from '../domain/people-rules';

export class SearchQueryDto {
  @ApiPropertyOptional({ example: '+99890' })
  @IsOptional()
  @IsString()
  @Length(2, 60)
  search?: string;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class BlockDto {
  /** Sabab MAJBURIY: «kim, qachon, nega blokladi» degan savolga javob shu yerdan. */
  @ApiProperty({ example: 'Soxta buyurtmalar berdi, qoʻngʻiroqlarga javob bermadi' })
  @IsString()
  @Length(BLOCK_REASON_MIN, BLOCK_REASON_MAX, {
    message: `Sababni kamida ${BLOCK_REASON_MIN} belgi bilan yozing`,
  })
  reason!: string;
}

export class StatsQueryDto {
  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;

  @ApiPropertyOptional({ example: '2026-09-30T23:59:59.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  to?: string;
}

export class AuditQueryDto extends StatsQueryDto {
  @ApiPropertyOptional({ enum: AuditAction })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({ enum: ActorType })
  @IsOptional()
  @IsEnum(ActorType)
  actorType?: ActorType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  orderId?: string;

  @ApiPropertyOptional({ default: 100, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
