import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsOptional, IsString, Length } from 'class-validator';

export class AddressDto {
  @ApiProperty({ example: 'Toshkent, Chilonzor 9-kvartal, 42-uy' })
  @IsString()
  @Length(5, 300)
  label: string;

  @ApiProperty({ example: 41.311081 })
  @IsLatitude()
  lat: number;

  @ApiProperty({ example: 69.240562 })
  @IsLongitude()
  lng: number;

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

  @ApiPropertyOptional({ example: "Domofon ishlamaydi, qo'ng'iroq qiling" })
  @IsOptional()
  @IsString()
  @Length(1, 300)
  comment?: string;
}
