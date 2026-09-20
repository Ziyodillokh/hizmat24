import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: "Baho 1 dan kam boʻlishi mumkin emas" })
  @Max(5, { message: "Baho 5 dan koʻp boʻlishi mumkin emas" })
  stars: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  comment?: string;

  /**
   * Tanlangan teglar — ilova ularni baholash ekranida yigʻadi va chekda
   * koʻrsatadi. Matnning oʻzi saqlanadi: kalitlar lugʻati ilovada yashaydi
   * va u oʻzgarganda eski bahodagi yozuv maʼnosiz boʻlib qolmasin.
   */
  @ApiPropertyOptional({ type: [String], maxItems: 6 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @Length(1, 60, { each: true })
  tags?: string[];
}
