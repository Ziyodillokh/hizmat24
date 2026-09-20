import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsOptional, IsString, Length } from 'class-validator';

export class AddressDto {
  @ApiProperty({ example: 'Toshkent, Chilonzor 9-kvartal, 42-uy' })
  @IsString()
  @Length(5, 300)
  label: string;

  /**
   * Koordinata IXTIYORIY: ilovada hali xarita yoʻq (K1 bosqichigacha) va
   * soxta koordinata yozish taqiqlanadi. Koordinatasiz buyurtma ham usta
   * topadi — faqat masofa boʻyicha emas, reyting boʻyicha.
   */
  @ApiPropertyOptional({ example: 41.311081 })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiPropertyOptional({ example: 69.240562 })
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
