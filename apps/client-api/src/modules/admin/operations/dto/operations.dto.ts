import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus, SafetyAlertStatus, SafetyResolution } from '@prisma/client';
import { IsEnum, IsISO8601, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  /** Buyurtma raqami yoki mijoz telefoni — operator qoʻlida shu ikkisidan biri boʻladi. */
  @ApiPropertyOptional({ example: 'HZ-104901' })
  @IsOptional()
  @IsString()
  @Length(2, 40)
  search?: string;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;

  @ApiPropertyOptional({ example: '2026-09-30T23:59:59.000Z' })
  @IsOptional()
  @IsISO8601({ strict: true })
  to?: string;

  @ApiPropertyOptional({ default: 50, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class AdminCancelOrderDto {
  /**
   * Sabab MAJBURIY: u mijoz ekranida soʻzma-soʻz koʻrinadi va «operator
   * bekor qildi» degan javob mijozga hech narsa aytmasdi.
   */
  @ApiProperty({ example: 'Mijoz telefon orqali bekor qilishni soʻradi' })
  @IsString()
  @Length(10, 500, { message: 'Sababni kamida 10 belgi bilan yozing — mijoz buni koʻradi' })
  reason!: string;
}

export class ListAlertsQueryDto {
  @ApiPropertyOptional({ enum: SafetyAlertStatus })
  @IsOptional()
  @IsEnum(SafetyAlertStatus)
  status?: SafetyAlertStatus;
}

export class ResolveAlertDto {
  @ApiProperty({ enum: SafetyResolution })
  @IsEnum(SafetyResolution)
  resolution!: SafetyResolution;

  /** Izoh MAJBURIY: qaror sababisiz uni keyin qayta koʻrib boʻlmaydi. */
  @ApiProperty({ example: 'Mijoz bilan gaplashdim, kelgan odam boshqa usta edi' })
  @IsString()
  @Length(10, 1000, { message: 'Xulosani kamida 10 belgi bilan yozing' })
  note!: string;
}
