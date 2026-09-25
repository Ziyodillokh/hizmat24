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
  ValidateNested,
} from 'class-validator';
import { ComplexityLevel, ServiceMediaRole, ServicePriceKind } from '@prisma/client';
import {
  FAQ_ANSWER_MAX,
  FAQ_QUESTION_MAX,
  MAX_FAQ,
  MAX_HIGHLIGHTS,
  MAX_REQUIREMENTS,
  MAX_STEPS,
  STEP_TEXT_MAX,
  STEP_TITLE_MAX,
  WARRANTY_AMOUNT_MAX,
  WARRANTY_NOTE_MAX,
} from '@client/modules/catalog/domain/service-content';

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

/**
 * «Bizning jarayonimiz» ning bitta bosqichi.
 *
 * Tartib massivdagi oʻrni bilan beriladi — alohida `sortOrder` maydoni
 * kiritilmadi: admin qatorlarni surganda ikkita manba ikki xil natija
 * berardi.
 */
export class ServiceStepDto {
  @ApiProperty({ example: 'Nam tozalash' })
  @Transform(trimmed)
  @IsString()
  @Length(1, STEP_TITLE_MAX)
  title!: string;

  @ApiPropertyOptional({ example: 'Nam mikrofiber mato bilan tozalash' })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @Length(0, STEP_TEXT_MAX)
  description?: string;
}

/** Bitta savol-javob. Javobsiz savol qabul qilinmaydi. */
export class ServiceFaqDto {
  @ApiProperty({ example: 'Ushbu xizmat barcha lavabolar uchun amal qiladimi?' })
  @Transform(trimmed)
  @IsString()
  @Length(1, FAQ_QUESTION_MAX)
  question!: string;

  @ApiProperty({ example: 'Ha, standart lavabolarning barcha turlari uchun.' })
  @Transform(trimmed)
  @IsString()
  @Length(1, FAQ_ANSWER_MAX)
  answer!: string;
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

  @ApiPropertyOptional({ type: [ServiceStepDto], description: 'Bizning jarayonimiz' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_STEPS)
  @ValidateNested({ each: true })
  @Type(() => ServiceStepDto)
  steps?: ServiceStepDto[];

  @ApiPropertyOptional({ type: [ServiceFaqDto], description: 'Tez-tez beriladigan savollar' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_FAQ)
  @ValidateNested({ each: true })
  @Type(() => ServiceFaqDto)
  faq?: ServiceFaqDto[];

  @ApiPropertyOptional({ type: [String], description: 'Sizdan bizga nima kerak boʻladi' })
  @IsOptional()
  @Transform(cleanList)
  @IsArray()
  @ArrayMaxSize(MAX_REQUIREMENTS)
  @IsString({ each: true })
  @Length(1, 200, { each: true })
  requirements?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Ishonch bandlari' })
  @IsOptional()
  @Transform(cleanList)
  @IsArray()
  @ArrayMaxSize(MAX_HIGHLIGHTS)
  @IsString({ each: true })
  @Length(1, 120, { each: true })
  highlights?: string[];

  @ApiPropertyOptional({ description: 'Zarardan himoya izohi' })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @Length(0, WARRANTY_NOTE_MAX)
  warrantyNote?: string;

  @ApiPropertyOptional({ description: 'Qoplama chegarasi (soʻm)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(WARRANTY_AMOUNT_MAX)
  warrantyAmount?: number;

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

/**
 * Rasmning sahifadagi oʻrni va yorligʻi.
 *
 * Yuklash paytida emas, ALOHIDA soʻrov bilan: yuklash `multipart` orqali
 * ketadi va u yerga qoʻshimcha maydon qoʻshish faylni qabul qilish
 * mantigʻini murakkablashtirardi.
 */
export class UpdateMediaDto {
  @ApiPropertyOptional({ enum: ServiceMediaRole })
  @IsOptional()
  @IsEnum(ServiceMediaRole)
  role?: ServiceMediaRole;

  @ApiPropertyOptional({ example: 'Mikrofiber matolar' })
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @Length(0, 80)
  caption?: string;
}
