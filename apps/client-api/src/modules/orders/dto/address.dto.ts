import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsOptional, IsString, Length } from 'class-validator';

export class AddressDto {
  @ApiProperty({ example: 'Namangan, Uychi koʻchasi 12, 4-uy' })
  @IsString()
  @Length(5, 300)
  label: string;

  /**
   * Koordinata IXTIYORIY: ilovada hali xarita yoʻq (K1 bosqichigacha) va
   * soxta koordinata yozish taqiqlanadi. Koordinatasiz buyurtma ham usta
   * topadi — faqat masofa boʻyicha emas, reyting boʻyicha.
   */
  @ApiPropertyOptional({ example: 40.9983 })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ example: 71.6726 })
  @IsOptional()
  @IsLongitude()
  lng?: number;

  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  entrance?: string;

  @ApiPropertyOptional({ example: '5' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  floor?: string;

  @ApiPropertyOptional({ example: '17' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  apartment?: string;

  @ApiPropertyOptional({ example: "Domofon ishlamaydi, qoʻngʻiroq qiling" })
  @IsOptional()
  @IsString()
  @Length(1, 300)
  comment?: string;
}
