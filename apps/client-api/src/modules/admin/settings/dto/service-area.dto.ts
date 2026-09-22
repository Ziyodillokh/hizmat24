import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import {
  MAX_CITY_NAME_LENGTH,
  MAX_RADIUS_KM,
  MIN_CITY_NAME_LENGTH,
  MIN_RADIUS_KM,
} from '../domain/service-area-limits';

/**
 * Hududni tahrirlash — QISMAN yangilash.
 *
 * Har maydon ixtiyoriy: panelda radius alohida, shahar nomi alohida
 * oʻzgartiriladi. Yuborilmagan maydon TEGILMAYDI — aks holda bitta
 * maydonni yangilash qolganini boʻshatib yuborardi.
 */
export class UpdateServiceAreaDto {
  @ApiPropertyOptional({ example: 'Namangan' })
  @IsOptional()
  @IsString()
  @Length(MIN_CITY_NAME_LENGTH, MAX_CITY_NAME_LENGTH)
  cityName?: string;

  @ApiPropertyOptional({ example: 40.9983 })
  @IsOptional()
  @IsLatitude()
  centerLat?: number;

  @ApiPropertyOptional({ example: 71.6726 })
  @IsOptional()
  @IsLongitude()
  centerLng?: number;

  @ApiPropertyOptional({ example: 12, minimum: MIN_RADIUS_KM, maximum: MAX_RADIUS_KM })
  @IsOptional()
  @IsNumber()
  @Min(MIN_RADIUS_KM)
  @Max(MAX_RADIUS_KM)
  radiusKm?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
