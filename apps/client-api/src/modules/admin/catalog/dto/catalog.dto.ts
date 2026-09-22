import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ComplexityLevel, ServicePriceKind } from '@prisma/client';

/** Narx soʻmda, butun son. Tiyin yoʻq (biznes-qoida 5.1). */
const MAX_PRICE = 100_000_000;
const MAX_LIST_ITEMS = 20;

const trimmed = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Boʻsh qatorlar tashlanadi — roʻyxatda koʻrinmas band qolmasin. */
const cleanList = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? value.map((item) => (typeof item === 'string' ? item.trim() : item)).filter(Boolean)
    : value;

export class UpsertGroupDto {
  @ApiProperty({ example: 'Santexnika' })
  @Transform(trimmed)
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: 'plumbing' })
  @Transform(trimmed)
  @IsString()
  @Length(2, 60)
  iconKey!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertCategoryDto {
  @ApiProperty({ example: 'Kran taʼmirlash' })
  @Transform(trimmed)
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiPropertyOptional({ description: 'Roʻyxatdagi bir qatorli izoh' })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @Length(0, 200)
  summary?: string;

  @ApiPropertyOptional({ description: 'Xizmat sahifasidagi batafsil tavsif' })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @Length(0, 4000)
  details?: string;

  @ApiPropertyOptional({ type: [String], description: 'Narx ichiga kiradi' })
  @IsOptional()
  @Transform(cleanList)
  @IsArray()
  @ArrayMaxSize(MAX_LIST_ITEMS)
  @IsString({ each: true })
  @Length(1, 200, { each: true })
  includes?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Narx ichiga kirmaydi' })
  @IsOptional()
  @Transform(cleanList)
  @IsArray()
  @ArrayMaxSize(MAX_LIST_ITEMS)
  @IsString({ each: true })
  @Length(1, 200, { each: true })
  excludes?: string[];

  @ApiProperty({ description: 'Soʻmda, butun son' })
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE)
  basePrice!: number;

  @ApiPropertyOptional({ enum: ServicePriceKind })
  @IsOptional()
  @IsEnum(ServicePriceKind)
  priceKind?: ServicePriceKind;

  @ApiPropertyOptional({ description: 'Taxminiy davomiylik (daqiqa)' })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  durationMinutes?: number;

  @ApiPropertyOptional({ enum: ComplexityLevel })
  @IsOptional()
  @IsEnum(ComplexityLevel)
  complexityLevel?: ComplexityLevel;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @Length(0, 60)
  iconKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReorderMediaDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  @Type(() => String)
  mediaIds!: string[];
}
