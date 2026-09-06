import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ example: "Muammo o'zi hal bo'ldi" })
  @IsString()
  @Length(3, 500)
  reason: string;
}
