import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class ConfirmMasterDto {
  @ApiProperty({
    description:
      'true — kelgan usta ilovadagi usta bilan bir xil; false — boshqa odam keldi (xavfsizlik signali)',
  })
  @IsBoolean()
  confirmed: boolean;

  @ApiPropertyOptional({ description: "confirmed=false bo'lganda ixtiyoriy izoh" })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  note?: string;
}
