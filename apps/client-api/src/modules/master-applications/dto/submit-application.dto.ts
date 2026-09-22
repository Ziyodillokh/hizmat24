import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MasterExperienceLevel } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
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
import {
  MAX_ABOUT_LENGTH,
  MAX_DISTRICTS,
  MAX_DISTRICT_LENGTH,
  MAX_FULL_NAME_LENGTH,
  MAX_PROFESSION_LENGTH,
  MAX_REQUESTED_CATEGORIES,
  MIN_ABOUT_LENGTH,
  MIN_DISTRICT_LENGTH,
  MIN_FULL_NAME_LENGTH,
  MIN_PROFESSION_LENGTH,
  MIN_REQUESTED_CATEGORIES,
  WORK_HOUR_MAX,
  WORK_HOUR_MIN,
} from '../domain/application-rules';

/**
 * Ariza soʻrovining SHAKLI. Chegaralar `application-rules.ts` dan olinadi —
 * ikki joyda ikki xil son turib qolmasligi uchun.
 *
 * Telefon raqami bu yerda YOʻQ: u tokendan olinadi. Soʻrov tanasidan
 * olinsa, odam begona raqamga ariza yozib yuborishi mumkin boʻlardi.
 */
export class SubmitApplicationDto {
  @ApiProperty({ example: 'Alisher Karimov' })
  @IsString()
  @Length(MIN_FULL_NAME_LENGTH, MAX_FULL_NAME_LENGTH)
  fullName: string;

  /*
   * Quyidagilar IXTIYORIY.
   *
   * Platforma faqat santexnikaga qaratildi: kasbni soʻrash maʼnosiz —
   * hamma usta santexnik. Usta nimani qila olishini `requestedCategoryIds`
   * bilan OʻZI aytadi, shuning uchun tajriba darajasi ham keraksiz: ish
   * ustaning darajasiga emas, yoqib qoʻygan xizmatiga qarab tushadi.
   * Tuman va ish vaqti ham soʻralmaydi — smena tugmasi oʻsha ishni
   * bajaradi.
   *
   * Ustunlar bazada QOLADI va eski arizalar buzilmaydi; yangi ariza
   * ularsiz ham qabul qilinadi.
   */
  @ApiPropertyOptional({ example: 'Santexnik' })
  @IsOptional()
  @IsString()
  @Length(MIN_PROFESSION_LENGTH, MAX_PROFESSION_LENGTH)
  profession?: string;

  @ApiPropertyOptional({ enum: MasterExperienceLevel })
  @IsOptional()
  @IsEnum(MasterExperienceLevel)
  experienceLevel?: MasterExperienceLevel;

  @ApiPropertyOptional({
    description:
      'Foydalanuvchining DAʼVOSI — tasdiq emas. Panel buni «tekshirilmagan» deb koʻrsatadi.',
  })
  @IsOptional()
  @IsBoolean()
  claimsCertificate?: boolean;

  @ApiPropertyOptional({ example: 'Sakkiz yildan beri santexnika bilan shugʻullanaman...' })
  @IsOptional()
  @IsString()
  @Length(MIN_ABOUT_LENGTH, MAX_ABOUT_LENGTH)
  about?: string;

  @ApiPropertyOptional({ example: ['Chilonzor', 'Yunusobod'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_DISTRICTS)
  @IsString({ each: true })
  @Length(MIN_DISTRICT_LENGTH, MAX_DISTRICT_LENGTH, { each: true })
  districts?: string[];

  @ApiPropertyOptional({ minimum: WORK_HOUR_MIN, maximum: WORK_HOUR_MAX })
  @IsOptional()
  @IsInt()
  @Min(WORK_HOUR_MIN)
  @Max(WORK_HOUR_MAX)
  workFrom?: number;

  @ApiPropertyOptional({ minimum: WORK_HOUR_MIN, maximum: WORK_HOUR_MAX })
  @IsOptional()
  @IsInt()
  @Min(WORK_HOUR_MIN)
  @Max(WORK_HOUR_MAX)
  workTo?: number;

  @ApiProperty({ description: 'Usta oʻzi soʻragan xizmatlar', type: [String] })
  @IsArray()
  @ArrayMinSize(MIN_REQUESTED_CATEGORIES)
  @ArrayMaxSize(MAX_REQUESTED_CATEGORIES)
  @IsUUID('4', { each: true })
  requestedCategoryIds: string[];
}
